import { Prisma } from "@prisma/client";
import { prisma } from "../prisma/client.js";

const LOW_SCORE_THRESHOLD = 3;
// MiniLM similarity for separately phrased interview questions is much lower
// than near-duplicate text, so 0.85 prevented nearly every real cluster.
const SIMILARITY_THRESHOLD = 0.62;
const MIN_CLUSTER_SIZE = 2;

export type QuestionEvidence = {
  questionId: string;
  prompt: string;
  topic: string;
  averageScore: number;
  sessionIds: Set<string>;
  embedding: number[];
};

type ClusterInsight = {
  clusterLabel: string;
  averageScore: number;
  questionCount: number;
  sessionCount: number;
  questionIds: string[];
};

const cosineSimilarity = (a: number[], b: number[]) => {
  if (a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
};

const parseVector = (value: string): number[] | null => {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "number") ? parsed : null;
  } catch {
    return null;
  }
};

const clusterLabelRules: Array<[string, RegExp]> = [
  ["Concurrency & parallelism", /concurren|parallel|multi.?thread|worker pool|thread.?safe|race condition|deadlock|synchroni[sz]|lock contention/i],
  ["Performance optimization", /performance|optim|profil|hot path|latency|throughput|bottleneck|garbage collect|memory allocation/i],
  ["Data aggregation & processing", /aggregat|merge results|map.?reduce|data pipeline|batch process|stream process/i],
  ["Rate limiting & API reliability", /rate.?limit|throttl|token bucket|leaky bucket|backpressure|api gateway|retry|circuit breaker/i],
  ["Distributed systems & consistency", /distribut|eventual consist|replica|reconcil|partition|consistency model/i],
  ["Databases & transactions", /database|sql|transaction|isolation|indexing|query plan|write path/i],
  ["Caching & Redis", /cach|redis|invalidation|eviction/i],
  ["Algorithms & complexity", /algorithm|time complexity|space complexity|big.?o|binary search|graph traversal|dynamic programming/i],
  ["Scalability & system design", /scalab|system design|load balanc|high.?availability|fault toleran|capacity planning/i],
  ["Communication & leadership", /communicat|conflict|stakeholder|leadership|ownership|feedback/i]
];

// Semantic vectors determine membership; labels come from a small, readable
// concept vocabulary instead of arbitrary repeated words in question text.
const makeClusterLabel = (questions: QuestionEvidence[]) => {
  const prompts = questions.map((question) => question.prompt).join("\n");
  return clusterLabelRules.find(([, pattern]) => pattern.test(prompts))?.[0]
    ?? `${questions[0]?.topic || "Interview"} concepts`;
};

export const findConnectedClusters = (questions: QuestionEvidence[]) => {
  const neighbours = questions.map(() => new Set<number>());
  for (let i = 0; i < questions.length; i += 1) for (let j = i + 1; j < questions.length; j += 1) {
    if (cosineSimilarity(questions[i].embedding, questions[j].embedding) >= SIMILARITY_THRESHOLD) {
      neighbours[i].add(j);
      neighbours[j].add(i);
    }
  }
  const seen = new Set<number>();
  const clusters: QuestionEvidence[][] = [];
  for (let start = 0; start < questions.length; start += 1) {
    if (seen.has(start)) continue;
    const pending = [start];
    const cluster: QuestionEvidence[] = [];
    seen.add(start);
    while (pending.length) {
      const index = pending.pop()!;
      cluster.push(questions[index]);
      for (const neighbour of neighbours[index]) if (!seen.has(neighbour)) {
        seen.add(neighbour);
        pending.push(neighbour);
      }
    }
    if (cluster.length >= MIN_CLUSTER_SIZE) clusters.push(cluster);
  }
  return clusters;
};

export async function runClusteringJob() {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    await Promise.all(users.map((user) => refreshUserClusterInsights(user.id)));
  } catch (error) {
    console.error("Failed to refresh conceptual weak-topic clusters", error);
  }
}

export async function refreshUserClusterInsights(userId: string) {
  const evalRuns = await prisma.evalRun.findMany({
    where: { userId, questionId: { not: null }, score: { not: null } },
    select: { questionId: true, sessionId: true, score: true, question: { select: { prompt: true, topic: true } } }
  });
  const unlinkedPrompts = [...new Set(evalRuns
    .filter((run) => !run.sessionId && run.question)
    .map((run) => run.question!.prompt))];
  const linkedTurns = unlinkedPrompts.length
    ? await prisma.turn.findMany({
        where: { role: "ASSISTANT", content: { in: unlinkedPrompts }, session: { userId } },
        select: { content: true, sessionId: true }
      })
    : [];
  const sessionsByPrompt = new Map<string, Set<string>>();
  for (const turn of linkedTurns) {
    const sessions = sessionsByPrompt.get(turn.content) ?? new Set<string>();
    sessions.add(turn.sessionId);
    sessionsByPrompt.set(turn.content, sessions);
  }
  const questionIds = [...new Set(evalRuns.map((run) => run.questionId!).filter(Boolean))];
  if (questionIds.length < MIN_CLUSTER_SIZE) {
    await prisma.userClusterInsight.deleteMany({ where: { userId } });
    return;
  }
  const rows = await prisma.$queryRaw<Array<{ questionId: string; embedding: string }>>`
    SELECT "questionId", embedding::text FROM "QuestionEmbedding"
    WHERE "questionId" IN (${Prisma.join(questionIds)}) AND dimensions = 384
  `;
  const embeddings = new Map(rows.map((row) => [row.questionId, parseVector(row.embedding)]).filter((entry): entry is [string, number[]] => entry[1] !== null));
  const evidence = new Map<string, Omit<QuestionEvidence, "averageScore" | "embedding"> & { total: number; count: number }>();
  for (const run of evalRuns) {
    if (!run.questionId || !run.question || !embeddings.has(run.questionId)) continue;
    const item = evidence.get(run.questionId) ?? { questionId: run.questionId, prompt: run.question.prompt, topic: run.question.topic, total: 0, count: 0, sessionIds: new Set<string>() };
    item.total += run.score!;
    item.count += 1;
    if (run.sessionId) item.sessionIds.add(run.sessionId);
    else for (const sessionId of sessionsByPrompt.get(run.question.prompt) ?? []) item.sessionIds.add(sessionId);
    evidence.set(run.questionId, item);
  }
  const lowScoring = [...evidence.values()]
    .map((item): QuestionEvidence => ({ ...item, averageScore: item.total / item.count, embedding: embeddings.get(item.questionId)! }))
    .filter((item) => item.averageScore < LOW_SCORE_THRESHOLD);
  const insights: ClusterInsight[] = findConnectedClusters(lowScoring).map((cluster) => {
    const sessionIds = new Set(cluster.flatMap((question) => [...question.sessionIds]));
    return {
      clusterLabel: makeClusterLabel(cluster),
      averageScore: cluster.reduce((total, question) => total + question.averageScore, 0) / cluster.length,
      questionCount: cluster.length,
      sessionCount: sessionIds.size,
      questionIds: cluster.map((question) => question.questionId)
    };
  });
  await prisma.$transaction(async (tx) => {
    const existing = await tx.userClusterInsight.findMany({ where: { userId }, select: { clusterLabel: true, lastResurfacedAt: true } });
    const lastResurfaced = new Map(existing.map((insight) => [insight.clusterLabel, insight.lastResurfacedAt]));
    await tx.userClusterInsight.deleteMany({ where: { userId } });
    if (insights.length) await tx.userClusterInsight.createMany({
      data: insights.map((insight) => ({ ...insight, userId, lastResurfacedAt: lastResurfaced.get(insight.clusterLabel) ?? null }))
    });
  });
}
