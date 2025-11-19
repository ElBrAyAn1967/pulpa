'use client';

interface DistributionSuccessProps {
  transactionHash: string;
  explorerUrl: string;
  recipientAddress: string;
  ambassadorAmount: string;
  recipientAmount: string;
  totalDistributions: number;
  totalPulpaMinted: string;
  onDistributeAgain: () => void;
}

export default function DistributionSuccess({
  transactionHash,
  explorerUrl,
  recipientAddress,
  ambassadorAmount,
  recipientAmount,
  totalDistributions,
  totalPulpaMinted,
  onDistributeAgain,
}: DistributionSuccessProps) {
  const handleShare = () => {
    const text = `¡Acabo de distribuir ${recipientAmount} $PULPA! 🎉\n\nVer transacción: ${explorerUrl}`;

    if (navigator.share) {
      navigator.share({
        title: '$PULPA Distribution',
        text: text,
        url: explorerUrl,
      }).catch(() => {
        // Fallback to copy to clipboard
        copyToClipboard(text);
      });
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Enlace copiado al portapapeles');
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(transactionHash);
    alert('Hash de transacción copiado');
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Success Animation */}
      <div className="flex flex-col items-center space-y-4 py-8">
        {/* Animated Success Icon */}
        <div className="relative">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          {/* Confetti effect */}
          <div className="absolute -top-2 -right-2 text-4xl animate-pulse">🎉</div>
          <div className="absolute -bottom-2 -left-2 text-4xl animate-pulse delay-75">✨</div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-green-600">
            ¡Distribución Exitosa!
          </h2>
          <p className="text-lg text-gray-600">
            Los tokens $PULPA han sido distribuidos correctamente
          </p>
        </div>
      </div>

      {/* Distribution Details */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 space-y-4 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Detalles de la Distribución
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recipient Info */}
          <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-600 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Usuario Nuevo
            </div>
            <p className="text-3xl font-bold text-purple-600">{recipientAmount} $PULPA</p>
            <p className="text-xs text-gray-500 font-mono truncate">
              {recipientAddress.slice(0, 10)}...{recipientAddress.slice(-8)}
            </p>
          </div>

          {/* Ambassador Reward */}
          <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recompensa Embajador
            </div>
            <p className="text-3xl font-bold text-blue-600">{ambassadorAmount} $PULPA</p>
            <p className="text-xs text-gray-500">
              ¡Gracias por distribuir!
            </p>
          </div>
        </div>

        {/* Transaction Hash */}
        <div className="bg-white rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Hash de Transacción</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded font-mono truncate">
              {transactionHash}
            </code>
            <button
              onClick={handleCopyHash}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors"
              title="Copiar hash"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver en Optimism Explorer
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Updated Ambassador Stats */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Estadísticas Actualizadas
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">{totalDistributions}</p>
            <p className="text-sm text-gray-600">Distribuciones Totales</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">{totalPulpaMinted}</p>
            <p className="text-sm text-gray-600">$PULPA Acuñados</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onDistributeAgain}
          className="flex-1 bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Distribuir de Nuevo
        </button>

        <button
          onClick={handleShare}
          className="flex-1 sm:flex-none bg-green-600 text-white font-semibold py-4 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Compartir
        </button>
      </div>

      {/* Celebration Message */}
      <div className="text-center text-gray-600 text-sm">
        <p>🎊 ¡Gracias por ser parte de la comunidad $PULPA! 🎊</p>
      </div>
    </div>
  );
}
