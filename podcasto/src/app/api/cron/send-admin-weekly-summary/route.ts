import { NextRequest } from 'next/server';
import { apiSuccess, apiError, validateCronAuth, logError } from '@/lib/api';
import { sendAdminWeeklySummary } from '@/lib/actions/admin/send-weekly-summary';

/**
 * CRON endpoint for sending weekly generation summary emails to admin users.
 *
 * This endpoint should be called weekly (e.g., every Monday at 9 AM) by an external CRON service.
 * It fetches the past week's generation statistics and sends a summary email to all admins.
 *
 * Authentication: Requires CRON_SECRET in Authorization header
 *
 * Example CRON schedule (using cron-job.org or similar):
 * - Schedule: Every Monday at 09:00 UTC
 * - URL: https://your-domain.com/api/cron/send-admin-weekly-summary
 * - Headers: Authorization: Bearer YOUR_CRON_SECRET
 *
 * @returns JSON response with send results
 */
export async function GET(request: NextRequest) {
  const logPrefix = '[SEND_ADMIN_WEEKLY_SUMMARY_ROUTE]';

  try {
    console.log(`${logPrefix} Endpoint called`);

    // Authorization
    const authResult = validateCronAuth(request);
    if (!authResult.valid) {
      console.error(`${logPrefix} Authorization failed:`, {
        secretConfigured: !!process.env.CRON_SECRET,
        headerProvided: !!request.headers.get('Authorization'),
      });
      return apiError(authResult.error || 'Unauthorized', 401);
    }
    console.log(`${logPrefix} Authorization successful`);

    // Send weekly summary
    console.log(`${logPrefix} Triggering admin weekly summary send`);
    const result = await sendAdminWeeklySummary();

    if (!result.success) {
      console.error(`${logPrefix} Failed to send weekly summary:`, result.error);
      return apiError(result.error || 'Failed to send weekly summary', 500);
    }

    console.log(
      `${logPrefix} Weekly summary sent successfully:`,
      JSON.stringify(result.data, null, 2)
    );

    return apiSuccess({
      timestamp: new Date().toISOString(),
      message: 'Admin weekly summary emails sent successfully',
      results: {
        sent: result.data?.sentCount || 0,
        skipped: result.data?.skippedCount || 0,
        failed: result.data?.failedCount || 0,
        details: result.data?.results || [],
      },
    });
  } catch (error) {
    logError(logPrefix, error, { operation: 'unhandled' });
    return apiError(
      error instanceof Error ? error : new Error('Unknown error'),
      500
    );
  }
}
