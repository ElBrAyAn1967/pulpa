'use client';

interface NFCErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export default function NFCErrorDisplay({ error, onRetry }: NFCErrorDisplayProps) {
  return (
    <div className="page flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Error Icon */}
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

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Error con NFC
          </h2>
          <p className="text-muted-foreground">
            {error}
          </p>
        </div>

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Reintentar
          </button>
        )}

        {/* Help Text */}
        <p className="text-sm text-muted-foreground">
          Si el problema persiste, contacta al administrador del sistema
        </p>
      </div>
    </div>
  );
}
