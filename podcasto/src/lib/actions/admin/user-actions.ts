'use server';

import { db } from '@/lib/db';
import { profiles, userRoles, userCredits, creditTransactions } from '@/lib/db/schema';
import { eq, sql, desc, or } from 'drizzle-orm';
import { verifyAdminAccess } from '@/lib/utils/admin-utils';
import { extractRowsFromSqlResult } from '@/lib/db/utils/sql-result-handler';

export interface UserListItem {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  availableCredits: string | null;
  subscriptionsCount: number;
  episodesReceived: number;
  lastSignInAt: string | null;
  createdAt: string;
  emailStatus: 'active' | 'bounced' | 'complained';
  hasBounces: boolean;
}

export interface UserDetailsData {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  emailNotifications: boolean;
  hasSeenWelcome: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  credits: {
    available: string;
    total: string;
    used: string;
    free: string;
  } | null;
  activity: {
    subscriptionsCount: number;
    episodesReceived: number;
    podcastsCreated: number;
    episodesGenerated: number;
  };
  emailHealth: {
    status: 'active' | 'bounced' | 'complained';
    bouncesCount: number;
    complaintsCount: number;
    lastEmailSent: string | null;
  };
}

/**
 * Get paginated list of users with search and filters
 */
export async function getUsersListAction({
  page = 1,
  pageSize = 20,
  search = '',
  roleFilter,
  emailStatusFilter,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  roleFilter?: 'admin' | 'user' | 'all';
  emailStatusFilter?: 'active' | 'bounced' | 'complained' | 'all';
}) {
  try {
    await verifyAdminAccess();

    // Build search conditions
    const searchConditions = search
      ? or(
          sql`${sql.raw(`auth.users.email`)} ILIKE ${`%${search}%`}`,
          sql`${profiles.display_name} ILIKE ${`%${search}%`}`
        )
      : undefined;

    // Build role filter
    const roleCondition = roleFilter && roleFilter !== 'all'
      ? eq(userRoles.role, roleFilter)
      : undefined;

    // Get users with aggregated data
    const offset = (page - 1) * pageSize;

    const usersQuery = await db.execute(sql`
      SELECT
        u.id,
        u.email,
        u.created_at as user_created_at,
        u.last_sign_in_at,
        p.display_name,
        p.email_notifications,
        p.has_seen_welcome,
        ur.role,
        uc.available_credits,
        uc.total_credits,
        uc.used_credits,
        uc.free_credits,
        COUNT(DISTINCT s.id)::int as subscriptions_count,
        COUNT(DISTINCT se.id)::int as episodes_received,
        COUNT(DISTINCT CASE WHEN eb.event_type = 'bounce' THEN eb.id END)::int as bounces_count,
        COUNT(DISTINCT CASE WHEN eb.event_type = 'complaint' THEN eb.id END)::int as complaints_count
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      LEFT JOIN public.user_credits uc ON u.id = uc.user_id
      LEFT JOIN public.subscriptions s ON u.id = s.user_id
      LEFT JOIN public.sent_episodes se ON u.id = se.user_id
      LEFT JOIN public.email_bounces eb ON u.id = eb.user_id
      ${searchConditions ? sql`WHERE ${searchConditions}` : sql``}
      ${roleCondition ? (searchConditions ? sql`AND ${roleCondition}` : sql`WHERE ${roleCondition}`) : sql``}
      GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at, p.display_name, p.email_notifications, p.has_seen_welcome, ur.role, uc.available_credits, uc.total_credits, uc.used_credits, uc.free_credits
      ORDER BY u.created_at DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    // Get total count
    const countQuery = await db.execute(sql`
      SELECT COUNT(DISTINCT u.id)::int as total
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      ${searchConditions ? sql`WHERE ${searchConditions}` : sql``}
      ${roleCondition ? (searchConditions ? sql`AND ${roleCondition}` : sql`WHERE ${roleCondition}`) : sql``}
    `);

    // Extract user rows using utility function
    const userRows = extractRowsFromSqlResult<any>(usersQuery, 'UserList');
    const users = userRows.map((row) => {
      const hasBounces = row.bounces_count > 0;
      const hasComplaints = row.complaints_count > 0;

      let emailStatus: 'active' | 'bounced' | 'complained' = 'active';
      if (hasComplaints) emailStatus = 'complained';
      else if (hasBounces) emailStatus = 'bounced';

      return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        role: row.role || 'user',
        availableCredits: row.available_credits,
        subscriptionsCount: row.subscriptions_count,
        episodesReceived: row.episodes_received,
        lastSignInAt: row.last_sign_in_at,
        createdAt: row.user_created_at,
        emailStatus,
        hasBounces: hasBounces || hasComplaints,
      } as UserListItem;
    });

    // Apply email status filter
    const filteredUsers = emailStatusFilter && emailStatusFilter !== 'all'
      ? users.filter(u => u.emailStatus === emailStatusFilter)
      : users;

    const countRows = extractRowsFromSqlResult<any>(countQuery, 'UserCount');
    const total = countRows[0]?.total || 0;

    return {
      success: true,
      data: {
        users: filteredUsers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error('Error fetching users list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users list',
    };
  }
}

/**
 * Get detailed information about a specific user
 */
export async function getUserDetailsAction(userId: string) {
  try {
    await verifyAdminAccess();

    // Get user basic info
    const userQuery = await db.execute(sql`
      SELECT
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        p.display_name,
        p.email_notifications,
        p.has_seen_welcome,
        ur.role
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      LEFT JOIN public.user_roles ur ON u.id = ur.user_id
      WHERE u.id = ${userId}
      LIMIT 1
    `);

    const userRows = extractRowsFromSqlResult<any>(userQuery, 'UserDetails');
    if (userRows.length === 0) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const user = userRows[0] as any;

    // Get credits info
    const creditsResult = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.user_id, userId))
      .limit(1);

    const credits = creditsResult[0] ? {
      available: creditsResult[0].available_credits,
      total: creditsResult[0].total_credits,
      used: creditsResult[0].used_credits,
      free: creditsResult[0].free_credits,
    } : null;

    // Get activity counts
    const activityQuery = await db.execute(sql`
      SELECT
        COUNT(DISTINCT s.id)::int as subscriptions_count,
        COUNT(DISTINCT se.id)::int as episodes_received,
        COUNT(DISTINCT pod.id)::int as podcasts_created,
        COUNT(DISTINCT e.id)::int as episodes_generated
      FROM auth.users u
      LEFT JOIN public.subscriptions s ON u.id = s.user_id
      LEFT JOIN public.sent_episodes se ON u.id = se.user_id
      LEFT JOIN public.podcasts pod ON u.id = pod.created_by
      LEFT JOIN public.episodes e ON u.id = e.created_by
      WHERE u.id = ${userId}
    `);

    const activityRows = extractRowsFromSqlResult<any>(activityQuery, 'UserActivity');
    const activity = activityRows[0];

    // Get email health
    const emailHealthQuery = await db.execute(sql`
      SELECT
        COUNT(DISTINCT CASE WHEN eb.event_type = 'bounce' THEN eb.id END)::int as bounces_count,
        COUNT(DISTINCT CASE WHEN eb.event_type = 'complaint' THEN eb.id END)::int as complaints_count,
        MAX(se.sent_at) as last_email_sent
      FROM auth.users u
      LEFT JOIN public.email_bounces eb ON u.id = eb.user_id
      LEFT JOIN public.sent_episodes se ON u.id = se.user_id
      WHERE u.id = ${userId}
    `);

    const emailHealthRows = extractRowsFromSqlResult<any>(emailHealthQuery, 'EmailHealth');
    const emailHealth = emailHealthRows[0];
    const hasBounces = emailHealth.bounces_count > 0;
    const hasComplaints = emailHealth.complaints_count > 0;

    let emailStatus: 'active' | 'bounced' | 'complained' = 'active';
    if (hasComplaints) emailStatus = 'complained';
    else if (hasBounces) emailStatus = 'bounced';

    const userDetails: UserDetailsData = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role || 'user',
      emailNotifications: user.email_notifications ?? true,
      hasSeenWelcome: user.has_seen_welcome ?? false,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      credits,
      activity: {
        subscriptionsCount: activity.subscriptions_count || 0,
        episodesReceived: activity.episodes_received || 0,
        podcastsCreated: activity.podcasts_created || 0,
        episodesGenerated: activity.episodes_generated || 0,
      },
      emailHealth: {
        status: emailStatus,
        bouncesCount: emailHealth.bounces_count || 0,
        complaintsCount: emailHealth.complaints_count || 0,
        lastEmailSent: emailHealth.last_email_sent,
      },
    };

    return {
      success: true,
      data: userDetails,
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user details',
    };
  }
}

/**
 * Update user role
 */
export async function updateUserRoleAction(userId: string, newRole: 'admin' | 'user') {
  try {
    await verifyAdminAccess();

    // Check if user has a role record
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.user_id, userId))
      .limit(1);

    if (existingRole.length > 0) {
      // Update existing role
      await db
        .update(userRoles)
        .set({ role: newRole })
        .where(eq(userRoles.user_id, userId));
    } else {
      // Insert new role
      await db.insert(userRoles).values({
        user_id: userId,
        role: newRole,
      });
    }

    return {
      success: true,
      message: `User role updated to ${newRole}`,
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role',
    };
  }
}

/**
 * Get user's recent activity
 */
export async function getUserActivityAction(userId: string, limit = 20) {
  try {
    await verifyAdminAccess();

    const activities = [];

    // Get credit transactions
    const transactions = await db
      .select({
        id: creditTransactions.id,
        type: creditTransactions.transaction_type,
        amount: creditTransactions.amount,
        description: creditTransactions.description,
        createdAt: creditTransactions.created_at,
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.user_id, userId))
      .orderBy(desc(creditTransactions.created_at))
      .limit(limit);

    for (const tx of transactions) {
      activities.push({
        id: tx.id,
        type: 'credit_transaction',
        title: tx.description || `Credit ${tx.type}`,
        description: `Amount: ${tx.amount}`,
        timestamp: tx.createdAt,
      });
    }

    // Get sent episodes
    const episodes = await db.execute(sql`
      SELECT
        se.id,
        se.sent_at,
        e.title as episode_title,
        p.title as podcast_title
      FROM public.sent_episodes se
      LEFT JOIN public.episodes e ON se.episode_id = e.id
      LEFT JOIN public.podcasts p ON e.podcast_id = p.id
      WHERE se.user_id = ${userId}
      ORDER BY se.sent_at DESC
      LIMIT ${limit}
    `);

    const episodeRows = extractRowsFromSqlResult<any>(episodes, 'UserEpisodes');
    for (const ep of episodeRows) {
      activities.push({
        id: ep.id,
        type: 'episode_received',
        title: 'Received episode',
        description: `${ep.episode_title} from ${ep.podcast_title}`,
        timestamp: ep.sent_at,
      });
    }

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      data: activities.slice(0, limit),
    };
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user activity',
    };
  }
}

/**
 * Get user's subscriptions
 */
export async function getUserSubscriptionsAction(userId: string) {
  try {
    await verifyAdminAccess();

    const subscriptionsData = await db.execute(sql`
      SELECT
        s.id,
        s.created_at,
        s.language_preference,
        s.email_notifications,
        p.id as podcast_id,
        p.title as podcast_title,
        p.description as podcast_description,
        p.cover_image
      FROM public.subscriptions s
      LEFT JOIN public.podcasts p ON s.podcast_id = p.id
      WHERE s.user_id = ${userId}
      ORDER BY s.created_at DESC
    `);

    const subscriptionRows = extractRowsFromSqlResult<any>(subscriptionsData, 'UserSubscriptions');
    return {
      success: true,
      data: subscriptionRows,
    };
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user subscriptions',
    };
  }
}
