ALTER TABLE "UserClusterInsight"
ADD COLUMN "questionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "lastResurfacedAt" TIMESTAMP(3);

CREATE INDEX "UserClusterInsight_userId_averageScore_idx"
ON "UserClusterInsight"("userId", "averageScore");
