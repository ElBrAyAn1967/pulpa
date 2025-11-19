/**
 * Type definitions for Distribution History API
 */

export type Address = `0x${string}`;

/**
 * Distribution record from history
 */
export interface DistributionHistoryItem {
  id: string;
  recipientAddress: Address;
  amounts: {
    ambassador: string;
    recipient: string;
  };
  transactionHash: string | null;
  status: string;
  createdAt: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Ambassador info included in response
 */
export interface AmbassadorInfo {
  id: string;
  walletAddress: string;
  displayName: string;
}

/**
 * Complete distribution history response
 */
export interface DistributionHistoryResponse {
  distributions: DistributionHistoryItem[];
  pagination: PaginationMetadata;
  ambassador: AmbassadorInfo;
}

/**
 * Query parameters for distribution history endpoint
 */
export interface DistributionHistoryParams {
  page?: number;
  limit?: number;
}

/**
 * Error response from distribution history API
 */
export interface DistributionHistoryError {
  error: string;
  details?: string;
}
