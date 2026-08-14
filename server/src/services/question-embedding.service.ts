import { randomUUID } from "node:crypto";
import { prisma } from "../prisma/client.js";

const MODEL = "Xenova/all-MiniLM-L6-v2";
const DIMENSIONS = 384;

type FeatureExtractor = (text: string, options: { pooling: "mean"; normalize: boolean }) => Promise<{ data: Float32Array }>;
let extractorPromise: Promise<FeatureExtractor> | undefined;

const getExtractor = () => {
  if (!extractorPromise) {
    extractorPromise = import("@xenova/transformers").then(async ({ env, pipeline }) => {
      env.cacheDir = process.env.TRANSFORMERS_CACHE ?? "/tmp/interviewos-transformers";
      return (await pipeline("feature-extraction", MODEL)) as FeatureExtractor;
    });
  }
  return extractorPromise;
};

export const indexQuestion = async (input: {
  userId: string;
  prompt: string;
  mode: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}) => {
  const extractor = await getExtractor();
  const output = await extractor(input.prompt, { pooling: "mean", normalize: true });
  const vector = Array.from(output.data);

  if (vector.length !== DIMENSIONS) {
    throw new Error(`Expected a ${DIMENSIONS}-dimensional embedding, received ${vector.length}`);
  }

  const question = await prisma.questionBank.create({
    data: {
      createdById: input.userId,
      topic: input.mode,
      difficulty: input.difficulty,
      prompt: input.prompt,
      source: "interview-session",
      tags: [input.mode.toLowerCase(), "ai-generated"]
    },
    select: { id: true }
  });

  await prisma.$executeRawUnsafe(
    `INSERT INTO "QuestionEmbedding" ("id", "questionId", "provider", "model", "dimensions", "embedding", "createdAt") VALUES ($1, $2, $3::"UsageProvider", $4, $5, $6::vector, $7)`,
    randomUUID(), question.id, "OTHER", MODEL, DIMENSIONS, `[${vector.join(",")}]`, new Date()
  );
};
