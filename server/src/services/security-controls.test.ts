import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import { createRateLimiter } from "../middleware/rate-limit.js";
import { revokeRefreshTokenOnce } from "./refresh-token-rotation.js";

test("refresh rotation allows only one concurrent use of a token", async () => {
  let active = true;
  const revokeIfActive = async () => {
    if (!active) return { count: 0 };
    active = false;
    return { count: 1 };
  };

  const results = await Promise.all([
    revokeRefreshTokenOnce(revokeIfActive),
    revokeRefreshTokenOnce(revokeIfActive)
  ]);
  assert.deepEqual(results.sort(), [false, true]);
});

test("auth rate limiter rejects requests over the limit and resets its window", () => {
  let timestamp = 1_000;
  const limiter = createRateLimiter({ windowMs: 60_000, limit: 2, now: () => timestamp });
  const invoke = (ip: string) => {
    const headers: Record<string, string | number> = {};
    let status = 200;
    let payload: unknown;
    let nextCalled = false;
    const request = { ip, socket: { remoteAddress: ip } } as Request;
    const response = {
      setHeader: (name: string, value: string | number) => { headers[name] = value; return response; },
      status: (value: number) => { status = value; return response; },
      json: (value: unknown) => { payload = value; return response; }
    } as unknown as Response;
    limiter(request, response, () => { nextCalled = true; });
    return { headers, status, payload, nextCalled };
  };

  assert.equal(invoke("192.0.2.1").nextCalled, true);
  assert.equal(invoke("192.0.2.1").nextCalled, true);
  const limited = invoke("192.0.2.1");
  assert.equal(limited.status, 429);
  assert.equal(limited.nextCalled, false);
  assert.equal(limited.headers["Retry-After"], 60);
  timestamp += 60_001;
  assert.equal(invoke("192.0.2.1").nextCalled, true);
  assert.equal(invoke("192.0.2.2").nextCalled, true);
});
