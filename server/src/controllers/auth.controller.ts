import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.register(request.body);
  response.status(201).json(result);
});

export const login = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.login(request.body);
  response.json(result);
});

export const refresh = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.refresh(request.body?.refreshToken);
  response.json(result);
});

export const logout = asyncHandler(async (request: Request, response: Response) => {
  await authService.logout(request.body?.refreshToken);
  response.status(204).send();
});

export const me = asyncHandler(async (request: Request, response: Response) => {
  response.json({ user: request.user });
});