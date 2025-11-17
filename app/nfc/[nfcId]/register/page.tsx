'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import AmbassadorRegistrationForm from '@/components/nfc/AmbassadorRegistrationForm';
import type { AmbassadorRegistrationData, AmbassadorRegistrationResponse } from '@/lib/types/ambassador';

export default function AmbassadorRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const nfcId = params.nfcId as string;
  const [success, setSuccess] = useState(false);

  const handleRegistration = async (data: AmbassadorRegistrationData) => {
    try {
      const response = await fetch('/api/ambassadors/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar');
      }

      const result: AmbassadorRegistrationResponse = await response.json();

      if (result.success) {
        setSuccess(true);
        // Redirect to distribution page after successful registration
        setTimeout(() => {
          router.push(`/nfc/${nfcId}/distribute`);
        }, 2000);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Re-throw to be caught by form
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (success) {
    return (
      <div className="page flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              ¡Registro Exitoso!
            </h2>
            <p className="text-muted-foreground">
              Ya eres embajador $PULPA
            </p>
          </div>

          {/* Redirecting */}
          <div className="p-4 bg-accent/10 rounded-lg">
            <p className="text-sm text-accent">
              Redirigiendo a la página de distribución...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page min-h-screen py-8">
      <AmbassadorRegistrationForm
        nfcId={nfcId}
        onSubmit={handleRegistration}
        onCancel={handleCancel}
      />
    </div>
  );
}
