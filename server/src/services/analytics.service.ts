import { SessionStatus, TurnRole } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { refreshUserClusterInsights } from "./clustering.service.js";

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

  // Fallback: if no sessions were matched via scoresBySession (e.g. all evalRuns
  // have sessionId: null from the eval-harness, or the user played before EvalRun
  // was wired up), build the timeline from evalRun completedAt dates instead.
  const sessionsOverTimeFinal = sessionsOverTime.length > 0 ? sessionsOverTime : (() => {
    const byDate = new Map<string, number[]>();
    for (const run of evalRuns) {
      if (run.score === null || !run.completedAt) continue;
      const date = run.completedAt.toISOString().split("T")[0];
      const arr = byDate.get(date) ?? [];
      arr.push(run.score);
      byDate.set(date, arr);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date,
        score: Math.round((scores.reduce((t, s) => t + s, 0) / scores.length) * 20),
        mode: "mixed"
      }));
  })();

  await refreshUserClusterInsights(userId).catch(() => {
    // Non-blocking fallback if embeddings service or clustering encounters transient issue
  });

  const clusterInsights = await prisma.userClusterInsight.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { clusterLabel: true, averageScore: true, questionCount: true, sessionCount: true }
  });

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
    sessionsOverTime: sessionsOverTimeFinal,
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

