import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/ambassadors/[id]/history
 *
 * Retrieves paginated distribution history for a specific ambassador
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 *
 * Response:
 * - distributions: Array of distribution records
 * - pagination: Pagination metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    // Validate ambassador ID format (cuid)
    if (!id || typeof id !== 'string') {
      return Response.json(
        { error: 'Invalid ambassador ID' },
        { status: 400 }
      );
    }

    // Check if ambassador exists
    const ambassador = await prisma.ambassador.findUnique({
      where: { id },
      select: { id: true, walletAddress: true, displayName: true }
    });

    if (!ambassador) {
      return Response.json(
        { error: 'Ambassador not found' },
        { status: 404 }
      );
    }

    // Get total count for pagination
    const totalCount = await prisma.distribution.count({
      where: { ambassadorId: id }
    });

    // Query distribution history
    const distributions = await prisma.distribution.findMany({
      where: {
        ambassadorId: id,
      },
      select: {
        id: true,
        recipientAddress: true,
        ambassadorAmount: true,
        recipientAmount: true,
        transactionHash: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc', // Newest first
      },
      skip,
      take: limit,
    });

    // Format response
    const formattedDistributions = distributions.map((dist) => ({
      id: dist.id,
      recipientAddress: dist.recipientAddress as `0x${string}`,
      amounts: {
        ambassador: dist.ambassadorAmount,
        recipient: dist.recipientAmount,
      },
      transactionHash: dist.transactionHash || null,
      status: dist.status,
      createdAt: dist.createdAt.toISOString(),
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return Response.json({
      distributions: formattedDistributions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      ambassador: {
        id: ambassador.id,
        walletAddress: ambassador.walletAddress,
        displayName: ambassador.displayName,
      },
    });
  } catch (error) {
    console.error('Error fetching distribution history:', error);

    return Response.json(
      {
        error: 'Failed to fetch distribution history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
