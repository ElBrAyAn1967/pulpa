import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { validateNFCId } from '@/lib/utils/nfc';
import type { AmbassadorRegistrationData, AmbassadorRegistrationResponse } from '@/lib/types/ambassador';

/**
 * POST /api/ambassadors/register
 * Register a new ambassador with NFC ID
 */
export async function POST(request: NextRequest) {
  try {
    const body: AmbassadorRegistrationData = await request.json();
    const { nfcId, walletAddress, ensName, displayName, favoriteFruit } = body;

    // Validation
    const nfcValidation = validateNFCId(nfcId);
    if (!nfcValidation.valid) {
      return NextResponse.json(
        { success: false, error: nfcValidation.error || 'NFC ID inválido' },
        { status: 400 }
      );
    }

    if (!isAddress(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Dirección de wallet inválida' },
        { status: 400 }
      );
    }

    if (!displayName || displayName.length > 32) {
      return NextResponse.json(
        { success: false, error: 'Nombre inválido (máximo 32 caracteres)' },
        { status: 400 }
      );
    }

    if (!favoriteFruit) {
      return NextResponse.json(
        { success: false, error: 'Debes seleccionar una fruta' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Prisma database operation
    // For now, return mock success response
    const mockAmbassador = {
      id: Math.random().toString(36).substring(7),
      nfcId,
      walletAddress,
      ensName,
      displayName,
      favoriteFruit,
      totalDistributions: 0,
      totalPulpaMinted: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const response: AmbassadorRegistrationResponse = {
      success: true,
      ambassador: mockAmbassador,
    };

    console.log('Ambassador registered:', mockAmbassador);

    return NextResponse.json(response);

    /*
    // Uncomment when Prisma is configured:

    // Check for duplicate NFC ID
    const existingNFC = await prisma.ambassador.findUnique({
      where: { nfcId },
    });

    if (existingNFC) {
      return NextResponse.json(
        { success: false, error: 'Este NFC ya está registrado' },
        { status: 409 }
      );
    }

    // Check for duplicate wallet address
    const existingWallet = await prisma.ambassador.findUnique({
      where: { walletAddress },
    });

    if (existingWallet) {
      return NextResponse.json(
        { success: false, error: 'Esta wallet ya está registrada' },
        { status: 409 }
      );
    }

    // Create ambassador record
    const ambassador = await prisma.ambassador.create({
      data: {
        nfcId,
        walletAddress,
        ensName,
        displayName,
        favoriteFruit,
        totalDistributions: 0,
        totalPulpaMinted: '0',
      },
    });

    const response: AmbassadorRegistrationResponse = {
      success: true,
      ambassador,
    };

    return NextResponse.json(response);
    */
  } catch (error) {
    console.error('Ambassador registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Error al registrar embajador' },
      { status: 500 }
    );
  }
}
