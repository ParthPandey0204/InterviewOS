import { QuestionDifficulty, SessionStatus, TurnRole } from "@prisma/client";
import { config } from "../config.js";
import { HttpError } from "../middleware/error.js";
import { prisma } from "../prisma/client.js";
import { evaluateAnswer } from "./answer-evaluation.service.js";
import { buildInterviewerSystemPrompt, buildNextQuestionMessages } from "./interview-prompts.service.js";
import { createLLMService, type LLMGenerateRequest, type LLMGenerateResult, type LLMProvider } from "./llm/index.js";
import { defaultModelForProvider, logUsage } from "./usage-log.service.js";
import { indexQuestion } from "./question-embedding.service.js";
import { recordEvaluationHistory } from "./evaluation-history.service.js";
import { selectConceptualReviewFocus } from "./conceptual-review.service.js";
import { refreshUserClusterInsights } from "./clustering.service.js";

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
  userId: string;
  mode: string;
  difficulty: QuestionDifficulty;
  sessionId: string;
  answer: string;
  nextQuestion: string;
  provider: LLMProvider;
  model?: string;
  usage?: unknown;
  evaluation?: unknown;
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
        position,
        metadata: input.evaluation ? { evaluation: input.evaluation } : undefined
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

    void indexQuestion({ userId: input.userId, prompt: input.nextQuestion, mode: input.mode, difficulty: input.difficulty }).catch(error => {
      console.error("Question embedding failed", error);
    });

    return [createdUserTurn, createdAssistantTurn] as const;
  });
};

export const createSession = async (userId: string, input: CreateSessionInput) => {
  const mode = normalizeText(input.mode, "Mode");
  const difficulty = normalizeDifficulty(input.difficulty);
  const company = normalizeOptionalText(input.company);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const sessionsToday = await prisma.session.count({ where: { userId, createdAt: { gte: today } } });
  if (sessionsToday >= config.dailySessionCap) {
    throw new HttpError(429, `Daily session limit reached (${config.dailySessionCap}). Please come back tomorrow.`);
  }

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
    select: {
      ...sessionSelect,
      topicStats: {
        select: { score: true }
      }
    }
  });
};

export const deleteUserSessions = async (userId: string) => {
  const result = await prisma.session.deleteMany({ where: { userId } });
  return result.count;
};

export const getAnalytics = async (userId: string) => {
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      mode: true,
      createdAt: true,
      topicStats: {
        select: { score: true }
      }
    }
  });

  const topicStats = await prisma.topicStats.findMany({
    where: { session: { userId } },
    select: { topic: true, score: true }
  });

  // Calculate topic-wise averages
  const topicMap = new Map<string, { total: number; count: number }>();
  for (const stat of topicStats) {
    if (stat.score !== null) {
      const current = topicMap.get(stat.topic) || { total: 0, count: 0 };
      topicMap.set(stat.topic, { total: current.total + stat.score, count: current.count + 1 });
    }
  }

  const topicAverages = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    averageScore: Math.round((data.total / data.count) * 20) // Assuming max score is 5, scale to 100
  }));

  // Calculate session scores over time
  const sessionsOverTime = sessions.map(session => {
    const scores = session.topicStats.map(s => s.score).filter((s): s is number => s !== null);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      date: session.createdAt.toISOString().split("T")[0],
      score: Math.round(avg * 20),
      mode: session.mode
    };
  });

  // @ts-ignore - Ignore type error if prisma hasn't been generated yet
  const clusterInsights = await prisma.userClusterInsight?.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { clusterLabel: true, averageScore: true, questionCount: true, sessionCount: true }
  }) || [];

  const usageLogs = await prisma.usageLog.findMany({
    where: { userId },
    select: { sessionId: true, provider: true, promptTokens: true, completionTokens: true, totalTokens: true, costUsd: true, metadata: true }
  });
  const percentile = (values: number[], fraction: number) => {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
  };
  const usageByProvider = new Map<string, { promptTokens: number; completionTokens: number; totalTokens: number; costUsd: number; latencies: number[] }>();
  const usageBySession = new Map<string, { totalTokens: number; estimatedCostUsd: number }>();
  for (const log of usageLogs) {
    const provider = log.provider.toLowerCase();
    const providerUsage = usageByProvider.get(provider) ?? { promptTokens: 0, completionTokens: 0, totalTokens: 0, costUsd: 0, latencies: [] };
    providerUsage.promptTokens += log.promptTokens;
    providerUsage.completionTokens += log.completionTokens;
    providerUsage.totalTokens += log.totalTokens;
    providerUsage.costUsd += Number(log.costUsd ?? 0);
    const latency = typeof log.metadata === "object" && log.metadata && "latencyMs" in log.metadata ? (log.metadata as { latencyMs?: unknown }).latencyMs : undefined;
    if (typeof latency === "number") providerUsage.latencies.push(latency);
    usageByProvider.set(provider, providerUsage);
    if (log.sessionId) { const current = usageBySession.get(log.sessionId) ?? { totalTokens: 0, estimatedCostUsd: 0 }; current.totalTokens += log.totalTokens; current.estimatedCostUsd += Number(log.costUsd ?? 0); usageBySession.set(log.sessionId, current); }
  }
  const usage = {
    providers: [...usageByProvider.entries()].map(([provider, value]) => ({ provider, promptTokens: value.promptTokens, completionTokens: value.completionTokens, totalTokens: value.totalTokens, estimatedCostUsd: Number(value.costUsd.toFixed(6)), p50LatencyMs: percentile(value.latencies, .5), p95LatencyMs: percentile(value.latencies, .95) })),
    sessions: [...usageBySession.entries()].map(([sessionId, value]) => ({ sessionId, totalTokens: value.totalTokens, estimatedCostUsd: Number(value.estimatedCostUsd.toFixed(6)) }))
  };

  return {
    topicAverages,
    sessionsOverTime,
    clusterInsights,
    usage
  };
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

  const previousAssistantTurn = [...session.turns].reverse().find(t => t.role === TurnRole.ASSISTANT);
  const previousQuestion = previousAssistantTurn?.content ?? "Please introduce yourself and explain your background.";

  let llmResult: LLMGenerateResult;
  let evaluationResult: any = null;

  try {
    const [genResult, evalResult] = await Promise.all([
      llm.generate({
        messages: buildNextQuestionMessages(session, session.turns, answer),
        options: {
          maxTokens: 600
        }
      }),
      evaluateAnswer({
        question: previousQuestion,
        answer,
        provider,
        userId,
        sessionId
      }).catch(e => {
        console.error("Evaluation failed", e);
        return null;
      })
    ]);
    
    llmResult = genResult;
    evaluationResult = evalResult;
    
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
    userId,
    mode: session.mode,
    difficulty: session.difficulty,
    sessionId,
    answer,
    nextQuestion,
    provider: llmResult.provider,
    model: llmResult.model,
    usage: llmResult.usage,
    evaluation: evaluationResult?.scores
  });

  return {
    turn: userTurn,
    nextQuestion: assistantTurn
  };
};

export const startSessionStream = async (userId: string, sessionId: string) => {
  const provider = normalizeProvider(undefined);
  const model = defaultModelForProvider(provider);
  const session = await getActiveSessionForTurn(userId, sessionId);

  if (session.turns.length > 0) {
    throw new HttpError(409, "This interview session has already started");
  }

  const llm = createLLMService(provider);
  const questionRequest: LLMGenerateRequest = {
    messages: [
      { role: "system", content: buildInterviewerSystemPrompt(session) },
      { role: "user", content: "Begin the interview with the first question." }
    ],
    options: { maxTokens: 600 }
  };

  // Gemini's streaming endpoint can terminate after a partial candidate. Use
  // the complete-response endpoint so only a complete question is persisted.
  async function* questionStream() {
    const result = await llm.generate(questionRequest);
    if (result.content) yield result.content;
  }

  return {
    provider,
    stream: questionStream(),
    commit: async (questionContent: string) => {
      const question = questionContent.trim();
      if (!question) throw new HttpError(502, "LLM returned an empty opening question");
      const turn = await prisma.turn.create({
        data: { sessionId, role: TurnRole.ASSISTANT, content: question, position: 0, metadata: { provider, model } },
        select: turnSelect
      });
      void indexQuestion({ userId, prompt: question, mode: session.mode, difficulty: session.difficulty }).catch(error => {
        console.error("Question embedding failed", error);
      });
      return { turn };
    }
  };
};

export const completeSession = async (userId: string, sessionId: string) => {
  const session = await prisma.session.findFirst({ where: { id: sessionId, userId }, select: { id: true, status: true } });
  if (!session) throw new HttpError(404, "Session not found");
  if (session.status !== SessionStatus.ACTIVE) throw new HttpError(409, "Session is already complete");
  return prisma.session.update({ where: { id: sessionId }, data: { status: SessionStatus.COMPLETED, endedAt: new Date() }, select: sessionSelect });
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
  
  const previousAssistantTurn = [...session.turns].reverse().find(t => t.role === TurnRole.ASSISTANT);
  const previousQuestion = previousAssistantTurn?.content ?? "Please introduce yourself and explain your background.";

  const evaluationPromise = evaluateAnswer({
    question: previousQuestion,
    answer,
    provider,
    userId,
    sessionId
  }).catch(e => {
    console.error("Evaluation failed", e);
    return null;
  });

  const reviewFocus = await selectConceptualReviewFocus({
    userId,
    difficulty: session.difficulty
  });
  const questionRequest = {
    messages: buildNextQuestionMessages(session, session.turns, answer, reviewFocus),
    options: {
      maxTokens: 600
    }
  };

  async function* stream() {
    const startedAt = Date.now();

    try {
      const result = await llm.generate(questionRequest);
      if (result.content) {
        yield result.content;
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

      const evaluationResult = await evaluationPromise;

      if (evaluationResult?.scores) {
        await recordEvaluationHistory({
          userId,
          sessionId,
          question: previousQuestion,
          mode: session.mode,
          difficulty: session.difficulty,
          provider: evaluationResult.provider,
          model: evaluationResult.model,
          scores: evaluationResult.scores
        });
        void refreshUserClusterInsights(userId);
      }

      const [userTurn, assistantTurn] = await persistTurnPair({
        userId,
        mode: session.mode,
        difficulty: session.difficulty,
        sessionId,
        answer,
        nextQuestion,
        provider,
        model,
        evaluation: evaluationResult?.scores
      });

      return {
        turn: userTurn,
        nextQuestion: assistantTurn
      };
    }
  };
};


