import { NextRequest, NextResponse } from 'next/server';
import { validateNFCId } from '@/lib/utils/nfc';
import type { NFCStatus } from '@/lib/types/ambassador';

/**
 * GET /api/nfc/[nfcId]/status
 * Check if NFC is registered and return ambassador data if exists
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { nfcId: string } }
) {
  try {
    const { nfcId } = params;

    // Validate NFC ID format
    const validation = validateNFCId(nfcId);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'NFC ID inválido' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Prisma query when database is set up
    // For now, return mock data for development
    const mockAmbassadors: Record<string, any> = {
      'TEST123': {
        id: '1',
        displayName: 'El Frutero',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        favoriteFruit: '🍎',
        totalDistributions: 5,
        totalPulpaMinted: '5',
      },
      'NFC001': {
        id: '2',
        displayName: 'Pulpa Master',
        walletAddress: '0x1234567890123456789012345678901234567890',
        favoriteFruit: '🍊',
        totalDistributions: 12,
        totalPulpaMinted: '12',
      },
    };

    const ambassador = mockAmbassadors[nfcId];

    const response: NFCStatus = {
      nfcId,
      isRegistered: !!ambassador,
      ambassador: ambassador || undefined,
    };

    return NextResponse.json(response);

    /*
    // Uncomment when Prisma is configured:
    const ambassador = await prisma.ambassador.findUnique({
      where: { nfcId },
      select: {
        id: true,
        displayName: true,
        walletAddress: true,
        ensName: true,
        favoriteFruit: true,
        totalDistributions: true,
        totalPulpaMinted: true,
      },
    });

    const response: NFCStatus = {
      nfcId,
      isRegistered: !!ambassador,
      ambassador: ambassador || undefined,
    };

    return NextResponse.json(response);
    */
  } catch (error) {
    console.error('NFC status check error:', error);
    return NextResponse.json(
      { error: 'Error al verificar NFC' },
      { status: 500 }
    );
  }
}
