import { prisma } from "../prisma/client.js";
import { createLLMService } from "./llm/index.js";
import { config } from "../config.js";

// Helper to compute cosine similarity between two numeric arrays
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Convert pgvector format to standard JS array
function parseVector(vectorStr: string): number[] | null {
  try {
    // pgvector format usually "[0.1, 0.2, ...]"
    return JSON.parse(vectorStr);
  } catch (e) {
    return null;
  }
}

export async function runClusteringJob() {
  console.log("Starting background clustering job...");
  
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    
    for (const user of users) {
      await clusterUserQuestions(user.id);
    }
    
    console.log("Background clustering job completed.");
  } catch (error) {
    console.error("Failed to run clustering job", error);
  }
}

async function clusterUserQuestions(userId: string) {
  // Fetch eval runs for the user that have a questionId and a score
  const evalRuns = await prisma.evalRun.findMany({
    where: {
      userId,
      questionId: { not: null },
      score: { not: null }
    },
    include: {
      question: true
    }
  });

  if (evalRuns.length === 0) return;

  // We need to fetch embeddings separately because they are of type Unsupported("vector")
  // and Prisma might not return them directly in a standard query. Let's use raw query for embeddings.
  const questionIds = Array.from(new Set(evalRuns.map(run => run.questionId!)));
  
  if (questionIds.length === 0) return;

  const embeddingsQuery = await prisma.$queryRaw<Array<{ questionId: string, embedding: string }>>`
    SELECT "questionId", embedding::text 
    FROM "QuestionEmbedding" 
    WHERE "questionId" IN (${prisma.join(questionIds)})
  `;

  const embeddingMap = new Map<string, number[]>();
  for (const row of embeddingsQuery) {
    const vec = parseVector(row.embedding);
    if (vec) {
      embeddingMap.set(row.questionId, vec);
    }
  }

  // Group eval runs by questionId and calculate avg score per question
  const questionScores = new Map<string, { totalScore: number; count: number; prompt: string }>();
  for (const run of evalRuns) {
    const qid = run.questionId!;
    const q = run.question!;
    const current = questionScores.get(qid) || { totalScore: 0, count: 0, prompt: q.prompt };
    current.totalScore += run.score!;
    current.count += 1;
    questionScores.set(qid, current);
  }

  const lowScoringQuestions = Array.from(questionScores.entries())
    .map(([qid, data]) => ({
      questionId: qid,
      prompt: data.prompt,
      averageScore: data.totalScore / data.count,
      sessionCount: data.count,
      embedding: embeddingMap.get(qid)
    }))
    .filter(q => q.embedding && q.averageScore < 3.0); // Focus on scores < 3.0 out of 5

  if (lowScoringQuestions.length < 2) {
    // Not enough data to cluster
    return;
  }

  // Simple clustering: N^2 comparison, group items with similarity > 0.85
  const clusters: Array<typeof lowScoringQuestions> = [];
  const clusteredIds = new Set<string>();

  for (let i = 0; i < lowScoringQuestions.length; i++) {
    const qA = lowScoringQuestions[i];
    if (clusteredIds.has(qA.questionId)) continue;
    
    const currentCluster = [qA];
    clusteredIds.add(qA.questionId);

    for (let j = i + 1; j < lowScoringQuestions.length; j++) {
      const qB = lowScoringQuestions[j];
      if (clusteredIds.has(qB.questionId)) continue;

      const sim = cosineSimilarity(qA.embedding!, qB.embedding!);
      if (sim > 0.85) {
        currentCluster.push(qB);
        clusteredIds.add(qB.questionId);
      }
    }

    if (currentCluster.length >= 2) { // Only form clusters of 2 or more questions
      clusters.push(currentCluster);
    }
  }

  if (clusters.length === 0) return;

  const llm = createLLMService(config.llm.defaultProvider);
  const newInsights = [];

  for (const cluster of clusters) {
    const totalScore = cluster.reduce((sum, q) => sum + q.averageScore, 0);
    const avgScore = totalScore / cluster.length;
    const sessionCount = cluster.reduce((sum, q) => sum + q.sessionCount, 0);

    const prompts = cluster.map(q => q.prompt).join("\n- ");
    
    try {
      const llmResult = await llm.generate({
        messages: [
          {
            role: "system",
            content: "You are an assistant that summarizes a list of technical interview questions. Your task is to output a short, concise label (2-5 words) that represents the core technical concept these questions have in common. Do not include any extra text."
          },
          {
            role: "user",
            content: "Questions:\n- " + prompts
          }
        ],
        options: { maxTokens: 20 }
      });

      const clusterLabel = llmResult.content.trim().replace(/^"|"$/g, '');
      
      newInsights.push({
        clusterLabel,
        averageScore: avgScore,
        questionCount: cluster.length,
        sessionCount
      });
    } catch (e) {
      console.error("Failed to generate cluster label with LLM", e);
    }
  }

  if (newInsights.length > 0) {
    // Overwrite old insights for the user
    await prisma.$transaction(async (tx) => {
      // @ts-ignore - Ignore type error if prisma hasn't been generated yet
      await tx.userClusterInsight.deleteMany({ where: { userId } });
      
      for (const insight of newInsights) {
        // @ts-ignore
        await tx.userClusterInsight.create({
          data: {
            userId,
            ...insight
          }
        });
      }
    });
  }
}
