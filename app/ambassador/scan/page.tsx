'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AmbassadorScanPage() {
  const router = useRouter();
  const [nfcId, setNfcId] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (nfcId.trim()) {
      router.push(`/nfc/${nfcId.trim()}`);
    }
  };

  const handleNFCScan = async () => {
    setIsScanning(true);

    try {
      // Check if Web NFC is available
      if ('NDEFReader' in window) {
        const ndef = new (window as any).NDEFReader();
        await ndef.scan();

        ndef.addEventListener('reading', ({ serialNumber }: any) => {
          setIsScanning(false);
          router.push(`/nfc/${serialNumber}`);
        });
      } else {
        alert('Web NFC no está disponible en este navegador. Usa entrada manual o Chrome en Android.');
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Error scanning NFC:', error);
      alert('Error al escanear NFC. Por favor intenta con entrada manual.');
      setIsScanning(false);
    }
  };

  return (
    <div className="page">
      <div className="container max-w-2xl space-y-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-5xl mx-auto shadow-lg">
            👨‍🚀
          </div>
          <h1 className="text-3xl font-bold text-foreground">Acceso Embajador</h1>
          <p className="text-muted-foreground">
            Escanea tu NFC sticker o ingresa el ID manualmente
          </p>
        </div>

        {/* NFC Scan Section */}
        <div className="bg-card rounded-xl border border-border p-8 space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Escanear NFC</h2>
            <p className="text-sm text-muted-foreground">
              Acerca tu dispositivo al NFC sticker para acceder a tu panel de embajador
            </p>

            <button
              onClick={handleNFCScan}
              disabled={isScanning}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-3"
            >
              {isScanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Escaneando...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Escanear NFC</span>
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O</span>
              </div>
            </div>
          </div>

          {/* Manual Input */}
          <form onSubmit={handleManualInput} className="space-y-4">
            <div>
              <label htmlFor="nfcId" className="block text-sm font-medium text-foreground mb-2">
                ID del NFC Sticker
              </label>
              <input
                id="nfcId"
                type="text"
                value={nfcId}
                onChange={(e) => setNfcId(e.target.value)}
                placeholder="Ej: TEST123"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Ingresa el ID de tu NFC sticker si no puedes escanear
              </p>
            </div>

            <button
              type="submit"
              disabled={!nfcId.trim()}
              className="w-full py-3 bg-foreground hover:bg-foreground/90 disabled:bg-foreground/50 text-background font-semibold rounded-lg transition-colors"
            >
              Continuar con ID Manual
            </button>
          </form>
        </div>

        {/* Demo NFCs */}
        <div className="bg-accent/10 rounded-xl border border-accent/20 p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span>🧪</span>
            <span>Demo - NFCs de Prueba</span>
          </h3>
          <div className="space-y-2">
            <Link
              href="/nfc/TEST123"
              className="block p-3 bg-card hover:bg-card/80 rounded-lg border border-border transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">TEST123</p>
                  <p className="text-xs text-muted-foreground">NFC registrado - El Frutero 🍎</p>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/nfc/NUEVONFC123"
              className="block p-3 bg-card hover:bg-card/80 rounded-lg border border-border transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">NUEVONFC123</p>
                  <p className="text-xs text-muted-foreground">NFC sin registrar - Registro nuevo</p>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            ¿No tienes un NFC sticker?{' '}
            <Link href="/" className="text-primary hover:underline">
              Solicita uno aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
