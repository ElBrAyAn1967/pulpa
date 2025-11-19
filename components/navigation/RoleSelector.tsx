'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RoleSelector() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'ambassador' | 'user' | null>(null);

  const handleRoleSelect = (role: 'ambassador' | 'user') => {
    setSelectedRole(role);

    // Navigate based on role
    if (role === 'ambassador') {
      // For ambassadors, we need to scan NFC or input NFC ID manually
      router.push('/ambassador/scan');
    } else {
      // For users who want to mint, they need to scan the NFC from an ambassador
      router.push('/mint/scan');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center space-y-4 mb-8">
        <h2 className="text-3xl font-bold text-foreground">
          ¿Cómo quieres participar?
        </h2>
        <p className="text-muted-foreground text-lg">
          Elige tu rol en el ecosistema $PULPA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ambassador Card */}
        <div
          onClick={() => handleRoleSelect('ambassador')}
          className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer hover:shadow-xl hover:scale-105 transform"
        >
          <div className="p-8 space-y-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-4xl shadow-lg">
              👨‍🚀
            </div>

            {/* Title */}
            <div>
              <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                Soy Embajador
              </h3>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Distribuyo tokens $PULPA a nuevos usuarios
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">✓</span>
                <span className="text-sm text-blue-900 dark:text-blue-200">
                  Registra tu NFC sticker personal
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">✓</span>
                <span className="text-sm text-blue-900 dark:text-blue-200">
                  Distribuye 5 $PULPA a nuevos usuarios
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">✓</span>
                <span className="text-sm text-blue-900 dark:text-blue-200">
                  Recibe 1 $PULPA por cada distribución
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">✓</span>
                <span className="text-sm text-blue-900 dark:text-blue-200">
                  Rastrea tus estadísticas como embajador
                </span>
              </li>
            </ul>

            {/* CTA */}
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-3 transition-all">
                <span>Registrarme como Embajador</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-bl-full opacity-20 transform translate-x-16 -translate-y-16"></div>
        </div>

        {/* User/Mint Card */}
        <div
          onClick={() => handleRoleSelect('user')}
          className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-2xl border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-all cursor-pointer hover:shadow-xl hover:scale-105 transform"
        >
          <div className="p-8 space-y-6">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-4xl shadow-lg">
              🍎
            </div>

            {/* Title */}
            <div>
              <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                Quiero $PULPA
              </h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Recibo tokens escaneando un NFC de embajador
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-green-900 dark:text-green-200">
                  Escanea el NFC de un embajador
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-green-900 dark:text-green-200">
                  Recibe 5 $PULPA gratis
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-green-900 dark:text-green-200">
                  Conecta tu wallet Ethereum/ENS
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span className="text-sm text-green-900 dark:text-green-200">
                  Tokens en Optimism instantáneamente
                </span>
              </li>
            </ul>

            {/* CTA */}
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold group-hover:gap-3 transition-all">
                <span>Recibir $PULPA Gratis</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 dark:bg-green-800 rounded-bl-full opacity-20 transform translate-x-16 -translate-y-16"></div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-8 p-6 bg-card rounded-xl border border-border">
        <div className="flex items-start gap-4">
          <div className="text-3xl">ℹ️</div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">¿Qué es $PULPA?</h4>
            <p className="text-sm text-muted-foreground">
              $PULPA es un token ERC20 en Optimism que se distribuye mediante NFC stickers.
              Los embajadores ayudan a incorporar nuevos usuarios al ecosistema,
              recibiendo recompensas por cada distribución exitosa.
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
              <div>
                <span className="font-semibold">Red:</span> Optimism Mainnet
              </div>
              <div>
                <span className="font-semibold">Token:</span> $PULPA (ERC20)
              </div>
              <div>
                <span className="font-semibold">Distribución:</span> 5 $PULPA por usuario
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
