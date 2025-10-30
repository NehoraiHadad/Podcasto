'use server';

import { episodesApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/auth/server';
import { sendNewEpisodeNotification, EmailNotificationResult } from '@/lib/services/email';
import { logError, errorToString } from '@/lib/utils/error-utils';

/**
 * Resends email notifications for a published episode
 * This is useful if emails failed to send initially or if admin wants to notify users again
 *
 * @param episodeId - ID of the episode to send notifications for
 * @returns Email notification result with statistics
 */
export async function resendEpisodeEmails(
  episodeId: string
): Promise<EmailNotificationResult & { error?: string }> {
  // Ensure the user is an admin
  await requireAdmin();

  try {
    // Get the episode to verify it exists and is published
    const episode = await episodesApi.getEpisodeById(episodeId);

    if (!episode) {
      return {
        success: false,
        totalSubscribers: 0,
        emailsSent: 0,
        emailsFailed: 0,
        errors: ['Episode not found'],
        error: 'Episode not found'
      };
    }

    // Check if episode is published
    if (episode.status !== 'published') {
      return {
        success: false,
        totalSubscribers: 0,
        emailsSent: 0,
        emailsFailed: 0,
        errors: [`Episode must be published to send emails. Current status: ${episode.status}`],
        error: `Episode must be published to send emails. Current status: ${episode.status}`
      };
    }

    console.log(`[RESEND_EMAILS] Manually resending email notifications for episode ${episodeId}`);

    // Send email notifications
    const result = await sendNewEpisodeNotification(episodeId);

    console.log(`[RESEND_EMAILS] Emails sent: ${result.emailsSent}/${result.totalSubscribers}, Failed: ${result.emailsFailed}`);

    return result;
  } catch (error) {
    logError('resendEpisodeEmails', error);

    return {
      success: false,
      totalSubscribers: 0,
      emailsSent: 0,
      emailsFailed: 0,
      errors: [errorToString(error)],
      error: errorToString(error)
    };
  }
}
