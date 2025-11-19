import { z } from 'zod';
import { isAddress } from 'viem';

/**
 * Validation schema for distribution requests
 */
export const distributionRequestSchema = z.object({
  nfcId: z
    .string()
    .min(1, 'NFC ID es requerido')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'NFC ID solo puede contener letras, números y guiones'
    ),

  recipientAddress: z
    .string()
    .refine((address) => isAddress(address), {
      message: 'Dirección de wallet inválida',
    })
    .transform((address) => address.toLowerCase() as `0x${string}`),
});

/**
 * Type inference from schema
 */
export type DistributionRequestInput = z.infer<typeof distributionRequestSchema>;
