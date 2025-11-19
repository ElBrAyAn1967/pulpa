/**
 * Client-side API functions for fetching distribution history
 */

import type {
  DistributionHistoryResponse,
  DistributionHistoryParams,
  DistributionHistoryError,
} from '@/lib/types/distribution-history';

/**
 * Fetch distribution history for an ambassador
 *
 * @param ambassadorId - Ambassador ID (cuid)
 * @param params - Query parameters (page, limit)
 * @returns Distribution history response
 */
export async function fetchDistributionHistory(
  ambassadorId: string,
  params: DistributionHistoryParams = {}
): Promise<DistributionHistoryResponse> {
  const { page = 1, limit = 10 } = params;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(
    `/api/ambassadors/${ambassadorId}/history?${searchParams}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error: DistributionHistoryError = await response.json();
    throw new Error(error.error || 'Failed to fetch distribution history');
  }

  return response.json();
}

/**
 * React hook for fetching distribution history
 * (For use with SWR or React Query)
 */
export const getDistributionHistoryKey = (
  ambassadorId: string,
  params: DistributionHistoryParams = {}
) => {
  return [`/api/ambassadors/${ambassadorId}/history`, params] as const;
};
