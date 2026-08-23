-- CreateTable
CREATE TABLE "UserClusterInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clusterLabel" TEXT NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "questionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastResurfacedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserClusterInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserClusterInsight_userId_idx" ON "UserClusterInsight"("userId");

-- CreateIndex
CREATE INDEX "UserClusterInsight_userId_averageScore_idx" ON "UserClusterInsight"("userId", "averageScore");

-- AddForeignKey
ALTER TABLE "UserClusterInsight" ADD CONSTRAINT "UserClusterInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
