import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export const asyncHandler = (
  handler: (request: Request, response: Response, next: NextFunction) => Promise<void>
) => {
  return (request: Request, response: Response, next: NextFunction) => {
    handler(request, response, next).catch(next);
  };
};

export const notFoundHandler = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  next(new HttpError(404, `Route not found: ${request.method} ${request.path}`));
};

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  void _next;

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const exposeDetails = config.nodeEnv !== "production";

  if (statusCode === 500 && exposeDetails) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: {
      message: statusCode === 500 ? "Internal server error" : error.message,
      ...(error instanceof HttpError && error.details ? { details: error.details } : {}),
      ...(statusCode === 500 && exposeDetails ? { details: error.message } : {})
    }
  });
};