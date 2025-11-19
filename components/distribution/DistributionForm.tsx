'use client';

import { useState } from 'react';
import { isAddress, type Address } from 'viem';
import { normalize } from 'viem/ens';
import { usePublicClient } from 'wagmi';

interface DistributionFormProps {
  nfcId: string;
  onSuccess?: (data: {
    transactionHash: string;
    explorerUrl: string;
    recipientAddress: string;
    ambassadorAmount: string;
    recipientAmount: string;
    totalDistributions: number;
    totalPulpaMinted: string;
  }) => void;
}

export default function DistributionForm({
  nfcId,
  onSuccess,
}: DistributionFormProps) {
  const [addressInput, setAddressInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<Address | null>(null);

  const publicClient = usePublicClient();

  const resolveENS = async (ensName: string): Promise<Address | null> => {
    if (!publicClient) {
      throw new Error('Public client not initialized');
    }

    try {
      const normalizedName = normalize(ensName);
      const address = await publicClient.getEnsAddress({
        name: normalizedName,
      });
      return address;
    } catch (error) {
      console.error('ENS resolution error:', error);
      return null;
    }
  };

  const handleInputChange = async (value: string) => {
    setAddressInput(value);
    setError(null);
    setResolvedAddress(null);

    // Clear input
    if (!value.trim()) {
      return;
    }

    // Check if it's an ENS name
    if (value.endsWith('.eth')) {
      setIsResolving(true);
      try {
        const address = await resolveENS(value);
        if (address) {
          setResolvedAddress(address);
        } else {
          setError('No se pudo resolver el nombre ENS');
        }
      } catch (err) {
        setError('Error al resolver ENS');
      } finally {
        setIsResolving(false);
      }
    }
    // Check if it's a valid address
    else if (isAddress(value)) {
      setResolvedAddress(value as Address);
    } else if (value.length > 5) {
      setError('Dirección inválida. Ingresa una dirección Ethereum o nombre ENS');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const targetAddress = resolvedAddress;

    if (!targetAddress) {
      setError('Por favor ingresa una dirección válida o nombre ENS');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/distributions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nfcId,
          recipientAddress: targetAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear distribución');
      }

      setSuccessMessage(
        `¡Tokens distribuidos exitosamente! 🎉\n5 PULPA enviados a ${addressInput}\n1 PULPA enviado al embajador`
      );
      setAddressInput('');
      setResolvedAddress(null);

      if (onSuccess && data.distribution && data.ambassador) {
        onSuccess({
          transactionHash: data.distribution.transactionHash,
          explorerUrl: data.distribution.explorerUrl,
          recipientAddress: targetAddress,
          ambassadorAmount: data.distribution.ambassadorAmount,
          recipientAmount: data.distribution.recipientAmount,
          totalDistributions: data.ambassador.totalDistributions,
          totalPulpaMinted: data.ambassador.totalPulpaMinted,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Dirección Ethereum o ENS
          </label>
          <input
            id="address"
            type="text"
            value={addressInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="0x... o nombre.eth"
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {isResolving && (
            <p className="mt-2 text-sm text-gray-500">
              Resolviendo nombre ENS...
            </p>
          )}
          {resolvedAddress && (
            <p className="mt-2 text-sm text-green-600">
              ✓ Dirección válida: {resolvedAddress.slice(0, 6)}...
              {resolvedAddress.slice(-4)}
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600 whitespace-pre-line">
              {successMessage}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !resolvedAddress || isResolving}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Procesando transacción...
            </span>
          ) : (
            'Quiero $PULPA'
          )}
        </button>

        <div className="text-center text-sm text-gray-500">
          <p>Se distribuirán:</p>
          <p className="font-semibold">5 PULPA al destinatario</p>
          <p className="font-semibold">1 PULPA al embajador</p>
        </div>
      </form>
    </div>
  );
}
