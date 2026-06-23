-- AlterTable
ALTER TABLE "ClubInvite" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "SessionAttendance" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'going';

