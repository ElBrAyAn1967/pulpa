'use client';

import { useState, useEffect } from 'react';
import { useEnsName, useEnsAddress, useEnsAvatar } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { normalize } from 'viem/ens';
import { isAddress } from 'viem';
import FruitSelector from './FruitSelector';
import type { FruitEmoji, AmbassadorRegistrationData } from '@/lib/types/ambassador';

interface AmbassadorRegistrationFormProps {
  nfcId: string;
  onSubmit: (data: AmbassadorRegistrationData) => Promise<void>;
  onCancel?: () => void;
}

export default function AmbassadorRegistrationForm({
  nfcId,
  onSubmit,
  onCancel,
}: AmbassadorRegistrationFormProps) {
  const [walletInput, setWalletInput] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedFruit, setSelectedFruit] = useState<FruitEmoji | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ENS resolution: Input → Address
  const {
    data: ensResolvedAddress,
    isLoading: isResolvingENS,
    error: ensError,
  } = useEnsAddress({
    name: walletInput.includes('.') ? normalize(walletInput) : undefined,
    chainId: mainnet.id,
  });

  // Reverse ENS: Address → Name
  const resolvedAddress = ensResolvedAddress || (isAddress(walletInput) ? walletInput : null);
  const {
    data: ensName,
    isLoading: isLoadingENSName,
  } = useEnsName({
    address: resolvedAddress as `0x${string}` | undefined,
    chainId: mainnet.id,
  });

  // ENS Avatar
  const {
    data: ensAvatar,
  } = useEnsAvatar({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  // Auto-populate display name from ENS
  useEffect(() => {
    if (ensName && !displayName) {
      setDisplayName(ensName);
    }
  }, [ensName, displayName]);

  // Validation
  const isWalletValid = !!resolvedAddress && isAddress(resolvedAddress);
  const isDisplayNameValid = displayName.trim().length > 0 && displayName.length <= 32;
  const isFruitSelected = selectedFruit !== null;
  const isFormValid = isWalletValid && isDisplayNameValid && isFruitSelected && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || !resolvedAddress || !selectedFruit) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const registrationData: AmbassadorRegistrationData = {
        nfcId,
        walletAddress: resolvedAddress,
        ensName: ensName || undefined,
        displayName: displayName.trim(),
        favoriteFruit: selectedFruit,
      };

      await onSubmit(registrationData);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Error al registrar embajador');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Registro de Embajador
          </h1>
          <p className="text-muted-foreground">
            Registra tu NFC y conviértete en embajador $PULPA
          </p>
          <div className="inline-block px-4 py-2 bg-accent/10 rounded-lg">
            <span className="text-sm font-mono text-accent">
              NFC: {nfcId}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Address / ENS Field */}
          <div className="space-y-2">
            <label htmlFor="wallet" className="block text-sm font-medium text-foreground">
              Dirección de wallet o ENS
              <span className="text-destructive ml-1">*</span>
            </label>

            <div className="relative">
              <input
                id="wallet"
                type="text"
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                placeholder="0x... o nombre.eth"
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />

              {isResolvingENS && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>

            {/* ENS Resolution Feedback */}
            {walletInput && (
              <div className="space-y-1">
                {isResolvingENS && (
                  <p className="text-sm text-muted-foreground">
                    Resolviendo ENS...
                  </p>
                )}

                {!isResolvingENS && ensResolvedAddress && (
                  <p className="text-sm text-accent">
                    ✓ ENS resuelto: {ensResolvedAddress.slice(0, 6)}...{ensResolvedAddress.slice(-4)}
                  </p>
                )}

                {!isResolvingENS && walletInput && !isWalletValid && (
                  <p className="text-sm text-destructive">
                    Dirección o ENS inválido
                  </p>
                )}
              </div>
            )}

            {/* ENS Avatar Display */}
            {ensAvatar && (
              <div className="flex items-center gap-3 p-3 bg-card-hover rounded-lg">
                <img
                  src={ensAvatar}
                  alt="ENS Avatar"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Avatar ENS detectado
                  </p>
                  {ensName && (
                    <p className="text-xs text-muted-foreground">
                      {ensName}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Display Name Field */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
              Nombre para mostrar
              <span className="text-destructive ml-1">*</span>
            </label>

            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu nombre o apodo"
              maxLength={32}
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {isLoadingENSName && 'Cargando nombre ENS...'}
                {ensName && !displayName && `Sugerencia: ${ensName}`}
              </span>
              <span>
                {displayName.length}/32
              </span>
            </div>
          </div>

          {/* Fruit Selector */}
          <FruitSelector
            selected={selectedFruit}
            onSelect={setSelectedFruit}
          />

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 py-3 px-6 rounded-lg bg-secondary text-secondary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              disabled={!isFormValid}
              className="flex-1 py-3 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent" />
                  Registrando...
                </span>
              ) : (
                'Registrar Embajador'
              )}
            </button>
          </div>

          {/* Form Hints */}
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              Los campos marcados con <span className="text-destructive">*</span> son obligatorios
            </p>
            {!isFormValid && walletInput && displayName && !selectedFruit && (
              <p className="text-xs text-accent">
                Por favor selecciona tu fruta favorita
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
