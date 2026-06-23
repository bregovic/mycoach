-- CreateTable
CREATE TABLE "UserSound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "audioKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSound_userId_type_idx" ON "UserSound"("userId", "type");

-- AddForeignKey
ALTER TABLE "UserSound" ADD CONSTRAINT "UserSound_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

