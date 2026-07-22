import { QuestionDifficulty, SessionStatus, TurnRole } from "@prisma/client";
import { config } from "../config.js";
import { HttpError } from "../middleware/error.js";
import { prisma } from "../prisma/client.js";
import { buildNextQuestionMessages } from "./interview-prompts.service.js";
import { createLLMService, type LLMProvider } from "./llm/index.js";

type CreateSessionInput = {
  mode?: unknown;
  difficulty?: unknown;
  company?: unknown;
};

type CreateTurnInput = {
  answer?: unknown;
  provider?: unknown;
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

const normalizeProvider = (provider: unknown): LLMProvider => {
  const candidate = typeof provider === "string" ? provider : config.llm.defaultProvider;

  if (candidate === "gemini" || candidate === "groq") {
    return candidate;
  }

  throw new HttpError(400, "Provider must be gemini or groq");
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

const turnSelect = {
  id: true,
  role: true,
  content: true,
  metadata: true,
  position: true,
  createdAt: true
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
        select: turnSelect
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

export const createTurn = async (
  userId: string,
  sessionId: string,
  input: CreateTurnInput
) => {
  const answer = normalizeText(input.answer, "Answer");
  const provider = normalizeProvider(input.provider);

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId
    },
    select: {
      id: true,
      mode: true,
      difficulty: true,
      targetCompany: true,
      targetRole: true,
      status: true,
      turns: {
        orderBy: { position: "asc" },
        select: {
          role: true,
          content: true
        }
      }
    }
  });

  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  if (session.status !== SessionStatus.ACTIVE) {
    throw new HttpError(409, "Cannot add turns to an inactive session");
  }

  const llm = createLLMService(provider);
  const llmResult = await llm.generate({
    messages: buildNextQuestionMessages(session, session.turns, answer),
    options: {
      temperature: 0.7,
      maxTokens: 300
    }
  });

  const nextQuestion = llmResult.content.trim();

  if (!nextQuestion) {
    throw new HttpError(502, "LLM returned an empty next question");
  }

  const [userTurn, assistantTurn] = await prisma.$transaction(async (tx) => {
    const latestTurn = await tx.turn.findFirst({
      where: { sessionId },
      orderBy: { position: "desc" },
      select: { position: true }
    });
    const position = (latestTurn?.position ?? -1) + 1;

    const createdUserTurn = await tx.turn.create({
      data: {
        sessionId,
        role: TurnRole.USER,
        content: answer,
        position
      },
      select: turnSelect
    });
    const createdAssistantTurn = await tx.turn.create({
      data: {
        sessionId,
        role: TurnRole.ASSISTANT,
        content: nextQuestion,
        position: position + 1,
        metadata: {
          provider: llmResult.provider,
          model: llmResult.model,
          usage: llmResult.usage ?? null
        }
      },
      select: turnSelect
    });

    await tx.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    });

    return [createdUserTurn, createdAssistantTurn] as const;
  });

  return {
    turn: userTurn,
    nextQuestion: assistantTurn
  };
};


