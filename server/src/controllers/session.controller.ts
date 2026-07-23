import type { Request, Response } from "express";
import { asyncHandler, HttpError } from "../middleware/error.js";
import * as sessionService from "../services/session.service.js";

const requireUserId = (request: Request) => {
  if (!request.user?.sub) {
    throw new HttpError(401, "Authentication required");
  }

  return request.user.sub;
};

const requireSessionId = (request: Request) => {
  const { id } = request.params;

  if (typeof id !== "string" || !id.trim()) {
    throw new HttpError(400, "Session id is required");
  }

  return id;
};

const writeSse = (response: Response, event: string, data: unknown) => {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const createSession = asyncHandler(async (request: Request, response: Response) => {
  const userId = requireUserId(request);
  const session = await sessionService.createSession(userId, request.body);

  response.status(201).json({ session });
});

export const getSessionById = asyncHandler(async (request: Request, response: Response) => {
  const userId = requireUserId(request);
  const sessionId = requireSessionId(request);
  const session = await sessionService.getSessionById(userId, sessionId);

  response.json({ session });
});

export const listUserSessions = asyncHandler(async (request: Request, response: Response) => {
  const userId = requireUserId(request);
  const sessions = await sessionService.listUserSessions(userId);

  response.json({ sessions });
});

export const createTurn = asyncHandler(async (request: Request, response: Response) => {
  const userId = requireUserId(request);
  const sessionId = requireSessionId(request);
  const result = await sessionService.createTurn(userId, sessionId, request.body);

  response.status(201).json(result);
});

export const createTurnStream = asyncHandler(async (request: Request, response: Response) => {
  const userId = requireUserId(request);
  const sessionId = requireSessionId(request);
  const turnStream = await sessionService.createTurnStream(userId, sessionId, request.body);
  let nextQuestion = "";

  response.status(200);
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders?.();

  writeSse(response, "ready", { provider: turnStream.provider });

  try {
    for await (const chunk of turnStream.stream) {
      nextQuestion += chunk;
      writeSse(response, "delta", { content: chunk });
    }

    const result = await turnStream.commit(nextQuestion);
    writeSse(response, "done", result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Streaming turn failed";
    writeSse(response, "error", { message });
  } finally {
    response.end();
  }
});
