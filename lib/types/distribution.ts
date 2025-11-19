/**
 * Type definitions for Distribution system
 */

export interface Distribution {
  id: string;
  ambassadorId: string;
  recipientAddress: string;
  ambassadorAmount: string;
  recipientAmount: string;
  transactionHash: string | null;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface DistributionRequest {
  nfcId: string;
  recipientAddress: string;
}

export interface DistributionResponse {
  success: boolean;
  distribution?: Distribution;
  error?: string;
  message?: string;
}

export const DISTRIBUTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
} as const;

export type DistributionStatus = typeof DISTRIBUTION_STATUS[keyof typeof DISTRIBUTION_STATUS];
