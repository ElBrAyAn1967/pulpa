'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AmbassadorProfile } from '@/components/ambassador';
import DistributionForm from '@/components/distribution/DistributionForm';
import type { Ambassador } from '@/lib/types/ambassador';

export default function DistributionPage() {
  const params = useParams();
  const router = useRouter();
  const nfcId = params.nfcId as string;

  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionUrl, setTransactionUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAmbassador() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/nfc/${nfcId}/status`);

        if (!response.ok) {
          throw new Error('Failed to fetch ambassador data');
        }

        const data = await response.json();

        if (data.isRegistered && data.ambassador) {
          setAmbassador({
            ...data.ambassador,
            createdAt: data.ambassador.createdAt || new Date().toISOString(),
            updatedAt: data.ambassador.updatedAt || new Date().toISOString(),
          });
        } else {
          setError('NFC no registrado');
        }
      } catch (err) {
        console.error('Error fetching ambassador:', err);
        setError('Error al cargar datos del embajador');
      } finally {
        setLoading(false);
      }
    }

    fetchAmbassador();
  }, [nfcId]);

  if (loading) {
    return (
      <div className="page flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Cargando perfil del embajador...</p>
        </div>
      </div>
    );
  }

  if (error || !ambassador) {
    return (
      <div className="page flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              {error || 'Embajador no encontrado'}
            </h2>
            <p className="text-muted-foreground">
              Este NFC no está registrado como embajador
            </p>
          </div>
          <div className="p-4 bg-card rounded-lg border border-border">
            <p className="text-sm font-medium text-foreground mb-2">
              NFC ID:
            </p>
            <p className="text-lg font-mono text-primary">
              {nfcId}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page min-h-screen p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Perfil del Embajador
          </h1>
          <p className="text-muted-foreground">
            NFC ID: <span className="font-mono text-primary">{nfcId}</span>
          </p>
        </div>

        {/* Ambassador Profile */}
        <AmbassadorProfile ambassador={ambassador} />

        {/* Distribution Section */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              Distribución de $PULPA
            </h3>
            <p className="text-muted-foreground">
              Distribuye tokens $PULPA a nuevos usuarios. El embajador recibe 1 $PULPA y el usuario recibe 5 $PULPA.
            </p>
          </div>

          {showSuccess && transactionUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
              <p className="text-sm text-green-600 font-semibold">
                ✅ Distribución exitosa
              </p>
              <a
                href={transactionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Ver transacción en Optimism Explorer
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}

          <DistributionForm
            nfcId={nfcId}
            onSuccess={(data) => {
              setShowSuccess(true);
              setTransactionUrl(data.explorerUrl);
              // Refresh ambassador data to show updated statistics
              window.location.reload();
            }}
          />
        </div>
      </div>
    </div>
  );
}
