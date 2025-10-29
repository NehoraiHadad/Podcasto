'use server';

/**
 * Main orchestrator for podcast update operations.
 * Coordinates validation, metadata updates, and configuration updates.
 */

import { podcastsApi } from '@/lib/db/api';
import { requireAdmin } from '@/lib/auth';
import {
  ActionResponse,
  PodcastUpdateData,
  podcastUpdateSchema
} from './schemas';
import {
  handleActionError,
  revalidatePodcastPaths,
  checkTitleConflict
} from './utils';
import { updatePodcastMetadata } from './update/metadata';
import { hasConfigFields } from './update/validation';
import { updatePodcastConfig } from './update/config-update';
import { handleMessagePreCheck } from './generation/message-check-handler';
import { ChannelAccessStatus } from '@/lib/services/telegram/types';

/**
 * Updates an existing podcast with new metadata and/or configuration.
 * Validates input, checks permissions, handles conflicts, and updates database.
 *
 * @param data - Podcast update data with all fields
 * @returns ActionResponse indicating success or error
 */
export async function updatePodcast(data: PodcastUpdateData): Promise<ActionResponse> {
  try {
    console.log("Received update data:", JSON.stringify(data, null, 2));

    // Validate the input data
    try {
      const validatedData = podcastUpdateSchema.parse(data);
      console.log("Validated data:", JSON.stringify(validatedData, null, 2));

      // Check if the user has admin permissions
      await requireAdmin();

      // Validate required fields
      if (!validatedData.title || validatedData.title.trim().length < 3) {
        return {
          success: false,
          error: 'Title is required and must be at least 3 characters',
        };
      }

      // Check for title conflicts with other podcasts
      const existingPodcasts = await podcastsApi.getAllPodcasts();
      const titleConflict = await checkTitleConflict(
        existingPodcasts,
        validatedData.title,
        validatedData.id
      );

      if (titleConflict) {
        return {
          success: false,
          error: titleConflict
        };
      }

      try {
        // Update the podcast basic data
        const updatedPodcast = await updatePodcastMetadata(validatedData);

        if (!updatedPodcast) {
          return {
            success: false,
            error: 'Failed to update podcast metadata',
          };
        }

        // Update podcast configuration if any config fields are provided
        let channelWarning: string | undefined;
        if (hasConfigFields(validatedData)) {
          console.log("Updating podcast config...");
          const configUpdateResult = await updatePodcastConfig(validatedData);

          if (!configUpdateResult.success) {
            console.error("Config update failed:", configUpdateResult.error);
            return configUpdateResult;
          }

          // If Telegram channel was updated, check accessibility
          if (validatedData.telegramChannel) {
            try {
              const checkResult = await handleMessagePreCheck(
                validatedData.id,
                validatedData.telegramChannel,
                7, // Check last 7 days
                'unknown' // Will be updated by the function
              );

              if (checkResult.accessStatus === ChannelAccessStatus.NO_PREVIEW) {
                channelWarning = `Channel "${validatedData.telegramChannel}" doesn't allow public message previews. Episode generation will rely on authenticated Lambda access.`;
              } else if (checkResult.accessStatus === ChannelAccessStatus.NOT_FOUND) {
                channelWarning = `Channel "${validatedData.telegramChannel}" was not found or is completely private. Please verify the channel name.`;
              }
            } catch (error) {
              console.error('[UPDATE_PODCAST] Error checking channel accessibility:', error);
              // Non-blocking - don't fail update
            }
          }
        }

        // Revalidate cached paths
        revalidatePodcastPaths(validatedData.id);

        return {
          success: true,
          warning: channelWarning
        };
      } catch (databaseError) {
        console.error("Database operation error:", databaseError);
        return {
          success: false,
          error: databaseError instanceof Error ?
            `Database error: ${databaseError.message}` :
            'Error updating podcast in database'
        };
      }
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return {
        success: false,
        error: validationError instanceof Error ?
          `Validation error: ${validationError.message}` :
          'Error validating podcast data'
      };
    }
  } catch (error) {
    console.error("Podcast update error:", error);
    return handleActionError(error);
  }
}
