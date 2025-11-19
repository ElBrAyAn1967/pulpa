import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validateNFCId } from '@/lib/utils/nfc';
import type { NFCStatus } from '@/lib/types/ambassador';

/**
 * GET /api/nfc/[nfcId]/status
 * Check if NFC is registered and return ambassador data if exists
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nfcId: string }> }
) {
  try {
    const { nfcId } = await params;

    // Validate NFC ID format
    const validation = validateNFCId(nfcId);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'NFC ID inválido' },
        { status: 400 }
      );
    }

    // Query database for ambassador
    const ambassador = await prisma.ambassador.findUnique({
      where: { nfcId },
      select: {
        id: true,
        nfcId: true,
        displayName: true,
        walletAddress: true,
        ensName: true,
        favoriteFruit: true,
        totalDistributions: true,
        totalPulpaMinted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: NFCStatus = {
      nfcId,
      isRegistered: !!ambassador,
      ambassador: ambassador ? {
        ...ambassador,
        ensName: ambassador.ensName || undefined,
        createdAt: ambassador.createdAt.toISOString(),
        updatedAt: ambassador.updatedAt.toISOString(),
      } : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('NFC status check error:', error);
    return NextResponse.json(
      { error: 'Error al verificar NFC' },
      { status: 500 }
    );
  }
}
