import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../services/token.service.js";
import { HttpError } from "./error.js";

export const requireAuth = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  const authorization = request.header("Authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    next(new HttpError(401, "Missing bearer token"));
    return;
  }

  try {
    request.user = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
};