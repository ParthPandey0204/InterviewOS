import { QuestionDifficulty, UsageProvider } from "@prisma/client";
import type { EvaluationScores } from "./answer-evaluation.service.js";
import type { LLMProvider } from "./llm/index.js";
import { indexQuestion } from "./question-embedding.service.js";
import { prisma } from "../prisma/client.js";

const toUsageProvider = (provider: LLMProvider): UsageProvider =>
  provider === "gemini" ? UsageProvider.GEMINI : UsageProvider.GROQ;

export const recordEvaluationHistory = async (input: {
  userId: string;
  sessionId: string;
  question: string;
  mode: string;
  difficulty: QuestionDifficulty;
  provider: LLMProvider;
  model: string;
  scores: EvaluationScores;
}) => {
  const question = await indexQuestion({
    userId: input.userId,
    prompt: input.question,
    mode: input.mode,
    difficulty: input.difficulty
  });
  const score = (input.scores.correctness + input.scores.clarity + input.scores.depth) / 3;

  await prisma.evalRun.create({
    data: {
      userId: input.userId,
      sessionId: input.sessionId,
      questionId: question.id,
      provider: toUsageProvider(input.provider),
      model: input.model,
      status: "PASSED",
      score,
      feedback: { scores: input.scores },
      completedAt: new Date()
    }
  });
};
