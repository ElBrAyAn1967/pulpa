/**
 * Mobile-optimized NFC scanner with enhanced UX
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TouchButton, TouchInput, MobileAlert, BottomSheet } from '@/components/ui/MobileOptimized';
import { isTouchDevice, getOrientation, prefersReducedMotion } from '@/lib/utils/responsive';

interface NFCScannerMobileProps {
  redirectPath: (nfcId: string) => string;
  title: string;
  description: string;
  icon: string;
  color: 'blue' | 'green' | 'purple';
  demoNfcIds?: Array<{ id: string; label: string; description: string }>;
}

export default function NFCScannerMobile({
  redirectPath,
  title,
  description,
  icon,
  color,
  demoNfcIds = [],
}: NFCScannerMobileProps) {
  const router = useRouter();
  const [nfcId, setNfcId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isNFCSupported, setIsNFCSupported] = useState<boolean | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const colorClasses = {
    blue: {
      button: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
      icon: 'bg-blue-500',
      ring: 'ring-blue-500',
      border: 'border-blue-200 dark:border-blue-800',
      bg: 'bg-blue-50 dark:bg-blue-950',
      text: 'text-blue-900 dark:text-blue-100',
    },
    green: {
      button: 'bg-green-500 hover:bg-green-600 active:bg-green-700',
      icon: 'bg-green-500',
      ring: 'ring-green-500',
      border: 'border-green-200 dark:border-green-800',
      bg: 'bg-green-50 dark:bg-green-950',
      text: 'text-green-900 dark:text-green-100',
    },
    purple: {
      button: 'bg-purple-500 hover:bg-purple-600 active:bg-purple-700',
      icon: 'bg-purple-500',
      ring: 'ring-purple-500',
      border: 'border-purple-200 dark:border-purple-800',
      bg: 'bg-purple-50 dark:bg-purple-950',
      text: 'text-purple-900 dark:text-purple-100',
    },
  };

  const colors = colorClasses[color];

  useEffect(() => {
    // Check NFC support
    if (typeof window !== 'undefined') {
      setIsNFCSupported('NDEFReader' in window);
    }

    // Monitor orientation changes
    const handleOrientationChange = () => {
      setOrientation(getOrientation());
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (nfcId.trim()) {
      router.push(redirectPath(nfcId.trim()));
    }
  };

  const handleNFCScan = async () => {
    setIsScanning(true);
    setError(null);

    try {
      if (!('NDEFReader' in window)) {
        setError('Web NFC no está disponible en este navegador');
        setIsNFCSupported(false);
        setIsScanning(false);
        setShowManualInput(true);
        return;
      }

      const ndef = new (window as any).NDEFReader();
      await ndef.scan();

      // Provide haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      ndef.addEventListener('reading', ({ serialNumber }: any) => {
        // Success vibration
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        setIsScanning(false);
        router.push(redirectPath(serialNumber));
      });

      ndef.addEventListener('readingerror', () => {
        setError('Error al leer el NFC. Intenta de nuevo.');
        setIsScanning(false);

        // Error vibration
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      });
    } catch (error: any) {
      console.error('Error scanning NFC:', error);

      let errorMessage = 'Error al escanear NFC';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permiso denegado. Habilita NFC en la configuración de tu dispositivo.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Tu dispositivo no soporta NFC';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Escaneo cancelado';
      }

      setError(errorMessage);
      setIsScanning(false);

      // Error vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  const reducedMotion = typeof window !== 'undefined' && prefersReducedMotion();

  return (
    <div className="space-y-6">
      {/* NFC Scan Button - Large and prominent */}
      <div className="text-center space-y-4">
        <div
          className={`
            w-32 h-32 sm:w-40 sm:h-40 rounded-full ${colors.icon}
            flex items-center justify-center text-6xl sm:text-7xl mx-auto
            shadow-2xl
            ${!reducedMotion && isScanning ? 'animate-pulse' : ''}
          `}
        >
          {icon}
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm sm:text-base text-muted-foreground px-4">{description}</p>

        {/* Orientation guide for landscape */}
        {orientation === 'landscape' && (
          <div className={`p-3 rounded-lg border ${colors.border} ${colors.bg}`}>
            <p className={`text-xs sm:text-sm ${colors.text}`}>
              💡 Consejo: Sostén tu dispositivo en posición vertical para mejor escaneo
            </p>
          </div>
        )}

        {isNFCSupported !== false ? (
          <TouchButton
            onClick={handleNFCScan}
            disabled={isScanning}
            loading={isScanning}
            variant={color === 'blue' ? 'primary' : 'success'}
            size="large"
            fullWidth
            className="shadow-2xl"
          >
            {isScanning ? (
              <>
                <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span>Acerca tu dispositivo al NFC...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span>Escanear NFC</span>
              </>
            )}
          </TouchButton>
        ) : (
          <MobileAlert
            type="warning"
            title="NFC no disponible"
            message="Tu navegador o dispositivo no soporta escaneo NFC. Usa entrada manual."
          />
        )}

        {/* Instructions during scanning */}
        {isScanning && (
          <div
            className={`p-4 rounded-lg border ${colors.border} ${colors.bg} ${
              !reducedMotion ? 'animate-pulse' : ''
            }`}
          >
            <p className={`text-sm font-medium ${colors.text}`}>
              📱 Mantén tu dispositivo cerca del NFC sticker hasta que vibre
            </p>
          </div>
        )}

        {/* Error display */}
        {error && (
          <MobileAlert type="error" title="Error" message={error} onClose={() => setError(null)} />
        )}
      </div>

      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">O</span>
        </div>
      </div>

      {/* Manual Input Section */}
      <div className="space-y-4">
        <TouchButton
          onClick={() => setShowManualInput(!showManualInput)}
          variant="secondary"
          size="medium"
          fullWidth
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <span>Ingresar ID Manualmente</span>
        </TouchButton>

        {/* Manual input bottom sheet for mobile */}
        <BottomSheet
          isOpen={showManualInput}
          onClose={() => setShowManualInput(false)}
          title="Ingresa el ID del NFC"
        >
          <form onSubmit={handleManualInput} className="space-y-6">
            <TouchInput
              id="nfcId"
              label="ID del NFC Sticker"
              value={nfcId}
              onChange={setNfcId}
              placeholder="Ej: TEST123"
              helperText="Pídele al embajador su ID de NFC si no puedes escanear"
              inputMode="text"
              autoComplete="off"
            />

            <div className="flex gap-3">
              <TouchButton
                type="button"
                onClick={() => setShowManualInput(false)}
                variant="secondary"
                size="large"
                fullWidth
              >
                Cancelar
              </TouchButton>
              <TouchButton
                type="submit"
                disabled={!nfcId.trim()}
                variant={color === 'blue' ? 'primary' : 'success'}
                size="large"
                fullWidth
              >
                Continuar
              </TouchButton>
            </div>
          </form>
        </BottomSheet>
      </div>

      {/* Demo NFCs - Mobile-optimized cards */}
      {demoNfcIds.length > 0 && (
        <div className={`rounded-xl border ${colors.border} p-4 sm:p-6 space-y-4`}>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span>🧪</span>
            <span>Demo - NFCs de Prueba</span>
          </h3>
          <div className="space-y-2">
            {demoNfcIds.map((demo) => (
              <button
                key={demo.id}
                onClick={() => router.push(redirectPath(demo.id))}
                className="w-full p-4 bg-card hover:bg-card/80 active:bg-card/60 rounded-lg border border-border transition-all duration-200 shadow-md active:scale-[0.98] min-h-[64px]"
              >
                <div className="flex items-center justify-between text-left">
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-base">{demo.label}</p>
                    <p className="text-sm text-muted-foreground">{demo.description}</p>
                  </div>
                  <svg
                    className="w-6 h-6 text-muted-foreground flex-shrink-0 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* NFC Support info */}
      {isNFCSupported === false && (
        <div className="bg-yellow-50 dark:bg-yellow-950 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4 sm:p-6 space-y-3">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 flex items-center gap-2">
            <span>ℹ️</span>
            <span>Acerca del escaneo NFC</span>
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">•</span>
              <span>El escaneo NFC está disponible solo en Chrome para Android</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">•</span>
              <span>Asegúrate de tener NFC habilitado en la configuración de tu dispositivo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0">•</span>
              <span>Puedes usar entrada manual en cualquier dispositivo</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
