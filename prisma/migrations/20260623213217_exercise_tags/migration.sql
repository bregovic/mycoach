-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

