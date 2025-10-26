'use server';

import { SendEmailCommand } from '@aws-sdk/client-ses';
import { SES_CONFIG, sesClient } from '@/lib/aws/ses-client';
import { generateAdminWeeklySummaryEmail } from '@/lib/email/templates/admin-weekly-summary';
import { db } from '@/lib/db';
import { profiles, userRoles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/lib/utils/error-utils';
import { createLogger } from '@/lib/utils/logger';
import { getBaseUrl } from '@/lib/constants/deployment';
import {
  getWeeklySummaryReport,
  getProblematicPodcastsReport,
} from './generation-reports';
import { verifyAdminAccess } from '@/lib/utils/admin-utils';

const logger = createLogger('SEND_ADMIN_WEEKLY_SUMMARY');

interface SendResult {
  email: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends weekly generation summary email to all admin users.
 * Fetches report data, gets all admin emails, and sends via AWS SES.
 *
 * Admin-only action
 *
 * @returns Object with success status, send results per admin, and optional error
 *
 * @example
 * ```typescript
 * const result = await sendAdminWeeklySummary();
 * if (result.success) {
 *   console.log(`Sent to ${result.data.sentCount} admins`);
 * }
 * ```
 */
export async function sendAdminWeeklySummary(): Promise<{
  success: boolean;
  data?: {
    sentCount: number;
    skippedCount: number;
    failedCount: number;
    results: SendResult[];
  };
  error?: string;
}> {
  try {
    // Check admin authorization
    await verifyAdminAccess();

    logger.info('Starting weekly admin summary email send');

    // Fetch weekly report data
    const weeklyReport = await getWeeklySummaryReport();
    if (!weeklyReport.success || !weeklyReport.data) {
      const error = 'Failed to fetch weekly report data';
      logger.error(error, undefined, { reportError: weeklyReport.error });
      return { success: false, error };
    }

    // Fetch problematic podcasts
    const problematicPodcasts = await getProblematicPodcastsReport(7, 3, 0.5);
    if (!problematicPodcasts.success) {
      const error = 'Failed to fetch problematic podcasts';
      logger.error(error, undefined, {
        podcastsError: problematicPodcasts.error,
      });
      return { success: false, error };
    }

    // Get all admin users with their emails
    const admins = await db
      .select({
        userId: userRoles.user_id,
        email: sql<string | null>`auth.users.email`,
        emailNotifications: profiles.email_notifications,
      })
      .from(userRoles)
      .leftJoin(profiles, eq(userRoles.user_id, profiles.id))
      .leftJoin(sql`auth.users`, sql`${userRoles.user_id} = auth.users.id`)
      .where(eq(userRoles.role, 'admin'));

    if (admins.length === 0) {
      const error = 'No admin users found in database';
      logger.error(error);
      return { success: false, error };
    }

    logger.info(`Found ${admins.length} admin users`);

    // Calculate date range for the report (last 7 days)
    const today = new Date();
    const weekStartDate = new Date(today);
    weekStartDate.setDate(weekStartDate.getDate() - 6);

    // Prepare email data
    const normalizedSiteUrl = getBaseUrl().replace(/\/$/, '');
    const reportsUrl = `${normalizedSiteUrl}/admin/reports`;

    const emailData = {
      weekStartDate,
      weekEndDate: today,
      totalAttempts: weeklyReport.data.weeklyTotals.total,
      successfulAttempts: weeklyReport.data.weeklyTotals.successful,
      failedAttempts: weeklyReport.data.weeklyTotals.failed,
      successRate: weeklyReport.data.weeklyTotals.successRate,
      dailyBreakdown: weeklyReport.data.dailyReports.map((day) => ({
        date: new Date(day.date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        total: day.total,
        successful: day.successful,
        failed: day.failed,
        successRate:
          day.total > 0
            ? Math.round((day.successful / day.total) * 10000) / 100
            : 0,
      })),
      problematicPodcasts: (problematicPodcasts.data || []).map((podcast) => ({
        podcast_title: podcast.podcast_title,
        total_attempts: podcast.total_attempts,
        failed_attempts: podcast.failed_attempts,
        failure_rate: podcast.failure_rate,
      })),
      reportsUrl,
    };

    const { html, text } = generateAdminWeeklySummaryEmail(emailData);
    const subject = `Weekly Generation Report: ${emailData.successRate.toFixed(1)}% Success Rate`;

    // Send emails to all admins
    const results: SendResult[] = [];
    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const admin of admins) {
      // Skip if no email
      if (!admin.email) {
        logger.warn('Admin user has no email address', {
          userId: admin.userId,
        });
        results.push({
          email: 'unknown',
          success: false,
          error: 'No email address',
        });
        skippedCount++;
        continue;
      }

      // Skip if email notifications disabled
      if (admin.emailNotifications === false) {
        logger.info('Email notifications disabled for admin, skipping', {
          email: admin.email,
        });
        results.push({
          email: admin.email,
          success: false,
          error: 'Notifications disabled',
        });
        skippedCount++;
        continue;
      }

      // Send email
      try {
        const command = new SendEmailCommand({
          Source: `${SES_CONFIG.FROM_NAME} <${SES_CONFIG.FROM_EMAIL}>`,
          Destination: { ToAddresses: [admin.email] },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: html, Charset: 'UTF-8' },
              Text: { Data: text, Charset: 'UTF-8' },
            },
          },
        });

        const response = await sesClient.send(command);

        logger.info('Weekly summary email sent to admin', {
          email: admin.email,
          messageId: response.MessageId,
        });

        results.push({
          email: admin.email,
          success: true,
          messageId: response.MessageId,
        });
        sentCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to send email to admin ${admin.email}`, error, {
          email: admin.email,
        });

        results.push({
          email: admin.email,
          success: false,
          error: errorMessage,
        });
        failedCount++;
      }
    }

    logger.info('Weekly admin summary send completed', {
      total: admins.length,
      sent: sentCount,
      skipped: skippedCount,
      failed: failedCount,
    });

    return createSuccessResponse({
      sentCount,
      skippedCount,
      failedCount,
      results,
    });
  } catch (error) {
    return createErrorResponse(
      error,
      'Failed to send admin weekly summary',
      'SEND_ADMIN_WEEKLY_SUMMARY'
    );
  }
}
