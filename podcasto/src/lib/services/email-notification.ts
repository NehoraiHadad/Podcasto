/**
 * Email Notification Service
 * Handles sending email notifications for new episodes to subscribed users
 */

import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient, SES_CONFIG } from '@/lib/aws/ses-client';
import { generateNewEpisodeHTML, generateNewEpisodeText, type EpisodeEmailData } from '@/lib/email/templates/new-episode';
import { episodesApi, podcastsApi, subscriptionsApi, sentEpisodesApi, profilesApi } from '@/lib/db/api';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

export interface EmailNotificationResult {
  success: boolean;
  totalSubscribers: number;
  emailsSent: number;
  emailsFailed: number;
  errors: string[];
}

/**
 * Sends new episode notification to all subscribed users
 * @param episodeId - ID of the newly published episode
 * @returns Result with statistics about sent emails
 */
export async function sendNewEpisodeNotification(
  episodeId: string
): Promise<EmailNotificationResult> {
  const logPrefix = `[EMAIL_NOTIFICATION:${episodeId}]`;

  const result: EmailNotificationResult = {
    success: false,
    totalSubscribers: 0,
    emailsSent: 0,
    emailsFailed: 0,
    errors: [],
  };

  try {
    console.log(`${logPrefix} Starting notification process`);

    // 1. Get episode and podcast details
    const episode = await episodesApi.getEpisodeById(episodeId);
    if (!episode) {
      const error = 'Episode not found';
      console.error(`${logPrefix} ${error}`);
      result.errors.push(error);
      return result;
    }

    if (!episode.podcast_id) {
      const error = 'Episode has no podcast_id';
      console.error(`${logPrefix} ${error}`);
      result.errors.push(error);
      return result;
    }

    const podcast = await podcastsApi.getPodcastById(episode.podcast_id);
    if (!podcast) {
      const error = 'Podcast not found';
      console.error(`${logPrefix} ${error}`);
      result.errors.push(error);
      return result;
    }

    console.log(`${logPrefix} Found episode "${episode.title}" from podcast "${podcast.title}"`);

    // 2. Get all subscribers for this podcast
    const subscribers = await subscriptionsApi.getPodcastSubscriptions(episode.podcast_id);
    result.totalSubscribers = subscribers.length;

    if (subscribers.length === 0) {
      console.log(`${logPrefix} No subscribers found for this podcast`);
      result.success = true;
      return result;
    }

    console.log(`${logPrefix} Found ${subscribers.length} subscribers`);

    // 3. Get Supabase service role client to fetch user emails from auth.users
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createBrowserClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 4. Prepare email data
    const emailData: EpisodeEmailData = {
      episodeId: episode.id,
      episodeTitle: episode.title,
      episodeDescription: episode.description || undefined,
      podcastTitle: podcast.title,
      podcastId: podcast.id,
      coverImage: episode.cover_image || podcast.cover_image || undefined,
      duration: episode.duration || undefined,
      publishedAt: episode.published_at ? new Date(episode.published_at) : undefined,
    };

    // 5. Process each subscriber
    for (const subscription of subscribers) {
      const userId = subscription.user_id;
      if (!userId) {
        console.warn(`${logPrefix} Subscription ${subscription.id} has no user_id`);
        continue;
      }

      try {
        // 5.1 Check if episode was already sent to this user
        const alreadySent = await sentEpisodesApi.hasEpisodeBeenSentToUser(episodeId, userId);
        if (alreadySent) {
          console.log(`${logPrefix} Episode already sent to user ${userId}, skipping`);
          continue;
        }

        // 5.2 Check if user has email notifications enabled
        const hasNotificationsEnabled = await profilesApi.hasEmailNotificationsEnabled(userId);
        if (!hasNotificationsEnabled) {
          console.log(`${logPrefix} User ${userId} has email notifications disabled, skipping`);
          continue;
        }

        // 5.3 Get user email from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

        if (userError || !userData?.user?.email) {
          const error = `Failed to get email for user ${userId}: ${userError?.message || 'No email found'}`;
          console.error(`${logPrefix} ${error}`);
          result.errors.push(error);
          result.emailsFailed++;
          continue;
        }

        const userEmail = userData.user.email;

        // 5.4 Generate email content
        const htmlContent = generateNewEpisodeHTML(emailData);
        const textContent = generateNewEpisodeText(emailData);

        // 5.5 Send email via SES
        const sendEmailCommand = new SendEmailCommand({
          Destination: {
            ToAddresses: [userEmail],
          },
          Message: {
            Body: {
              Html: {
                Charset: 'UTF-8',
                Data: htmlContent,
              },
              Text: {
                Charset: 'UTF-8',
                Data: textContent,
              },
            },
            Subject: {
              Charset: 'UTF-8',
              Data: `🎙️ New ${podcast.title} Episode: ${episode.title}`,
            },
          },
          Source: `${SES_CONFIG.FROM_NAME} <${SES_CONFIG.FROM_EMAIL}>`,
        });

        await sesClient.send(sendEmailCommand);
        console.log(`${logPrefix} Successfully sent email to ${userEmail}`);

        // 5.6 Record that we sent this episode to this user
        await sentEpisodesApi.createSentEpisode({
          user_id: userId,
          episode_id: episodeId,
        });

        result.emailsSent++;

      } catch (error) {
        const errorMsg = `Failed to send email to user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`${logPrefix} ${errorMsg}`, error);
        result.errors.push(errorMsg);
        result.emailsFailed++;
      }
    }

    // 6. Mark as successful if at least one email was sent
    result.success = result.emailsSent > 0 || result.totalSubscribers === 0;

    console.log(`${logPrefix} Notification process completed. Sent: ${result.emailsSent}, Failed: ${result.emailsFailed}`);

    return result;

  } catch (error) {
    const errorMsg = `Unexpected error in notification process: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`${logPrefix} ${errorMsg}`, error);
    result.errors.push(errorMsg);
    return result;
  }
}
