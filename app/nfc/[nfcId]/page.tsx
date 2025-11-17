'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { validateNFCId, storeNFCId } from '@/lib/utils/nfc';
import NFCErrorDisplay from '@/components/nfc/NFCErrorDisplay';
import type { NFCStatus } from '@/lib/types/ambassador';

export default function NFCLandingPage() {
  const params = useParams();
  const router = useRouter();
  const nfcId = params.nfcId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkNFCStatus() {
      try {
        // Validate NFC ID format
        const validation = validateNFCId(nfcId);
        if (!validation.valid) {
          setError(validation.error || 'NFC ID inválido');
          setLoading(false);
          return;
        }

        // Store in localStorage for persistence
        storeNFCId(nfcId);

        // Check NFC registration status
        const response = await fetch(`/api/nfc/${nfcId}/status`);

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al verificar NFC');
        }

        const data: NFCStatus = await response.json();

        // Route based on registration status
        if (data.isRegistered) {
          // NFC already registered → Go to distribution flow
          router.push(`/nfc/${nfcId}/distribute`);
        } else {
          // New NFC → Go to registration flow
          router.push(`/nfc/${nfcId}/register`);
        }
      } catch (err) {
        console.error('NFC check error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setLoading(false);
      }
    }

    checkNFCStatus();
  }, [nfcId, router]);

  if (loading) {
    return (
      <div className="page flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          {/* Loading Spinner */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto" />

          {/* Loading Text */}
          <div className="space-y-2">
            <p className="text-xl font-semibold text-foreground">
              Verificando NFC
            </p>
            <p className="text-sm text-muted-foreground">
              Espera un momento...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <NFCErrorDisplay
        error={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Redirecting state
  return (
    <div className="page flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-pulse">
          <svg
            className="w-16 h-16 text-primary mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">
          Redirigiendo...
        </p>
      </div>
    </div>
  );
}
