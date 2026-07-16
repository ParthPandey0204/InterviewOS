import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { prisma } from "../prisma/client.js";
import { HttpError } from "../middleware/error.js";
import {
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "./token.service.js";

const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_SALT_ROUNDS = 12;

type RegisterInput = {
  email?: unknown;
  password?: unknown;
  name?: unknown;
};

type LoginInput = {
  email?: unknown;
  password?: unknown;
};

const normalizeEmail = (email: unknown) => {
  if (typeof email !== "string" || !email.trim()) {
    throw new HttpError(400, "Email is required");
  }

  return email.trim().toLowerCase();
};

const normalizePassword = (password: unknown) => {
  if (typeof password !== "string") {
    throw new HttpError(400, "Password is required");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }

  return password;
};

const normalizeName = (name: unknown) => {
  if (typeof name !== "string") {
    return undefined;
  }

  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const hashToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

const publicUser = (user: { id: string; email: string; name: string | null }) => ({
  id: user.id,
  email: user.email,
  name: user.name
});

const issueTokenPair = async (user: { id: string; email: string }) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt: getRefreshTokenExpiry()
    }
  });

  return { accessToken, refreshToken };
};

export const register = async (input: RegisterInput) => {
  const email = normalizeEmail(input.email);
  const password = normalizePassword(input.password);
  const name = normalizeName(input.name);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new HttpError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash
    }
  });

  return {
    user: publicUser(user),
    tokens: await issueTokenPair(user)
  };
};

export const login = async (input: LoginInput) => {
  const email = normalizeEmail(input.email);

  if (typeof input.password !== "string") {
    throw new HttpError(400, "Password is required");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  return {
    user: publicUser(user),
    tokens: await issueTokenPair(user)
  };
};

export const refresh = async (refreshToken: unknown) => {
  if (typeof refreshToken !== "string" || !refreshToken) {
    throw new HttpError(400, "Refresh token is required");
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true }
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date() ||
    storedToken.userId !== payload.sub
  ) {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() }
  });

  return {
    user: publicUser(storedToken.user),
    tokens: await issueTokenPair(storedToken.user)
  };
};

export const logout = async (refreshToken: unknown) => {
  if (typeof refreshToken !== "string" || !refreshToken) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshToken),
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  });
};