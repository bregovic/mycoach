-- AlterTable
ALTER TABLE "ScheduledTask" ADD COLUMN     "clubSessionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledTask_userId_clubSessionId_key" ON "ScheduledTask"("userId", "clubSessionId");

-- AddForeignKey
ALTER TABLE "ScheduledTask" ADD CONSTRAINT "ScheduledTask_clubSessionId_fkey" FOREIGN KEY ("clubSessionId") REFERENCES "ClubSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

