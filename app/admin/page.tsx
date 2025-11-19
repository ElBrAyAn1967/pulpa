'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdminStats {
  overview: {
    totalAmbassadors: number;
    totalDistributions: number;
    totalPulpaDistributed: string;
    avgDistributionsPerAmbassador: string;
  };
  topAmbassadors: Array<{
    id: string;
    walletAddress: string;
    displayName: string;
    favoriteFruit: string;
    totalDistributions: number;
    totalPulpaMinted: string;
    joinedAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    ambassadorName: string;
    recipientAddress: string;
    amounts: {
      ambassador: string;
      recipient: string;
    };
    status: string;
    timestamp: string;
  }>;
  charts: {
    distributionTimeline: Array<{ date: string; count: number }>;
    ambassadorGrowth: Array<{ date: string; count: number }>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="page">
        <div className="container flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page">
        <div className="container max-w-2xl py-12">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-semibold">Error loading dashboard</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                fetchStats();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="page">
      <div className="container space-y-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">$PULPA Distribution System Analytics</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                autoRefresh
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'bg-card border-border text-muted-foreground'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </span>
            </button>

            {/* Manual refresh */}
            <button
              onClick={fetchStats}
              className="p-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
              title="Refresh now"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Back to home */}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Home
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Ambassadors"
            value={stats.overview.totalAmbassadors}
            icon="👨‍🚀"
            color="blue"
          />
          <StatCard
            title="Total Distributions"
            value={stats.overview.totalDistributions}
            icon="🎉"
            color="green"
          />
          <StatCard
            title="$PULPA Distributed"
            value={`${stats.overview.totalPulpaDistributed} $PULPA`}
            icon="🍎"
            color="purple"
          />
          <StatCard
            title="Avg per Ambassador"
            value={stats.overview.avgDistributionsPerAmbassador}
            icon="📊"
            color="orange"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Timeline */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              📈 Distributions (Last 30 Days)
            </h3>
            <SimpleBarChart data={stats.charts.distributionTimeline} />
          </div>

          {/* Ambassador Growth */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              👥 New Ambassadors (Last 30 Days)
            </h3>
            <SimpleBarChart data={stats.charts.ambassadorGrowth} />
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">🏆 Top Ambassadors</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th className="text-left py-3 px-2">Rank</th>
                  <th className="text-left py-3 px-2">Ambassador</th>
                  <th className="text-left py-3 px-2">Wallet</th>
                  <th className="text-right py-3 px-2">Distributions</th>
                  <th className="text-right py-3 px-2">$PULPA Minted</th>
                  <th className="text-left py-3 px-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {stats.topAmbassadors.map((amb, idx) => (
                  <tr key={amb.id} className="border-b border-border hover:bg-accent transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {idx < 3 && (
                          <span className="text-xl">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className="font-mono text-sm text-muted-foreground">#{idx + 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{amb.favoriteFruit}</span>
                        <span className="font-medium text-foreground">{amb.displayName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <code className="text-xs text-muted-foreground">
                        {truncateAddress(amb.walletAddress)}
                      </code>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="font-semibold text-foreground">{amb.totalDistributions}</span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm text-muted-foreground">{amb.totalPulpaMinted}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(amb.joinedAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">🕒 Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">{activity.ambassadorName}</span>
                    <span className="text-muted-foreground">→</span>
                    <code className="text-xs text-muted-foreground">
                      {truncateAddress(activity.recipientAddress)}
                    </code>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{activity.amounts.recipient} $PULPA distributed</span>
                    <span>•</span>
                    <span>{new Date(activity.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <StatusBadge status={activity.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow">
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-2xl mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

/**
 * Simple Bar Chart Component
 */
function SimpleBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data available</p>;
  }

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="space-y-2">
      {data.slice(-7).map((item) => (
        <div key={item.date} className="flex items-center gap-3">
          <div className="w-20 text-xs text-muted-foreground">
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="flex-1 bg-accent rounded-full h-6 relative">
            <div
              className="bg-primary rounded-full h-full transition-all duration-300"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
              {item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
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
}
