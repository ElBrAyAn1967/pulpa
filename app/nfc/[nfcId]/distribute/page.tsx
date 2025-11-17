'use client';

import { useParams } from 'next/navigation';

export default function DistributionPage() {
  const params = useParams();
  const nfcId = params.nfcId as string;

  return (
    <div className="page flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Placeholder Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Coming Soon Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Página de Distribución
          </h2>
          <p className="text-muted-foreground">
            Esta es la página donde los embajadores distribuirán $PULPA a nuevos usuarios
          </p>
        </div>

        {/* NFC Info */}
        <div className="p-4 bg-card rounded-lg border border-border">
          <p className="text-sm font-medium text-foreground mb-2">
            NFC Activo:
          </p>
          <p className="text-lg font-mono text-primary">
            {nfcId}
          </p>
        </div>

        {/* Coming Soon Badge */}
        <div className="inline-block px-4 py-2 bg-accent/10 rounded-lg">
          <span className="text-sm font-medium text-accent">
            🚧 Próximamente (Ticket 2.x)
          </span>
        </div>

        {/* Features List */}
        <div className="text-left space-y-2 p-4 bg-card rounded-lg">
          <p className="text-sm font-medium text-foreground mb-3">
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
              <span>Perfil del embajador con estadísticas</span>
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
