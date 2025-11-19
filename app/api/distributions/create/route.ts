import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { distributionRequestSchema } from '@/lib/validations/distribution';
import { getTreasuryService } from '@/lib/services/TreasuryService';
import { DISTRIBUTION_STATUS } from '@/lib/types/distribution';
import { checkDistributionSecurity } from '@/lib/security/distribution-checks';
import { nfcRateLimiter } from '@/lib/security/rate-limiter';
import type { Address } from 'viem';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = distributionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos de solicitud inválidos',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { nfcId, recipientAddress } = validationResult.data;

    // Verify ambassador exists
    const ambassador = await prisma.ambassador.findUnique({
      where: { nfcId },
    });

    if (!ambassador) {
      return NextResponse.json(
        {
          success: false,
          error: 'Embajador no encontrado',
        },
        { status: 404 }
      );
    }

    // SECURITY CHECKS
    // 1. In-memory rate limit check (fast, first line of defense)
    if (nfcRateLimiter.isRateLimited(nfcId)) {
      const rateLimitInfo = nfcRateLimiter.getRateLimitInfo(nfcId);

      return NextResponse.json(
        {
          success: false,
          error: 'NFC rate limit exceeded',
          message: 'Too many distributions from this NFC. Please try again later.',
          retryAfter: rateLimitInfo.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitInfo.resetAt).toISOString(),
            'Retry-After': rateLimitInfo.retryAfter.toString(),
          },
        }
      );
    }

    // 2. Comprehensive security checks (database)
    const securityCheck = await checkDistributionSecurity(nfcId, recipientAddress);

    if (!securityCheck.allowed) {
      // Get rate limit info for headers
      const rateLimitInfo = nfcRateLimiter.getRateLimitInfo(nfcId);

      return NextResponse.json(
        {
          success: false,
          error: securityCheck.reason,
          code: securityCheck.code,
        },
        {
          status: 403,
          headers: {
            'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
            'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitInfo.resetAt).toISOString(),
          },
        }
      );
    }

    // Create pending distribution record
    const distribution = await prisma.distribution.create({
      data: {
        ambassadorId: ambassador.id,
        recipientAddress: recipientAddress.toLowerCase(),
        ambassadorAmount: '1',
        recipientAmount: '5',
        status: DISTRIBUTION_STATUS.PENDING,
      },
    });

    try {
      // Execute blockchain transaction via TreasuryService
      const treasuryService = getTreasuryService();
      const mintResult = await treasuryService.mintDistribution(
        ambassador.walletAddress as Address,
        recipientAddress
      );

      if (!mintResult.success) {
        // Update distribution status to failed
        await prisma.distribution.update({
          where: { id: distribution.id },
          data: {
            status: DISTRIBUTION_STATUS.FAILED,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Error al acuñar tokens',
            details: mintResult.error,
          },
          { status: 500 }
        );
      }

      // Use database transaction for atomic updates
      const result = await prisma.$transaction(async (tx) => {
        // Update distribution with transaction hash and success status
        const updatedDistribution = await tx.distribution.update({
          where: { id: distribution.id },
          data: {
            transactionHash: mintResult.recipientHash,
            status: DISTRIBUTION_STATUS.SUCCESS,
          },
        });

        // Update ambassador statistics
        const currentMinted = BigInt(ambassador.totalPulpaMinted);
        const newMinted = currentMinted + BigInt(6); // 1 PULPA to ambassador + 5 PULPA to recipient

        const updatedAmbassador = await tx.ambassador.update({
          where: { id: ambassador.id },
          data: {
            totalDistributions: { increment: 1 },
            totalPulpaMinted: newMinted.toString(),
          },
        });

        return { updatedDistribution, updatedAmbassador };
      });

      // Record successful distribution in rate limiter
      const remaining = nfcRateLimiter.recordRequest(nfcId);
      const rateLimitInfo = nfcRateLimiter.getRateLimitInfo(nfcId);

      // Return success response with rate limit headers
      return NextResponse.json(
        {
          success: true,
          distribution: {
            id: result.updatedDistribution.id,
            transactionHash: result.updatedDistribution.transactionHash,
            ambassadorAmount: result.updatedDistribution.ambassadorAmount,
            recipientAmount: result.updatedDistribution.recipientAmount,
            explorerUrl: `https://optimistic.etherscan.io/tx/${result.updatedDistribution.transactionHash}`,
            createdAt: result.updatedDistribution.createdAt.toISOString(),
          },
          ambassador: {
            totalDistributions: result.updatedAmbassador.totalDistributions,
            totalPulpaMinted: result.updatedAmbassador.totalPulpaMinted,
          },
        },
        {
          headers: {
            'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitInfo.resetAt).toISOString(),
          },
        }
      );
    } catch (blockchainError) {
      // Update distribution status to failed
      await prisma.distribution.update({
        where: { id: distribution.id },
        data: {
          status: DISTRIBUTION_STATUS.FAILED,
        },
      });

      console.error('Blockchain error:', blockchainError);

      return NextResponse.json(
        {
          success: false,
          error: 'Error en la transacción blockchain',
          details:
            blockchainError instanceof Error
              ? blockchainError.message
              : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Distribution API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
