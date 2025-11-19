import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/admin/stats
 *
 * Retrieves system-wide statistics for the admin dashboard
 *
 * Response:
 * - totalAmbassadors: Total registered ambassadors
 * - totalDistributions: Total completed distributions
 * - totalPulpaDistributed: Total $PULPA tokens distributed
 * - topAmbassadors: Leaderboard of top ambassadors
 * - recentActivity: Recent distribution activity
 */
export async function GET(request: NextRequest) {
  try {
    // Get total ambassadors
    const totalAmbassadors = await prisma.ambassador.count();

    // Get total distributions (only successful ones)
    const totalDistributions = await prisma.distribution.count({
      where: { status: 'success' },
    });

    // Calculate total PULPA distributed
    // Each successful distribution = 5 PULPA to recipient + 1 PULPA to ambassador = 6 PULPA total
    const totalPulpaDistributed = (totalDistributions * 6).toString();

    // Get top ambassadors by total distributions
    const topAmbassadors = await prisma.ambassador.findMany({
      select: {
        id: true,
        walletAddress: true,
        displayName: true,
        favoriteFruit: true,
        totalDistributions: true,
        totalPulpaMinted: true,
        createdAt: true,
      },
      orderBy: {
        totalDistributions: 'desc',
      },
      take: 10, // Top 10 ambassadors
    });

    // Get recent activity (last 20 distributions)
    const recentDistributions = await prisma.distribution.findMany({
      select: {
        id: true,
        recipientAddress: true,
        ambassadorAmount: true,
        recipientAmount: true,
        status: true,
        createdAt: true,
        ambassador: {
          select: {
            displayName: true,
            walletAddress: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    // Get distributions grouped by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const distributionsByDate = await prisma.distribution.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    // Group by day
    const distributionTimeline: Record<string, number> = {};
    distributionsByDate.forEach((item) => {
      const date = item.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      distributionTimeline[date] = (distributionTimeline[date] || 0) + item._count.id;
    });

    // Get ambassador growth (ambassadors registered per day, last 30 days)
    const ambassadorsByDate = await prisma.ambassador.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
    });

    const ambassadorGrowth: Record<string, number> = {};
    ambassadorsByDate.forEach((item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      ambassadorGrowth[date] = (ambassadorGrowth[date] || 0) + item._count.id;
    });

    return Response.json({
      overview: {
        totalAmbassadors,
        totalDistributions,
        totalPulpaDistributed,
        avgDistributionsPerAmbassador:
          totalAmbassadors > 0
            ? (totalDistributions / totalAmbassadors).toFixed(2)
            : '0',
      },
      topAmbassadors: topAmbassadors.map((amb) => ({
        id: amb.id,
        walletAddress: amb.walletAddress,
        displayName: amb.displayName,
        favoriteFruit: amb.favoriteFruit,
        totalDistributions: amb.totalDistributions,
        totalPulpaMinted: amb.totalPulpaMinted,
        joinedAt: amb.createdAt.toISOString(),
      })),
      recentActivity: recentDistributions.map((dist) => ({
        id: dist.id,
        ambassadorName: dist.ambassador.displayName,
        recipientAddress: dist.recipientAddress,
        amounts: {
          ambassador: dist.ambassadorAmount,
          recipient: dist.recipientAmount,
        },
        status: dist.status,
        timestamp: dist.createdAt.toISOString(),
      })),
      charts: {
        distributionTimeline: Object.entries(distributionTimeline).map(
          ([date, count]) => ({
            date,
            count,
          })
        ),
        ambassadorGrowth: Object.entries(ambassadorGrowth).map(
          ([date, count]) => ({
            date,
            count,
          })
        ),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);

    return Response.json(
      {
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
