-- AlterTable
ALTER TABLE "ActivitySchedule" ADD COLUMN     "intervalDays" INTEGER;

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "category" TEXT,
    "tags" TEXT[],
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#18181b',
    "authorId" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "priceCents" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageElement" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "color" TEXT NOT NULL DEFAULT '#18181b',
    "defaultIntervalDays" INTEGER NOT NULL DEFAULT 28,
    "optional" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PackageElement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionElement" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "elementId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#18181b',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "intervalDays" INTEGER NOT NULL DEFAULT 28,
    "activityId" TEXT,
    "scheduleId" TEXT,

    CONSTRAINT "SubscriptionElement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");

-- CreateIndex
CREATE INDEX "Package_category_idx" ON "Package"("category");

-- CreateIndex
CREATE INDEX "Package_published_idx" ON "Package"("published");

-- CreateIndex
CREATE INDEX "PackageElement_packageId_idx" ON "PackageElement"("packageId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_packageId_key" ON "Subscription"("userId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionElement_activityId_key" ON "SubscriptionElement"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionElement_scheduleId_key" ON "SubscriptionElement"("scheduleId");

-- CreateIndex
CREATE INDEX "SubscriptionElement_subscriptionId_idx" ON "SubscriptionElement"("subscriptionId");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageElement" ADD CONSTRAINT "PackageElement_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionElement" ADD CONSTRAINT "SubscriptionElement_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionElement" ADD CONSTRAINT "SubscriptionElement_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionElement" ADD CONSTRAINT "SubscriptionElement_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ActivitySchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

