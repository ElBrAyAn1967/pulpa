-- CreateTable
CREATE TABLE "ambassadors" (
    "id" TEXT NOT NULL,
    "nfcId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "ensName" TEXT,
    "displayName" TEXT NOT NULL,
    "favoriteFruit" TEXT NOT NULL,
    "totalDistributions" INTEGER NOT NULL DEFAULT 0,
    "totalPulpaMinted" TEXT NOT NULL DEFAULT '0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassadors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributions" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "recipientAddress" TEXT NOT NULL,
    "pulpaAmount" TEXT NOT NULL,
    "ambassadorReward" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distributions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ambassadors_nfcId_key" ON "ambassadors"("nfcId");

-- CreateIndex
CREATE UNIQUE INDEX "ambassadors_walletAddress_key" ON "ambassadors"("walletAddress");

-- CreateIndex
CREATE INDEX "ambassadors_nfcId_idx" ON "ambassadors"("nfcId");

-- CreateIndex
CREATE INDEX "ambassadors_walletAddress_idx" ON "ambassadors"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "distributions_txHash_key" ON "distributions"("txHash");

-- CreateIndex
CREATE INDEX "distributions_ambassadorId_idx" ON "distributions"("ambassadorId");

-- CreateIndex
CREATE INDEX "distributions_recipientAddress_idx" ON "distributions"("recipientAddress");

-- CreateIndex
CREATE INDEX "distributions_timestamp_idx" ON "distributions"("timestamp");

-- AddForeignKey
ALTER TABLE "distributions" ADD CONSTRAINT "distributions_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "ambassadors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
