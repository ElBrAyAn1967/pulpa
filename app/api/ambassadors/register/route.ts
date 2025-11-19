import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ambassadorRegistrationSchema } from '@/lib/validations/ambassador';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

/**
 * POST /api/ambassadors/register
 * Register a new ambassador with NFC tag and wallet
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input with Zod schema
    const validatedData = ambassadorRegistrationSchema.parse(body);

    // Check for duplicate NFC ID
    const existingNfcId = await prisma.ambassador.findUnique({
      where: { nfcId: validatedData.nfcId },
    });

    if (existingNfcId) {
      return NextResponse.json(
        {
          error: 'NFC_ID_EXISTS',
          message: 'Este NFC ID ya está registrado'
        },
        { status: 409 }
      );
    }

    // Check for duplicate wallet address
    const existingWallet = await prisma.ambassador.findUnique({
      where: { walletAddress: validatedData.walletAddress },
    });

    if (existingWallet) {
      return NextResponse.json(
        {
          error: 'WALLET_EXISTS',
          message: 'Esta wallet ya está registrada'
        },
        { status: 409 }
      );
    }

    // Create new ambassador record
    const ambassador = await prisma.ambassador.create({
      data: {
        nfcId: validatedData.nfcId,
        walletAddress: validatedData.walletAddress,
        ensName: validatedData.ensName || null,
        displayName: validatedData.displayName,
        favoriteFruit: validatedData.favoriteFruit,
        totalDistributions: 0,
        totalPulpaMinted: '0',
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        ambassador: {
          id: ambassador.id,
          nfcId: ambassador.nfcId,
          walletAddress: ambassador.walletAddress,
          ensName: ambassador.ensName,
          displayName: ambassador.displayName,
          favoriteFruit: ambassador.favoriteFruit,
          totalDistributions: ambassador.totalDistributions,
          totalPulpaMinted: ambassador.totalPulpaMinted,
          createdAt: ambassador.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error caught in POST handler:', error);
    console.error('Error type:', error?.constructor?.name);
    console.error('Error is ZodError?', error instanceof ZodError);

    // Handle validation errors
    if (error instanceof ZodError) {
      console.log('Handling ZodError with issues:', error.issues);
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          details: error.issues?.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })) || [],
        },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error:', error);
      return NextResponse.json(
        {
          error: 'DATABASE_ERROR',
          message: 'Error de base de datos',
        },
        { status: 500 }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in ambassador registration:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Error interno del servidor',
        debug: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
