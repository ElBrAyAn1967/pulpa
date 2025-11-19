/**
 * Distribution Security Checks
 *
 * Implements deduplication and blacklist checks for token distribution
 */

import { prisma } from '@/lib/db/prisma';

/**
 * Check if recipient has already received tokens
 * Rule: 1 distribution per recipient address (permanent)
 */
export async function hasRecipientReceivedTokens(
  recipientAddress: string
): Promise<boolean> {
  const normalizedAddress = recipientAddress.toLowerCase();

  const existingDistribution = await prisma.distribution.findFirst({
    where: {
      recipientAddress: normalizedAddress,
      status: 'success', // Only count successful distributions
    },
    select: {
      id: true,
    },
  });

  return existingDistribution !== null;
}

/**
 * Check if address is blacklisted
 */
export async function isAddressBlacklisted(
  address: string
): Promise<{ blacklisted: boolean; reason?: string }> {
  const normalizedAddress = address.toLowerCase();

  const blacklistEntry = await prisma.blacklist.findUnique({
    where: {
      address: normalizedAddress,
    },
    select: {
      reason: true,
    },
  });

  if (blacklistEntry) {
    return {
      blacklisted: true,
      reason: blacklistEntry.reason,
    };
  }

  return {
    blacklisted: false,
  };
}

/**
 * Add address to blacklist
 */
export async function addToBlacklist(
  address: string,
  reason: string,
  addedBy: string
): Promise<void> {
  const normalizedAddress = address.toLowerCase();

  await prisma.blacklist.upsert({
    where: {
      address: normalizedAddress,
    },
    create: {
      address: normalizedAddress,
      reason,
      addedBy,
    },
    update: {
      reason,
      addedBy,
    },
  });
}

/**
 * Remove address from blacklist
 */
export async function removeFromBlacklist(address: string): Promise<void> {
  const normalizedAddress = address.toLowerCase();

  await prisma.blacklist.delete({
    where: {
      address: normalizedAddress,
    },
  });
}

/**
 * Get NFC distribution count in the last hour
 */
export async function getNFCDistributionCountLastHour(
  nfcId: string
): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 3600000); // 1 hour ago

  const count = await prisma.distribution.count({
    where: {
      ambassador: {
        nfcId: nfcId,
      },
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  return count;
}

/**
 * Comprehensive security check for distribution
 * Returns error message if check fails, null if all checks pass
 */
export async function checkDistributionSecurity(
  nfcId: string,
  recipientAddress: string
): Promise<{ allowed: boolean; reason?: string; code?: string }> {
  const normalizedRecipient = recipientAddress.toLowerCase();

  // Check 1: Recipient blacklist
  const recipientBlacklist = await isAddressBlacklisted(normalizedRecipient);
  if (recipientBlacklist.blacklisted) {
    return {
      allowed: false,
      reason: `Recipient address is blacklisted: ${recipientBlacklist.reason}`,
      code: 'RECIPIENT_BLACKLISTED',
    };
  }

  // Check 2: Recipient deduplication (permanent)
  const hasReceived = await hasRecipientReceivedTokens(normalizedRecipient);
  if (hasReceived) {
    return {
      allowed: false,
      reason: 'This address has already received $PULPA tokens',
      code: 'RECIPIENT_ALREADY_RECEIVED',
    };
  }

  // Check 3: NFC rate limit (5 per hour) - database check
  const nfcDistCountLastHour = await getNFCDistributionCountLastHour(nfcId);
  if (nfcDistCountLastHour >= 5) {
    return {
      allowed: false,
      reason: 'NFC rate limit exceeded. Maximum 5 distributions per hour.',
      code: 'NFC_RATE_LIMIT_EXCEEDED',
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Get blacklist entries (for admin)
 */
export async function getBlacklistEntries(
  limit: number = 100
): Promise<
  Array<{
    id: string;
    address: string;
    reason: string;
    addedBy: string;
    createdAt: Date;
  }>
> {
  return await prisma.blacklist.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}
