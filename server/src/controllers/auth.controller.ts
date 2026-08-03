import type { CookieOptions, Request, Response } from "express";
import { asyncHandler } from "../middleware/error.js";
import * as authService from "../services/auth.service.js";

const COOKIE_NAME = "refreshToken";

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

export const register = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.register(request.body);
  response.cookie(COOKIE_NAME, result.tokens.refreshToken, getCookieOptions());
  response.status(201).json({
    user: result.user,
    accessToken: result.tokens.accessToken
  });
});

export const login = asyncHandler(async (request: Request, response: Response) => {
  const result = await authService.login(request.body);
  response.cookie(COOKIE_NAME, result.tokens.refreshToken, getCookieOptions());
  response.json({
    user: result.user,
    accessToken: result.tokens.accessToken
  });
});

export const refresh = asyncHandler(async (request: Request, response: Response) => {
  const refreshToken = request.cookies?.[COOKIE_NAME] || request.body?.refreshToken;
  const result = await authService.refresh(refreshToken);
  response.cookie(COOKIE_NAME, result.tokens.refreshToken, getCookieOptions());
  response.json({
    user: result.user,
    accessToken: result.tokens.accessToken
  });
});

export const logout = asyncHandler(async (request: Request, response: Response) => {
  const refreshToken = request.cookies?.[COOKIE_NAME] || request.body?.refreshToken;
  await authService.logout(refreshToken);
  response.clearCookie(COOKIE_NAME, getCookieOptions());
  response.status(204).send();
});

export const me = asyncHandler(async (request: Request, response: Response) => {
  response.json({ user: request.user });
});