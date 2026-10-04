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

const conceptKeywords: Array<[string, RegExp]> = [
  ["Rate limiting & backpressure", /rate.?limit|token bucket|leaky bucket|backpressure|throttl/i],
  ["Caching & Redis", /\bcache|redis|eviction|cache invalidation/i],
  ["Databases & consistency", /database|sql|transaction|consisten|isolation|replica/i],
  ["Scalability & system design", /scalab|load balanc|throughput|qps|distributed system/i],
  ["Queues & asynchronous work", /queue|message broker|kafka|rabbitmq|asynchron/i],
  ["API design & reliability", /\bapi\b|endpoint|idempot|retry|timeout|circuit breaker/i],
  ["Algorithms & complexity", /algorithm|array|linked list|tree|graph|complexity|\bo\(n/i],
  ["Leadership & ownership", /leadership|stakeholder|ownership|initiative|led a/i],
  ["Communication & conflict", /conflict|disagree|communicat|feedback|difficult conversation/i],
  ["Problem solving", /./i]
];

const inferConceptFromQuestion = (question: string) =>
  conceptKeywords.find(([, pattern]) => pattern.test(question))?.[0] ?? "Problem solving";

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
      status: true,
      createdAt: true,
    }
  });
  const evaluatedTurns = await prisma.turn.findMany({
    where: { role: TurnRole.USER, session: { userId } },
    select: {
      sessionId: true,
      position: true,
      metadata: true,
      session: {
        select: {
          turns: { where: { role: TurnRole.ASSISTANT }, orderBy: { position: "asc" }, select: { position: true, content: true } }
        }
      }
    }
  });
  const scoreFromTurnMetadata = (metadata: unknown): number | null => {
    if (!metadata || typeof metadata !== "object" || !("evaluation" in metadata)) return null;
    const evaluation = (metadata as { evaluation?: unknown }).evaluation;
    if (!evaluation || typeof evaluation !== "object") return null;
    const values = ["correctness", "clarity", "depth"].map((key) => (evaluation as Record<string, unknown>)[key]);
    return values.every((value) => typeof value === "number") ? (values[0] as number + values[1] as number + values[2] as number) / 3 : null;
  };
  const turnEvaluations = evaluatedTurns.flatMap((turn) => {
    const score = scoreFromTurnMetadata(turn.metadata);
    const question = [...turn.session.turns].reverse().find((assistantTurn) => assistantTurn.position < turn.position)?.content ?? "";
    return score === null ? [] : [{ score, sessionId: turn.sessionId, topic: inferConceptFromQuestion(question) }];
  });
  const sessionsWithTurnEvaluations = new Set(turnEvaluations.map((evaluation) => evaluation.sessionId));
  const evalRuns = await prisma.evalRun.findMany({
    where: { userId, score: { not: null }, questionId: { not: null } },
    select: {
      score: true,
      sessionId: true,
      completedAt: true,
      question: { select: { prompt: true } }
    }
  });

  // Older sessions stored scores in turn metadata but did not create EvalRun;
  // use that durable client-visible history first, then fall back to EvalRun.
  const evaluations = [
    ...turnEvaluations,
    ...evalRuns.flatMap((evaluation) => !evaluation.question || evaluation.score === null || (evaluation.sessionId && sessionsWithTurnEvaluations.has(evaluation.sessionId))
      ? []
      : [{ score: evaluation.score, sessionId: evaluation.sessionId, topic: inferConceptFromQuestion(evaluation.question.prompt) }])
  ];

  // EvalRun is the source of truth. TopicStats is a per-session convenience
  // row and older sessions may not have one, which previously made analytics
  // appear empty despite completed, scored answers.
  const topicMap = new Map<string, { total: number; count: number }>();
  const scoresBySession = new Map<string, number[]>();
  for (const evaluation of evaluations) {
    const currentTopic = topicMap.get(evaluation.topic) ?? { total: 0, count: 0 };
    currentTopic.total += evaluation.score;
    currentTopic.count += 1;
    topicMap.set(evaluation.topic, currentTopic);
    if (evaluation.sessionId) {
      const scores = scoresBySession.get(evaluation.sessionId) ?? [];
      scores.push(evaluation.score);
      scoresBySession.set(evaluation.sessionId, scores);
    }
  }
  const topicAverages = Array.from(topicMap.entries()).map(([topic, data]) => ({
    topic,
    averageScore: Math.round((data.total / data.count) * 20),
    attempts: data.count
  })).sort((a, b) => a.averageScore - b.averageScore);

  const sessionsOverTime = sessions.flatMap(session => {
    const scores = scoresBySession.get(session.id);
    if (!scores?.length) return [];
    const avg = scores.reduce((total, score) => total + score, 0) / scores.length;
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
    overview: {
      evaluatedAnswers: evaluations.length,
      completedSessions: sessions.filter((session) => session.status === SessionStatus.COMPLETED).length,
      averageScore: evaluations.length ? Math.round(evaluations.reduce((total, evaluation) => total + evaluation.score, 0) / evaluations.length * 20) : null,
      strongestTopic: topicAverages.at(-1)?.topic ?? null,
      focusTopic: topicAverages[0]?.topic ?? null
    },
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
      await indexQuestion({ userId, prompt: question, mode: session.mode, difficulty: session.difficulty });
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
        await refreshUserClusterInsights(userId);
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

      await indexQuestion({ userId, prompt: nextQuestion, mode: session.mode, difficulty: session.difficulty });

      return {
        turn: userTurn,
        nextQuestion: assistantTurn
      };
    }
  };
};


