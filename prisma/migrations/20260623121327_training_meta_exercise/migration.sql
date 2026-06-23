-- AlterTable
ALTER TABLE "BlockItem" ADD COLUMN     "exerciseId" TEXT;

-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "coop" TEXT,
ADD COLUMN     "defaultSec" INTEGER,
ADD COLUMN     "voiceText" TEXT;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "number" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "targetMin" INTEGER;

-- CreateIndex
CREATE INDEX "BlockItem_exerciseId_idx" ON "BlockItem"("exerciseId");

-- CreateIndex
CREATE INDEX "Exercise_sportId_category_idx" ON "Exercise"("sportId", "category");

-- CreateIndex
CREATE INDEX "Training_isPublic_idx" ON "Training"("isPublic");

-- AddForeignKey
ALTER TABLE "BlockItem" ADD CONSTRAINT "BlockItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

