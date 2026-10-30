import type { RequestHandler } from "express";

type RateLimitOptions = {
  windowMs: number;
  limit: number;
  now?: () => number;
};

export const createRateLimiter = ({ windowMs, limit, now = Date.now }: RateLimitOptions): RequestHandler => {
  const clients = new Map<string, { count: number; resetAt: number }>();

  return (request, response, next) => {
    const key = request.ip || request.socket.remoteAddress || "unknown";
    const timestamp = now();
    let entry = clients.get(key);

    if (!entry || entry.resetAt <= timestamp) {
      entry = { count: 0, resetAt: timestamp + windowMs };
      clients.set(key, entry);
    }

    entry.count += 1;
    response.setHeader("RateLimit-Limit", limit);
    response.setHeader("RateLimit-Remaining", Math.max(0, limit - entry.count));
    response.setHeader("RateLimit-Reset", Math.ceil(entry.resetAt / 1000));

    if (entry.count > limit) {
      response.setHeader("Retry-After", Math.max(1, Math.ceil((entry.resetAt - timestamp) / 1000)));
      response.status(429).json({ error: { message: "Too many authentication attempts. Please try again later." } });
      return;
    }

    if (clients.size > 10_000) {
      for (const [clientKey, client] of clients) {
        if (client.resetAt <= timestamp) clients.delete(clientKey);
      }
    }

    next();
  };
};

export const credentialRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 10 });
export const refreshRateLimit = createRateLimiter({ windowMs: 15 * 60 * 1000, limit: 30 });
