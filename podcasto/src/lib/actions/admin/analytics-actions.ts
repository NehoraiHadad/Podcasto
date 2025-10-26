'use server';

import { db } from '@/lib/db';
import { profiles, episodes, podcasts, sentEpisodes, emailBounces, creditTransactions } from '@/lib/db/schema';
import { sql, desc, gte, and } from 'drizzle-orm';
import { verifyAdminAccess } from '@/lib/utils/admin-utils';
import { extractRowsFromSqlResult } from '@/lib/db/utils/sql-result-handler';

// SQL Query Result Types
interface UserMetricsQueryResult {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  users_with_subscriptions: number;
}

interface EngagementQueryResult {
  avg_subscriptions: string;
  avg_episodes: string;
  total_episodes_sent: number;
}

interface EmailHealthQueryResult {
  total_emails_sent: number;
  bounces_count: number;
  complaints_count: number;
}

interface CreditMetricsQueryResult {
  total_credits_sold: string;
  total_credits_used: string;
  total_credits_available: string;
  avg_credits_per_user: string;
}

interface ContentMetricsQueryResult {
  total_podcasts: number;
  active_podcasts: number;
  total_episodes: number;
  published_episodes: number;
}

interface GrowthDataQueryResult {
  date: string;
  count: number;
}

interface TopPodcastQueryResult {
  id: string;
  title: string;
  subscribers_count: number;
}

export interface AnalyticsStats {
  userMetrics: {
    totalUsers: number;
    activeUsers: number; // logged in last 7 days
    newUsersThisMonth: number;
    usersWithSubscriptions: number;
  };
  engagementMetrics: {
    averageSubscriptionsPerUser: number;
    averageEpisodesPerUser: number;
    totalEpisodesSent: number;
  };
  emailHealthMetrics: {
    totalEmailsSent: number;
    bouncesCount: number;
    complaintsCount: number;
    bounceRate: number;
    complaintRate: number;
  };
  creditMetrics: {
    totalCreditsSold: number;
    totalCreditsUsed: number;
    totalCreditsAvailable: number;
    averageCreditsPerUser: number;
    creditUsageRate: number;
  };
  contentMetrics: {
    totalPodcasts: number;
    activePodcasts: number;
    totalEpisodes: number;
    publishedEpisodes: number;
  };
}

export interface UserGrowthData {
  date: string;
  count: number;
}

export interface TopPodcast {
  id: string;
  title: string;
  subscribersCount: number;
}

/**
 * Get comprehensive analytics dashboard stats
 */
export async function getAnalyticsDashboardStatsAction(): Promise<{
  success: boolean;
  data?: AnalyticsStats;
  error?: string;
}> {
  try {
    await verifyAdminAccess();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // User metrics
    const userMetricsQuery = await db.execute(sql`
      SELECT
        COUNT(DISTINCT u.id)::int as total_users,
        COUNT(DISTINCT CASE WHEN u.last_sign_in_at >= ${sevenDaysAgo.toISOString()} THEN u.id END)::int as active_users,
        COUNT(DISTINCT CASE WHEN u.created_at >= ${firstDayOfMonth.toISOString()} THEN u.id END)::int as new_users_this_month,
        COUNT(DISTINCT s.user_id)::int as users_with_subscriptions
      FROM auth.users u
      LEFT JOIN public.subscriptions s ON u.id = s.user_id
    `);

    const userMetricsRows = extractRowsFromSqlResult<UserMetricsQueryResult>(userMetricsQuery, 'UserMetrics');
    const userMetrics = userMetricsRows[0];

    // Engagement metrics
    const engagementQuery = await db.execute(sql`
      SELECT
        COALESCE(AVG(sub_count)::numeric, 0) as avg_subscriptions,
        COALESCE(AVG(ep_count)::numeric, 0) as avg_episodes,
        COUNT(se.id)::int as total_episodes_sent
      FROM (
        SELECT
          u.id,
          COUNT(DISTINCT s.id) as sub_count,
          COUNT(DISTINCT se.id) as ep_count
        FROM auth.users u
        LEFT JOIN public.subscriptions s ON u.id = s.user_id
        LEFT JOIN public.sent_episodes se ON u.id = se.user_id
        GROUP BY u.id
      ) user_stats
      CROSS JOIN public.sent_episodes se
    `);

    const engagementRows = extractRowsFromSqlResult<EngagementQueryResult>(engagementQuery, 'Engagement');
    const engagement = engagementRows[0];

    // Email health metrics
    const emailHealthQuery = await db.execute(sql`
      SELECT
        COUNT(DISTINCT se.id)::int as total_emails_sent,
        COUNT(DISTINCT CASE WHEN eb.event_type = 'bounce' THEN eb.id END)::int as bounces_count,
        COUNT(DISTINCT CASE WHEN eb.event_type = 'complaint' THEN eb.id END)::int as complaints_count
      FROM public.sent_episodes se
      LEFT JOIN public.email_bounces eb ON se.user_id = eb.user_id
    `);

    const emailHealthRows = extractRowsFromSqlResult<EmailHealthQueryResult>(emailHealthQuery, 'EmailHealth');
    const emailHealth = emailHealthRows[0];
    const totalEmails = emailHealth.total_emails_sent || 1; // Avoid division by zero
    const bounceRate = ((emailHealth.bounces_count || 0) / totalEmails) * 100;
    const complaintRate = ((emailHealth.complaints_count || 0) / totalEmails) * 100;

    // Credit metrics
    const creditMetricsQuery = await db.execute(sql`
      SELECT
        COALESCE(SUM(total_credits)::numeric, 0) as total_credits_sold,
        COALESCE(SUM(used_credits)::numeric, 0) as total_credits_used,
        COALESCE(SUM(available_credits)::numeric, 0) as total_credits_available,
        COALESCE(AVG(available_credits)::numeric, 0) as avg_credits_per_user
      FROM public.user_credits
    `);

    const creditMetricsRows = extractRowsFromSqlResult<CreditMetricsQueryResult>(creditMetricsQuery, 'CreditMetrics');
    const creditMetrics = creditMetricsRows[0];
    const totalCreditsSold = parseFloat(creditMetrics.total_credits_sold || '0');
    const totalCreditsUsed = parseFloat(creditMetrics.total_credits_used || '0');
    const creditUsageRate = totalCreditsSold > 0 ? (totalCreditsUsed / totalCreditsSold) * 100 : 0;

    // Content metrics
    const contentMetricsQuery = await db.execute(sql`
      SELECT
        COUNT(DISTINCT p.id)::int as total_podcasts,
        COUNT(DISTINCT CASE WHEN p.is_paused = false THEN p.id END)::int as active_podcasts,
        COUNT(DISTINCT e.id)::int as total_episodes,
        COUNT(DISTINCT CASE WHEN e.status = 'published' THEN e.id END)::int as published_episodes
      FROM public.podcasts p
      CROSS JOIN public.episodes e
    `);

    const contentMetricsRows = extractRowsFromSqlResult<ContentMetricsQueryResult>(contentMetricsQuery, 'ContentMetrics');
    const contentMetrics = contentMetricsRows[0];

    const stats: AnalyticsStats = {
      userMetrics: {
        totalUsers: userMetrics.total_users || 0,
        activeUsers: userMetrics.active_users || 0,
        newUsersThisMonth: userMetrics.new_users_this_month || 0,
        usersWithSubscriptions: userMetrics.users_with_subscriptions || 0,
      },
      engagementMetrics: {
        averageSubscriptionsPerUser: parseFloat(engagement.avg_subscriptions || '0'),
        averageEpisodesPerUser: parseFloat(engagement.avg_episodes || '0'),
        totalEpisodesSent: engagement.total_episodes_sent || 0,
      },
      emailHealthMetrics: {
        totalEmailsSent: emailHealth.total_emails_sent || 0,
        bouncesCount: emailHealth.bounces_count || 0,
        complaintsCount: emailHealth.complaints_count || 0,
        bounceRate: Math.round(bounceRate * 100) / 100,
        complaintRate: Math.round(complaintRate * 100) / 100,
      },
      creditMetrics: {
        totalCreditsSold,
        totalCreditsUsed,
        totalCreditsAvailable: parseFloat(creditMetrics.total_credits_available || '0'),
        averageCreditsPerUser: Math.round(parseFloat(creditMetrics.avg_credits_per_user || '0') * 100) / 100,
        creditUsageRate: Math.round(creditUsageRate * 100) / 100,
      },
      contentMetrics: {
        totalPodcasts: contentMetrics.total_podcasts || 0,
        activePodcasts: contentMetrics.active_podcasts || 0,
        totalEpisodes: contentMetrics.total_episodes || 0,
        publishedEpisodes: contentMetrics.published_episodes || 0,
      },
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics',
    };
  }
}

/**
 * Get user growth data over time (last 90 days)
 */
export async function getUserGrowthDataAction(): Promise<{
  success: boolean;
  data?: UserGrowthData[];
  error?: string;
}> {
  try {
    await verifyAdminAccess();

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const growthQuery = await db.execute(sql`
      SELECT
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM auth.users
      WHERE created_at >= ${ninetyDaysAgo.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const growthRows = extractRowsFromSqlResult<GrowthDataQueryResult>(growthQuery, 'GrowthData');
    const growthData = growthRows.map(row => ({
      date: row.date,
      count: row.count,
    }));

    // Fill in missing dates with 0
    const filledData: UserGrowthData[] = [];
    const currentDate = new Date(ninetyDaysAgo);
    const today = new Date();

    let cumulativeCount = 0;

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dataPoint = growthData.find((d: UserGrowthData) => d.date === dateStr);

      if (dataPoint) {
        cumulativeCount += dataPoint.count;
      }

      filledData.push({
        date: dateStr,
        count: cumulativeCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      success: true,
      data: filledData,
    };
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch growth data',
    };
  }
}

/**
 * Get top podcasts by subscriber count
 */
export async function getTopPodcastsAction(limit = 10): Promise<{
  success: boolean;
  data?: Array<{ id: string; title: string; subscribersCount: number }>;
  error?: string;
}> {
  try {
    await verifyAdminAccess();

    const topPodcastsQuery = await db.execute(sql`
      SELECT
        p.id,
        p.title,
        COUNT(s.id)::int as subscribers_count
      FROM public.podcasts p
      LEFT JOIN public.subscriptions s ON p.id = s.podcast_id
      GROUP BY p.id, p.title
      ORDER BY subscribers_count DESC
      LIMIT ${limit}
    `);

    const topPodcastsRows = extractRowsFromSqlResult<TopPodcastQueryResult>(topPodcastsQuery, 'TopPodcasts');
    const topPodcasts = topPodcastsRows.map(row => ({
      id: row.id,
      title: row.title,
      subscribersCount: row.subscribers_count || 0,
    }));

    return {
      success: true,
      data: topPodcasts,
    };
  } catch (error) {
    console.error('Error fetching top podcasts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch top podcasts',
    };
  }
}
