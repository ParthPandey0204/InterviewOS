-- AlterTable
ALTER TABLE "Session"
ADD COLUMN     "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'practice';

ALTER TABLE "Session"
ALTER COLUMN "difficulty" DROP DEFAULT,
ALTER COLUMN "mode" DROP DEFAULT;
