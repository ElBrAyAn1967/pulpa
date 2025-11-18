import { z } from 'zod';
import { isAddress } from 'viem';
import { FRUIT_OPTIONS } from '@/lib/types/ambassador';

/**
 * Validation schema for ambassador registration
 */
export const ambassadorRegistrationSchema = z.object({
  nfcId: z
    .string()
    .min(6, 'NFC ID debe tener al menos 6 caracteres')
    .max(50, 'NFC ID no puede exceder 50 caracteres')
    .regex(
      /^[A-Za-z0-9-]+$/,
      'NFC ID solo puede contener letras, números y guiones'
    ),

  walletAddress: z
    .string()
    .refine((address) => isAddress(address), {
      message: 'Dirección de wallet inválida',
    })
    .transform((address) => address.toLowerCase() as `0x${string}`),

  ensName: z
    .string()
    .regex(/^[a-z0-9-]+\.eth$/, 'ENS debe terminar en .eth')
    .optional()
    .or(z.literal('')),

  displayName: z
    .string()
    .min(2, 'Nombre debe tener al menos 2 caracteres')
    .max(50, 'Nombre no puede exceder 50 caracteres')
    .regex(
      /^[a-zA-Z0-9\s\u00C0-\u017F]+$/,
      'Nombre solo puede contener letras, números y espacios'
    ),

  favoriteFruit: z
    .string()
    .refine((fruit) => FRUIT_OPTIONS.includes(fruit as any), {
      message: 'Fruta favorita inválida',
    }),
});

/**
 * TypeScript type inferred from validation schema
 */
export type AmbassadorRegistrationInput = z.infer<typeof ambassadorRegistrationSchema>;

/**
 * Response schema for successful registration
 */
export const ambassadorResponseSchema = z.object({
  success: z.boolean(),
  ambassador: z.object({
    id: z.string(),
    nfcId: z.string(),
    walletAddress: z.string(),
    ensName: z.string().nullable(),
    displayName: z.string(),
    favoriteFruit: z.string(),
    totalDistributions: z.number(),
    totalPulpaMinted: z.string(),
    createdAt: z.date(),
  }),
});

export type AmbassadorResponse = z.infer<typeof ambassadorResponseSchema>;
