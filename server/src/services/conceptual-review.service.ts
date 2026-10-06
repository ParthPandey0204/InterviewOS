import { QuestionDifficulty } from "@prisma/client";
import { prisma } from "../prisma/client.js";

export type ConceptualReviewFocus = {
  label: string;
  relatedPrompts: string[];
};

type StoredClusterInsight = {
  id: string;
  clusterLabel: string;
  averageScore: number;
  questionIds: string[];
  lastResurfacedAt: Date | null;
};

export const daysUntilReview = (averageScore: number) => {
  if (averageScore <= 1.5) return 1;
  if (averageScore <= 2.5) return 2;
  return 4;
};

/**
 * Selects a due weak-concept cluster. Unlike topic review, membership comes
 * from semantic embedding similarity, so questions with different tags can
 * reinforce the same underlying gap.
 */
export const selectConceptualReviewFocus = async (input: {
  userId: string;
  difficulty: QuestionDifficulty;
}): Promise<ConceptualReviewFocus | null> => {
  const insights: StoredClusterInsight[] = await prisma.userClusterInsight.findMany({
    where: { userId: input.userId, averageScore: { lt: 3 }, questionIds: { isEmpty: false } },
    orderBy: [{ averageScore: "asc" }, { lastResurfacedAt: "asc" }],
    select: { id: true, clusterLabel: true, averageScore: true, questionIds: true, lastResurfacedAt: true }
  });

  const now = Date.now();
  const insight = insights.find((candidate) => {
    if (!candidate.lastResurfacedAt) return true;
    const dueAt = candidate.lastResurfacedAt.getTime() + daysUntilReview(candidate.averageScore) * 86_400_000;
    return dueAt <= now;
  });

  if (!insight) return null;

  const questions = await prisma.questionBank.findMany({
    where: {
      id: { in: insight.questionIds },
      difficulty: input.difficulty
    },
    select: { prompt: true },
    take: 3
  });

  if (questions.length === 0) return null;

  await prisma.userClusterInsight.update({
    where: { id: insight.id },
    data: { lastResurfacedAt: new Date() }
  });

  return { label: insight.clusterLabel, relatedPrompts: questions.map((question) => question.prompt) };
};
