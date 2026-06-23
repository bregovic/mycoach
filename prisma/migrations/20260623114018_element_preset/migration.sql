-- CreateTable
CREATE TABLE "ElementPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "color" TEXT NOT NULL DEFAULT '#18181b',
    "defaultIntervalDays" INTEGER NOT NULL DEFAULT 28,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElementPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ElementPreset_category_idx" ON "ElementPreset"("category");

