import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";

export type JwtPayload = {
  sub: string;
  email: string;
};

type TokenUser = {
  id: string;
  email: string;
};

const parseDurationMs = (duration: string) => {
  const match = /^(\d+)([smhd])$/.exec(duration);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * multipliers[unit as keyof typeof multipliers];
};

const signToken = (
  user: TokenUser,
  secret: string,
  expiresIn: SignOptions["expiresIn"]
) => {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email
    },
    secret,
    { expiresIn }
  );
};

const verifyToken = (token: string, secret: string) => {
  const payload = jwt.verify(token, secret);

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Invalid token payload");
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email : ""
  } satisfies JwtPayload;
};

export const signAccessToken = (user: TokenUser) => {
  return signToken(user, config.jwt.accessSecret, config.jwt.accessExpiresIn as SignOptions["expiresIn"]);
};

export const signRefreshToken = (user: TokenUser) => {
  return signToken(user, config.jwt.refreshSecret, config.jwt.refreshExpiresIn as SignOptions["expiresIn"]);
};

export const verifyAccessToken = (token: string) => {
  return verifyToken(token, config.jwt.accessSecret);
};

export const verifyRefreshToken = (token: string) => {
  return verifyToken(token, config.jwt.refreshSecret);
};

export const getRefreshTokenExpiry = () => {
  return new Date(Date.now() + parseDurationMs(config.jwt.refreshExpiresIn));
};