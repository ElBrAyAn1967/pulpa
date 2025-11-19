import { NextRequest } from 'next/server';
import {
  getBlacklistEntries,
  addToBlacklist,
  removeFromBlacklist,
} from '@/lib/security/distribution-checks';

/**
 * GET /api/admin/blacklist
 * Get all blacklisted addresses
 */
export async function GET() {
  try {
    const blacklist = await getBlacklistEntries(100);

    return Response.json({
      blacklist: blacklist.map((entry) => ({
        id: entry.id,
        address: entry.address,
        reason: entry.reason,
        addedBy: entry.addedBy,
        createdAt: entry.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching blacklist:', error);

    return Response.json(
      {
        error: 'Failed to fetch blacklist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blacklist
 * Add address to blacklist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, reason, addedBy } = body;

    if (!address || !reason || !addedBy) {
      return Response.json(
        {
          error: 'Missing required fields: address, reason, addedBy',
        },
        { status: 400 }
      );
    }

    // Validate Ethereum address format
    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return Response.json(
        {
          error: 'Invalid Ethereum address format',
        },
        { status: 400 }
      );
    }

    await addToBlacklist(address, reason, addedBy);

    return Response.json({
      success: true,
      message: `Address ${address} added to blacklist`,
    });
  } catch (error) {
    console.error('Error adding to blacklist:', error);

    return Response.json(
      {
        error: 'Failed to add to blacklist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/blacklist
 * Remove address from blacklist
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return Response.json(
        {
          error: 'Missing required parameter: address',
        },
        { status: 400 }
      );
    }

    await removeFromBlacklist(address);

    return Response.json({
      success: true,
      message: `Address ${address} removed from blacklist`,
    });
  } catch (error) {
    console.error('Error removing from blacklist:', error);

    return Response.json(
      {
        error: 'Failed to remove from blacklist',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
