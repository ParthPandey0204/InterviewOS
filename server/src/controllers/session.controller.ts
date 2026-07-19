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