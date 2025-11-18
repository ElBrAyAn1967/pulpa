'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AmbassadorProfile } from '@/components/ambassador';
import type { Ambassador } from '@/lib/types/ambassador';

export default function DistributionPage() {
  const params = useParams();
  const nfcId = params.nfcId as string;

  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        {/* Distribution Section (Coming Soon) */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div className="inline-block px-4 py-2 bg-accent/10 rounded-lg">
            <span className="text-sm font-medium text-accent">
              🚧 Próximamente (Ticket 2.x)
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Distribución de $PULPA
          </h3>
          <p className="text-muted-foreground">
            Funcionalidades por implementar:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Formulario para ingresar dirección del nuevo usuario</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Distribución de tokens (1 $PULPA al embajador, 5 $PULPA al usuario)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Historial de distribuciones</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
