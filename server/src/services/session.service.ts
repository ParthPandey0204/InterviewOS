import { QuestionDifficulty } from "@prisma/client";
import { HttpError } from "../middleware/error.js";
import { prisma } from "../prisma/client.js";

type CreateSessionInput = {
  mode?: unknown;
  difficulty?: unknown;
  company?: unknown;
};

const normalizeText = (value: unknown, fieldName: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${fieldName} is required`);
  }

  return value.trim();
};

const normalizeOptionalText = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeDifficulty = (difficulty: unknown) => {
  if (typeof difficulty !== "string") {
    throw new HttpError(400, "Difficulty is required");
  }

  const normalized = difficulty.trim().toUpperCase();

  if (!Object.values(QuestionDifficulty).includes(normalized as QuestionDifficulty)) {
    throw new HttpError(400, "Difficulty must be EASY, MEDIUM, or HARD");
  }

  return normalized as QuestionDifficulty;
};

const sessionSelect = {
  id: true,
  userId: true,
  title: true,
  mode: true,
  difficulty: true,
  targetRole: true,
  targetCompany: true,
  status: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
  updatedAt: true
};

export const createSession = async (userId: string, input: CreateSessionInput) => {
  const mode = normalizeText(input.mode, "Mode");
  const difficulty = normalizeDifficulty(input.difficulty);
  const company = normalizeOptionalText(input.company);

  return prisma.session.create({
    data: {
      userId,
      mode,
      difficulty,
      targetCompany: company,
      title: company ? `${company} ${mode}` : mode
    },
    select: sessionSelect
  });
};

export const getSessionById = async (userId: string, sessionId: string) => {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId
    },
    select: {
      ...sessionSelect,
      turns: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          metadata: true,
          position: true,
          createdAt: true
        }
      },
      topicStats: {
        orderBy: { topic: "asc" },
        select: {
          id: true,
          topic: true,
          attempts: true,
          correct: true,
          score: true,
          durationSeconds: true,
          lastSeenAt: true
        }
      }
    }
  });

  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  return session;
};

export const listUserSessions = async (userId: string) => {
  return prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: sessionSelect
  });
};