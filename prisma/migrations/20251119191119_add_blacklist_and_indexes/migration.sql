-- CreateTable
CREATE TABLE "blacklist" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blacklist_address_key" ON "blacklist"("address");

-- CreateIndex
CREATE INDEX "blacklist_address_idx" ON "blacklist"("address");

-- CreateIndex
CREATE INDEX "distributions_createdAt_idx" ON "distributions"("createdAt");
