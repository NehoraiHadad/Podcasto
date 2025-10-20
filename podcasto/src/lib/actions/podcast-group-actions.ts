'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from './admin/auth-actions';
import type { ActionResult } from './shared/types';
import {
  createPodcastGroup,
  updatePodcastGroup,
  deletePodcastGroup,
  addLanguageVariant,
  updateLanguageVariant,
  removeLanguageVariant,
  setPrimaryLanguage,
  linkPodcastToGroup,
  getPodcastGroupWithLanguages,
  getPodcastGroupById,
  languageExistsInGroup
} from '@/lib/db/api/podcast-groups';
import type {
  PodcastGroupWithLanguages,
  CreatePodcastGroupData,
  AddLanguageVariantData
} from '@/lib/db/api/podcast-groups';

/**
 * Create a new podcast group with initial language variants
 *
 * @param data - Podcast group creation data
 * @returns The created podcast group with languages
 */
export async function createPodcastGroupAction(
  data: CreatePodcastGroupData
): Promise<ActionResult<PodcastGroupWithLanguages>> {
  try {
    // Verify admin access
    await checkIsAdmin({ redirectOnFailure: true });

    // Validate at least one language is marked as primary
    const hasPrimary = data.languages.some(lang => lang.is_primary);
    if (!hasPrimary) {
      return {
        success: false,
        error: 'At least one language must be marked as primary'
      };
    }

    // Create the podcast group
    const group = await createPodcastGroup({
      base_title: data.base_title,
      base_description: data.base_description,
      base_cover_image: data.base_cover_image
    });

    // Add each language variant
    for (const langData of data.languages) {
      await addLanguageVariant({
        podcast_group_id: group.id,
        language_code: langData.language_code,
        title: langData.title,
        description: langData.description,
        cover_image: langData.cover_image,
        is_primary: langData.is_primary,
        podcast_id: langData.podcast_id
      });

      // Link the podcast to the group
      await linkPodcastToGroup(
        langData.podcast_id,
        group.id,
        langData.language_code
      );
    }

    // Fetch the complete group with languages
    const completeGroup = await getPodcastGroupWithLanguages(group.id);

    if (!completeGroup) {
      return {
        success: false,
        error: 'Failed to retrieve created podcast group'
      };
    }

    // Revalidate relevant pages
    revalidatePath('/admin/podcasts');
    revalidatePath('/podcasts');

    return {
      success: true,
      data: completeGroup
    };
  } catch (error) {
    console.error('[createPodcastGroupAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create podcast group'
    };
  }
}

/**
 * Update an existing podcast group
 *
 * @param groupId - Podcast group ID
 * @param data - Updated group data
 * @returns The updated podcast group
 */
export async function updatePodcastGroupAction(
  groupId: string,
  data: { base_title?: string; base_description?: string; base_cover_image?: string }
): Promise<ActionResult<PodcastGroupWithLanguages>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const updated = await updatePodcastGroup(groupId, data);

    if (!updated) {
      return {
        success: false,
        error: 'Podcast group not found'
      };
    }

    const completeGroup = await getPodcastGroupWithLanguages(groupId);

    if (!completeGroup) {
      return {
        success: false,
        error: 'Failed to retrieve updated podcast group'
      };
    }

    revalidatePath('/admin/podcasts');
    revalidatePath('/podcasts');

    return {
      success: true,
      data: completeGroup
    };
  } catch (error) {
    console.error('[updatePodcastGroupAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update podcast group'
    };
  }
}

/**
 * Delete a podcast group
 *
 * @param groupId - Podcast group ID
 * @returns Success result
 */
export async function deletePodcastGroupAction(
  groupId: string
): Promise<ActionResult<void>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const deleted = await deletePodcastGroup(groupId);

    if (!deleted) {
      return {
        success: false,
        error: 'Podcast group not found'
      };
    }

    revalidatePath('/admin/podcasts');
    revalidatePath('/podcasts');

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[deletePodcastGroupAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete podcast group'
    };
  }
}

/**
 * Add a language variant to an existing podcast group
 *
 * @param data - Language variant data
 * @returns The updated podcast group with languages
 */
export async function addLanguageVariantAction(
  data: AddLanguageVariantData
): Promise<ActionResult<PodcastGroupWithLanguages>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    // Check if language already exists in group
    const exists = await languageExistsInGroup(
      data.podcast_group_id,
      data.language_code
    );

    if (exists) {
      return {
        success: false,
        error: `Language ${data.language_code} already exists in this podcast group`
      };
    }

    // Add the language variant
    await addLanguageVariant(data);

    // Link the podcast to the group
    await linkPodcastToGroup(
      data.podcast_id,
      data.podcast_group_id,
      data.language_code
    );

    // Fetch the updated group
    const updatedGroup = await getPodcastGroupWithLanguages(data.podcast_group_id);

    if (!updatedGroup) {
      return {
        success: false,
        error: 'Failed to retrieve updated podcast group'
      };
    }

    revalidatePath('/admin/podcasts');
    revalidatePath('/podcasts');

    return {
      success: true,
      data: updatedGroup
    };
  } catch (error) {
    console.error('[addLanguageVariantAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add language variant'
    };
  }
}

/**
 * Remove a language variant from a podcast group
 *
 * @param languageId - Podcast language ID
 * @param groupId - Podcast group ID (for revalidation)
 * @returns Success result
 */
export async function removeLanguageVariantAction(
  languageId: string,
  groupId: string
): Promise<ActionResult<void>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const removed = await removeLanguageVariant(languageId);

    if (!removed) {
      return {
        success: false,
        error: 'Language variant not found'
      };
    }

    revalidatePath('/admin/podcasts');
    revalidatePath('/podcasts');

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[removeLanguageVariantAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove language variant'
    };
  }
}

/**
 * Set a language as the primary language for a podcast group
 *
 * @param groupId - Podcast group ID
 * @param languageCode - Language code to set as primary
 * @returns Success result
 */
export async function setPrimaryLanguageAction(
  groupId: string,
  languageCode: string
): Promise<ActionResult<void>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const success = await setPrimaryLanguage(groupId, languageCode);

    if (!success) {
      return {
        success: false,
        error: 'Language not found in podcast group'
      };
    }

    revalidatePath('/admin/podcasts');
    revalidatePath('/podcasts');

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[setPrimaryLanguageAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set primary language'
    };
  }
}

/**
 * Get a podcast group with all its language variants (admin only)
 *
 * @param groupId - Podcast group ID
 * @returns The podcast group with languages
 */
export async function getPodcastGroupAction(
  groupId: string
): Promise<ActionResult<PodcastGroupWithLanguages>> {
  try {
    await checkIsAdmin({ redirectOnFailure: true });

    const group = await getPodcastGroupWithLanguages(groupId);

    if (!group) {
      return {
        success: false,
        error: 'Podcast group not found'
      };
    }

    return {
      success: true,
      data: group
    };
  } catch (error) {
    console.error('[getPodcastGroupAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve podcast group'
    };
  }
}

/**
 * Type for creating a podcast group with new podcasts
 */
export interface CreatePodcastGroupWithNewPodcastsData {
  base_title: string;
  base_description?: string;
  base_cover_image?: string;
  languages: Array<{
    language_code: string;
    is_primary: boolean;
    // Podcast metadata
    title: string;
    description: string;
    cover_image?: string;
    image_style?: string;
    // Content source
    contentSource: 'telegram' | 'urls';
    telegramChannel?: string;
    telegramHours?: number;
    urls?: string[];
    // Podcast config
    creator: string;
    podcastName: string;
    outputLanguage: 'english' | 'hebrew';
    slogan?: string;
    creativityLevel: number;
    isLongPodcast: boolean;
    discussionRounds: number;
    minCharsPerRound: number;
    episodeFrequency: number;
    conversationStyle: string;
    speaker1Role: string;
    speaker2Role: string;
    mixingTechniques: string[];
    additionalInstructions?: string;
  }>;
}

/**
 * Create a podcast group with new podcasts in one transaction
 *
 * This is now the PRIMARY and ONLY way to create podcasts in the system.
 * All podcasts are created as part of a podcast group, even if they only have one language.
 *
 * This action creates:
 * 1. All individual podcasts with their configs
 * 2. The podcast group
 * 3. Language variant records
 * 4. Links podcasts to the group
 *
 * @param data - Complete podcast group creation data
 * @returns The created podcast group with languages
 */
export async function createPodcastGroupWithNewPodcastsAction(
  data: CreatePodcastGroupWithNewPodcastsData
): Promise<ActionResult<PodcastGroupWithLanguages>> {
  try {
    // Verify admin access
    await checkIsAdmin({ redirectOnFailure: true });

    // Validate at least one language is marked as primary
    const hasPrimary = data.languages.some(lang => lang.is_primary);
    if (!hasPrimary) {
      return {
        success: false,
        error: 'At least one language must be marked as primary'
      };
    }

    // Import podcast creation utilities
    const { podcastsApi, podcastConfigsApi } = await import('@/lib/db/api');

    // Track created podcast IDs for rollback if needed
    const createdPodcastIds: string[] = [];

    try {
      // Step 1: Create all podcasts
      for (const langData of data.languages) {
        // Create podcast metadata
        const podcast = await podcastsApi.createPodcast({
          title: langData.title,
          description: langData.description,
          cover_image: langData.cover_image || null,
          image_style: langData.image_style || null,
          created_at: new Date(),
          updated_at: new Date(),
        });

        if (!podcast) {
          throw new Error(`Failed to create podcast for language ${langData.language_code}`);
        }

        createdPodcastIds.push(podcast.id);

        // Filter and prepare URLs
        const filteredUrls = langData.urls
          ? langData.urls.filter(url => url && url.trim() !== '')
          : [];

        // Create podcast config
        await podcastConfigsApi.createPodcastConfig({
          podcast_id: podcast.id,
          content_source: langData.contentSource,
          telegram_channel: langData.telegramChannel || null,
          telegram_hours: langData.telegramHours || null,
          urls: filteredUrls.length > 0 ? filteredUrls : null,
          creator: langData.creator,
          podcast_name: langData.podcastName,
          slogan: langData.slogan || null,
          language: langData.outputLanguage,
          creativity_level: Math.round(langData.creativityLevel * 100),
          is_long_podcast: langData.isLongPodcast,
          discussion_rounds: langData.discussionRounds,
          min_chars_per_round: langData.minCharsPerRound,
          conversation_style: langData.conversationStyle,
          speaker1_role: langData.speaker1Role,
          speaker2_role: langData.speaker2Role,
          mixing_techniques: langData.mixingTechniques,
          additional_instructions: langData.additionalInstructions || null,
          episode_frequency: langData.episodeFrequency,
        });
      }

      // Step 2: Create the podcast group
      const group = await createPodcastGroup({
        base_title: data.base_title,
        base_description: data.base_description,
        base_cover_image: data.base_cover_image
      });

      // Step 3: Add language variants and link podcasts
      for (let i = 0; i < data.languages.length; i++) {
        const langData = data.languages[i];
        const podcastId = createdPodcastIds[i];

        // Add language variant
        await addLanguageVariant({
          podcast_group_id: group.id,
          language_code: langData.language_code,
          title: langData.title,
          description: langData.description,
          cover_image: langData.cover_image,
          is_primary: langData.is_primary,
          podcast_id: podcastId
        });

        // Link podcast to group
        await linkPodcastToGroup(
          podcastId,
          group.id,
          langData.language_code
        );
      }

      // Fetch the complete group with languages
      const completeGroup = await getPodcastGroupWithLanguages(group.id);

      if (!completeGroup) {
        throw new Error('Failed to retrieve created podcast group');
      }

      // Revalidate relevant pages
      revalidatePath('/admin/podcasts');
      revalidatePath('/podcasts');

      return {
        success: true,
        data: completeGroup
      };
    } catch (innerError) {
      // Rollback: delete all created podcasts
      console.error('[createPodcastGroupWithNewPodcastsAction] Rolling back created podcasts');
      for (const podcastId of createdPodcastIds) {
        try {
          await podcastsApi.deletePodcast(podcastId);
        } catch (deleteError) {
          console.error(`Failed to rollback podcast ${podcastId}:`, deleteError);
        }
      }
      throw innerError;
    }
  } catch (error) {
    console.error('[createPodcastGroupWithNewPodcastsAction] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create podcast group with new podcasts'
    };
  }
}

/**
 * Alias for createPodcastGroupWithNewPodcastsAction
 *
 * This is the simplified, user-friendly name for the podcast creation action.
 * Since ALL podcasts are now created as groups (even single-language ones),
 * this provides a clearer, more intuitive API.
 *
 * @param data - Complete podcast creation data
 * @returns The created podcast group with languages
 */
export async function createPodcastAction(
  data: CreatePodcastGroupWithNewPodcastsData
): Promise<ActionResult<PodcastGroupWithLanguages>> {
  return createPodcastGroupWithNewPodcastsAction(data);
}
