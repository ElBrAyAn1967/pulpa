/*
  Warnings:

  - You are about to drop the column `ambassadorReward` on the `distributions` table. All the data in the column will be lost.
  - You are about to drop the column `blockNumber` on the `distributions` table. All the data in the column will be lost.
  - You are about to drop the column `pulpaAmount` on the `distributions` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `distributions` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `distributions` table. All the data in the column will be lost.
  - Added the required column `ambassadorAmount` to the `distributions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientAmount` to the `distributions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `distributions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "distributions_timestamp_idx";

-- DropIndex
DROP INDEX "distributions_txHash_key";

-- AlterTable
ALTER TABLE "distributions" DROP COLUMN "ambassadorReward",
DROP COLUMN "blockNumber",
DROP COLUMN "pulpaAmount",
DROP COLUMN "timestamp",
DROP COLUMN "txHash",
ADD COLUMN     "ambassadorAmount" TEXT NOT NULL,
ADD COLUMN     "recipientAmount" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "transactionHash" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "distributions_status_idx" ON "distributions"("status");
