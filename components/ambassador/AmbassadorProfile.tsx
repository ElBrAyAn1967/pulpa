'use client';

import { useState } from 'react';
import { formatEther } from 'viem';
import { useReadContract } from 'wagmi';
import type { Ambassador } from '@/lib/types/ambassador';

interface AmbassadorProfileProps {
  ambassador: Ambassador;
  onUpdate?: () => void;
}

export function AmbassadorProfile({ ambassador, onUpdate }: AmbassadorProfileProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Read $PULPA balance from contract (placeholder - will need actual contract address)
  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: '0x0000000000000000000000000000000000000000', // TODO: Replace with actual PulpaToken contract address
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: [ambassador.walletAddress as `0x${string}`],
    chainId: 10, // Optimism
  });

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(ambassador.walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const explorerUrl = `https://optimistic.etherscan.io/address/${ambassador.walletAddress}`;

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-3">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-6xl">
          {ambassador.favoriteFruit}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            {ambassador.displayName}
          </h2>
          {ambassador.ensName && (
            <p className="text-sm text-primary font-medium mt-1">
              {ambassador.ensName}
            </p>
          )}
        </div>
      </div>

      {/* Wallet Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Dirección de Wallet
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-muted rounded-lg px-3 py-2 font-mono text-sm text-foreground">
            {truncateAddress(ambassador.walletAddress)}
          </div>
          <button
            onClick={handleCopyAddress}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            title="Copiar dirección"
          >
            {copiedAddress ? '✓ Copiado' : 'Copiar'}
          </button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium"
            title="Ver en explorador"
          >
            Explorer
          </a>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Distributions */}
        <div className="bg-muted rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Distribuciones Totales
          </div>
          <div className="text-3xl font-bold text-foreground">
            {ambassador.totalDistributions}
          </div>
        </div>

        {/* Total Minted */}
        <div className="bg-muted rounded-lg p-4">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            $PULPA Minteado
          </div>
          <div className="text-3xl font-bold text-primary">
            {ambassador.totalPulpaMinted}
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-muted rounded-lg p-4 sm:col-span-2">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Balance Actual de $PULPA
          </div>
          {balanceLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                Cargando balance...
              </span>
            </div>
          ) : balance !== undefined ? (
            <div className="text-3xl font-bold text-accent">
              {formatEther(balance as bigint)} $PULPA
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Balance no disponible
            </div>
          )}
        </div>
      </div>

      {/* Member Since */}
      <div className="pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Embajador desde:{' '}
          <span className="font-medium text-foreground">
            {new Date(ambassador.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
