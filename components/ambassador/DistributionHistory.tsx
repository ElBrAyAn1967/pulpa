'use client';

import { useState, useEffect } from 'react';
import { fetchDistributionHistory } from '@/lib/api/distribution-history';
import type {
  DistributionHistoryResponse,
  DistributionHistoryItem,
} from '@/lib/types/distribution-history';

interface DistributionHistoryProps {
  ambassadorId: string;
  initialPage?: number;
  itemsPerPage?: number;
}

export default function DistributionHistory({
  ambassadorId,
  initialPage = 1,
  itemsPerPage = 10,
}: DistributionHistoryProps) {
  const [data, setData] = useState<DistributionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchDistributionHistory(ambassadorId, {
          page: currentPage,
          limit: itemsPerPage,
        });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [ambassadorId, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-semibold">Error loading history</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!data || data.distributions.length === 0) {
    return (
      <div className="p-8 text-center bg-card rounded-lg border border-border">
        <div className="text-4xl mb-4">📭</div>
        <p className="text-muted-foreground">No distribution history yet</p>
      </div>
    );
  }

  const { distributions, pagination, ambassador } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">Distribution History</h3>
          <p className="text-sm text-muted-foreground">
            {ambassador.displayName} • {pagination.total} total distributions
          </p>
        </div>
      </div>

      {/* Distribution List */}
      <div className="space-y-3">
        {distributions.map((dist) => (
          <DistributionCard key={dist.id} distribution={dist} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPreviousPage}
            className="px-4 py-2 text-sm font-medium bg-card border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 text-sm font-medium bg-card border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Individual distribution card component
 */
function DistributionCard({ distribution }: { distribution: DistributionHistoryItem }) {
  const date = new Date(distribution.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      success: { label: 'Success', className: 'bg-green-100 text-green-700 border-green-200' },
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-700 border-red-200' },
    };

    const statusInfo = statusMap[status] || statusMap.pending;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Recipient info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              To: {truncateAddress(distribution.recipientAddress)}
            </span>
            {getStatusBadge(distribution.status)}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">{distribution.amounts.recipient}</span> $PULPA
              <span className="mx-1">→</span>
              Recipient
            </div>
            <div>
              <span className="font-semibold text-foreground">{distribution.amounts.ambassador}</span> $PULPA
              <span className="mx-1">→</span>
              Reward
            </div>
          </div>

          <div className="text-xs text-muted-foreground">{formattedDate}</div>
        </div>

        {/* Right side - Transaction link */}
        {distribution.transactionHash && (
          <a
            href={`https://optimistic.etherscan.io/tx/${distribution.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <span>View TX</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
