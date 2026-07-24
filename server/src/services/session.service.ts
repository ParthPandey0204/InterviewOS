import { QuestionDifficulty, SessionStatus, TurnRole } from "@prisma/client";
import { config } from "../config.js";
import { HttpError } from "../middleware/error.js";
import { prisma } from "../prisma/client.js";
import { buildNextQuestionMessages } from "./interview-prompts.service.js";
import { createLLMService, type LLMGenerateResult, type LLMProvider } from "./llm/index.js";
import { defaultModelForProvider, logUsage } from "./usage-log.service.js";

type CreateSessionInput = {
  mode?: unknown;
  difficulty?: unknown;
  company?: unknown;
};

type CreateTurnInput = {
  answer?: unknown;
  provider?: unknown;
};

type ActiveSessionForTurn = {
  id: string;
  mode: string;
  difficulty: QuestionDifficulty;
  targetCompany: string | null;
  targetRole: string | null;
  status: SessionStatus;
  turns: Array<{ role: TurnRole; content: string }>;
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

const getActiveSessionForTurn = async (
  userId: string,
  sessionId: string
): Promise<ActiveSessionForTurn> => {
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

  return session;
};

const persistTurnPair = async (input: {
  sessionId: string;
  answer: string;
  nextQuestion: string;
  provider: LLMProvider;
  model?: string;
  usage?: unknown;
}) => {
  return prisma.$transaction(async (tx) => {
    const latestTurn = await tx.turn.findFirst({
      where: { sessionId: input.sessionId },
      orderBy: { position: "desc" },
      select: { position: true }
    });
    const position = (latestTurn?.position ?? -1) + 1;

    const createdUserTurn = await tx.turn.create({
      data: {
        sessionId: input.sessionId,
        role: TurnRole.USER,
        content: input.answer,
        position
      },
      select: turnSelect
    });
    const createdAssistantTurn = await tx.turn.create({
      data: {
        sessionId: input.sessionId,
        role: TurnRole.ASSISTANT,
        content: input.nextQuestion,
        position: position + 1,
        metadata: {
          provider: input.provider,
          model: input.model ?? null,
          usage: input.usage ?? null
        }
      },
      select: turnSelect
    });

    await tx.session.update({
      where: { id: input.sessionId },
      data: { updatedAt: new Date() }
    });

    return [createdUserTurn, createdAssistantTurn] as const;
  });
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
  const session = await getActiveSessionForTurn(userId, sessionId);
  const llm = createLLMService(provider);
  const startedAt = Date.now();

  let llmResult: LLMGenerateResult;

  try {
    llmResult = await llm.generate({
      messages: buildNextQuestionMessages(session, session.turns, answer),
      options: {
        temperature: 0.7,
        maxTokens: 300
      }
    });
    const latencyMs = Date.now() - startedAt;

    await logUsage({
      userId,
      sessionId,
      provider: llmResult.provider,
      model: llmResult.model,
      operation: "turn.generate",
      latencyMs,
      usage: llmResult.usage,
      metadata: { status: "success" }
    });
  } catch (error) {
    await logUsage({
      userId,
      sessionId,
      provider,
      operation: "turn.generate",
      latencyMs: Date.now() - startedAt,
      metadata: {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown LLM error"
      }
    });

    throw error;
  }

  const nextQuestion = llmResult.content.trim();

  if (!nextQuestion) {
    throw new HttpError(502, "LLM returned an empty next question");
  }

  const [userTurn, assistantTurn] = await persistTurnPair({
    sessionId,
    answer,
    nextQuestion,
    provider: llmResult.provider,
    model: llmResult.model,
    usage: llmResult.usage
  });

  return {
    turn: userTurn,
    nextQuestion: assistantTurn
  };
};

export const createTurnStream = async (
  userId: string,
  sessionId: string,
  input: CreateTurnInput
) => {
  const answer = normalizeText(input.answer, "Answer");
  const provider = normalizeProvider(input.provider);
  const model = defaultModelForProvider(provider);
  const session = await getActiveSessionForTurn(userId, sessionId);
  const llm = createLLMService(provider);
  const providerStream = llm.generateStream({
    messages: buildNextQuestionMessages(session, session.turns, answer),
    options: {
      temperature: 0.7,
      maxTokens: 300
    }
  });

  async function* stream() {
    const startedAt = Date.now();

    try {
      for await (const chunk of providerStream) {
        yield chunk;
      }

      await logUsage({
        userId,
        sessionId,
        provider,
        model,
        operation: "turn.generate.stream",
        latencyMs: Date.now() - startedAt,
        metadata: { status: "success" }
      });
    } catch (error) {
      await logUsage({
        userId,
        sessionId,
        provider,
        model,
        operation: "turn.generate.stream",
        latencyMs: Date.now() - startedAt,
        metadata: {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown LLM error"
        }
      });

      throw error;
    }
  }

  return {
    provider,
    stream: stream(),
    commit: async (nextQuestionContent: string) => {
      const nextQuestion = nextQuestionContent.trim();

      if (!nextQuestion) {
        throw new HttpError(502, "LLM returned an empty next question");
      }

      const [userTurn, assistantTurn] = await persistTurnPair({
        sessionId,
        answer,
        nextQuestion,
        provider,
        model
      });

      return {
        turn: userTurn,
        nextQuestion: assistantTurn
      };
    }
  };
};


