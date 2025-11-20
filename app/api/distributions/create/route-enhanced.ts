/**
 * Enhanced Distribution API with comprehensive error handling and logging
 *
 * POST /api/distributions/create
 * Creates a new token distribution with security checks and monitoring
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { distributionRequestSchema } from '@/lib/validations/distribution';
import { getTreasuryService } from '@/lib/services/TreasuryServiceEnhanced';
import { DISTRIBUTION_STATUS } from '@/lib/types/distribution';
import { checkDistributionSecurity } from '@/lib/security/distribution-checks';
import { nfcRateLimiter } from '@/lib/security/rate-limiter';
import { logger, LogCategory } from '@/lib/logging/logger';
import { monitoring } from '@/lib/monitoring/alerts';
import {
  handleApiError,
  createSuccessResponse,
  withErrorHandling,
  parseJsonBody,
} from '@/lib/middleware/errorHandler';
import {
  ValidationError,
  NFCNotRegisteredError,
  RateLimitError,
  BlacklistedAddressError,
  RecipientAlreadyReceivedError,
  DatabaseQueryError,
} from '@/lib/errors/types';
import type { Address } from 'viem';

async function handleDistributionRequest(request: NextRequest) {
  const requestStartTime = Date.now();

  // Parse and validate request body
  const body = await parseJsonBody(request);

  const validationResult = distributionRequestSchema.safeParse(body);

  if (!validationResult.success) {
    throw new ValidationError(
      validationResult.error.issues.map((i) => i.message).join(', '),
      { validationErrors: validationResult.error.issues }
    );
  }

  const { nfcId, recipientAddress } = validationResult.data;

  logger.info(LogCategory.DISTRIBUTION, 'Distribution request received', {
    nfcId,
    recipientAddress,
  });

  // Step 1: Verify ambassador exists
  let ambassador;
  try {
    ambassador = await prisma.ambassador.findUnique({
      where: { nfcId },
    });
  } catch (error) {
    throw new DatabaseQueryError('Failed to query ambassador', {
      nfcId,
      query: 'ambassador.findUnique',
    });
  }

  if (!ambassador) {
    throw new NFCNotRegisteredError(nfcId);
  }

  logger.info(LogCategory.DISTRIBUTION, 'Ambassador verified', {
    nfcId,
    ambassadorId: ambassador.id,
    ambassadorAddress: ambassador.walletAddress,
  });

  // Step 2: In-memory rate limit check (fast, first line of defense)
  if (nfcRateLimiter.isRateLimited(nfcId)) {
    const rateLimitInfo = nfcRateLimiter.getRateLimitInfo(nfcId);

    logger.logSecurityEvent('Rate limit exceeded (in-memory)', 'medium', {
      nfcId,
      ...rateLimitInfo,
    });

    // Track for abuse monitoring
    monitoring.trackError('RATE_LIMIT_EXCEEDED');

    throw new RateLimitError(rateLimitInfo.retryAfter, {
      nfcId,
      ...rateLimitInfo,
    });
  }

  // Step 3: Comprehensive security checks (database)
  const securityCheck = await logger.measurePerformance(
    'Security checks',
    async () => checkDistributionSecurity(nfcId, recipientAddress),
    { nfcId, recipientAddress }
  );

  if (!securityCheck.allowed) {
    logger.logSecurityEvent(`Security check failed: ${securityCheck.code}`, 'high', {
      nfcId,
      recipientAddress,
      reason: securityCheck.reason,
      code: securityCheck.code,
    });

    // Throw appropriate error based on code
    switch (securityCheck.code) {
      case 'RECIPIENT_BLACKLISTED':
        throw new BlacklistedAddressError(
          recipientAddress,
          securityCheck.reason || 'Address is blacklisted',
          { nfcId }
        );
      case 'RECIPIENT_ALREADY_RECEIVED':
        throw new RecipientAlreadyReceivedError(recipientAddress, { nfcId });
      case 'NFC_RATE_LIMIT_EXCEEDED':
        throw new RateLimitError(3600, { nfcId, recipientAddress });
      default:
        throw new ValidationError(securityCheck.reason || 'Security check failed', {
          nfcId,
          recipientAddress,
          code: securityCheck.code,
        });
    }
  }

  logger.info(LogCategory.SECURITY, 'Security checks passed', {
    nfcId,
    recipientAddress,
  });

  // Step 4: Create pending distribution record
  let distribution;
  try {
    distribution = await prisma.distribution.create({
      data: {
        ambassadorId: ambassador.id,
        recipientAddress: recipientAddress.toLowerCase(),
        ambassadorAmount: '1',
        recipientAmount: '5',
        status: DISTRIBUTION_STATUS.PENDING,
      },
    });

    logger.info(LogCategory.DATABASE, 'Distribution record created', {
      distributionId: distribution.id,
      nfcId,
      recipientAddress,
    });
  } catch (error) {
    throw new DatabaseQueryError('Failed to create distribution record', {
      nfcId,
      recipientAddress,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Step 5: Execute blockchain transactions
  const treasuryService = getTreasuryService();

  const mintResult = await logger.measurePerformance(
    'Blockchain minting',
    async () =>
      treasuryService.mintDistribution(
        ambassador.walletAddress as Address,
        recipientAddress as Address
      ),
    {
      distributionId: distribution.id,
      nfcId,
      ambassadorAddress: ambassador.walletAddress,
      recipientAddress,
    }
  );

  // Step 6: Update distribution record based on result
  const updateData = mintResult.success
    ? {
        status: DISTRIBUTION_STATUS.SUCCESS,
        transactionHash: mintResult.ambassadorHash,
        recipientTransactionHash: mintResult.recipientHash,
        completedAt: new Date(),
      }
    : {
        status: DISTRIBUTION_STATUS.FAILED,
        error: mintResult.error,
      };

  try {
    await prisma.distribution.update({
      where: { id: distribution.id },
      data: updateData,
    });

    logger.info(LogCategory.DATABASE, 'Distribution record updated', {
      distributionId: distribution.id,
      status: updateData.status,
    });
  } catch (error) {
    logger.error(
      LogCategory.DATABASE,
      'Failed to update distribution record',
      error instanceof Error ? error : undefined,
      {
        distributionId: distribution.id,
        updateData,
      }
    );
    // Don't throw - distribution already happened
  }

  // Step 7: Record in rate limiter if successful
  if (mintResult.success) {
    const remaining = nfcRateLimiter.recordRequest(nfcId);
    const rateLimitInfo = nfcRateLimiter.getRateLimitInfo(nfcId);

    logger.info(LogCategory.SECURITY, 'Rate limit recorded', {
      nfcId,
      remaining,
      resetAt: new Date(rateLimitInfo.resetAt).toISOString(),
    });

    logger.logDistribution('Distribution completed successfully', {
      nfcId,
      ambassadorAddress: ambassador.walletAddress,
      recipientAddress,
      transactionHash: mintResult.ambassadorHash || '',
      distributionId: distribution.id,
      status: 'success',
    });

    const totalDuration = Date.now() - requestStartTime;
    logger.logPerformance('Full distribution request', totalDuration, {
      distributionId: distribution.id,
      nfcId,
    });

    // Return success response with rate limit headers
    return createSuccessResponse(
      {
        distributionId: distribution.id,
        ambassadorHash: mintResult.ambassadorHash,
        recipientHash: mintResult.recipientHash,
        ambassadorAmount: '1',
        recipientAmount: '5',
        blockExplorerUrl: `https://optimistic.etherscan.io/tx/${mintResult.ambassadorHash}`,
        rateLimit: {
          limit: rateLimitInfo.limit,
          remaining,
          resetAt: new Date(rateLimitInfo.resetAt).toISOString(),
        },
      },
      200
    );
  } else {
    // Distribution failed
    logger.logDistribution('Distribution failed', {
      nfcId,
      ambassadorAddress: ambassador.walletAddress,
      recipientAddress,
      distributionId: distribution.id,
      status: 'failed',
    });

    throw new ValidationError(mintResult.error || 'Distribution failed', {
      distributionId: distribution.id,
      nfcId,
    });
  }
}

// Export with error handling wrapper
export const POST = withErrorHandling(handleDistributionRequest);
