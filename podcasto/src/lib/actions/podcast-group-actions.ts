'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from './admin/auth-actions';
import type { ActionResult } from './shared/types';
import { errorResult } from './shared/error-handler';
import type { OutputLanguage } from '@/lib/constants/languages';
import {
  createPodcastGroup,
  updatePodcastGroup,
  deletePodcastGroup,
  addLanguageVariant,
  removeLanguageVariant,
  setPrimaryLanguage,
  linkPodcastToGroup,
  getPodcastGroupWithLanguages,
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
    revalidatePath(`/admin/podcasts/groups/${group.id}/edit`);
    revalidatePath(`/podcasts/${group.id}`);

    return {
      success: true,
      data: completeGroup
    };
  } catch (error) {
    console.error('[createPodcastGroupAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to create podcast group');
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
    return errorResult(error instanceof Error ? error.message : 'Failed to update podcast group');
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
    revalidatePath(`/admin/podcasts/groups/${groupId}/edit`);
    revalidatePath(`/podcasts/${groupId}`);

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[deletePodcastGroupAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to delete podcast group');
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
    return errorResult(error instanceof Error ? error.message : 'Failed to add language variant');
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
    revalidatePath(`/admin/podcasts/groups/${groupId}/edit`);
    revalidatePath(`/podcasts/${groupId}`);

    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    console.error('[removeLanguageVariantAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to remove language variant');
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
    return errorResult(error instanceof Error ? error.message : 'Failed to set primary language');
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
    return errorResult(error instanceof Error ? error.message : 'Failed to retrieve podcast group');
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
    outputLanguage: OutputLanguage;
    slogan?: string;
    creativityLevel: number;
    episodeFrequency: number;
    podcastFormat?: 'single-speaker' | 'multi-speaker';
    conversationStyle: string;
    speaker1Role: string;
    speaker2Role?: string;
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
          language_code: langData.language_code, // ISO language code
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
          // NOTE: language removed - now using podcasts.language_code instead
          creativity_level: Math.round(langData.creativityLevel * 100),
          podcast_format: langData.podcastFormat || 'multi-speaker',
          conversation_style: langData.conversationStyle,
          speaker1_role: langData.speaker1Role,
          speaker2_role: langData.speaker2Role || null,
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
    return errorResult(error instanceof Error ? error.message : 'Failed to create podcast group with new podcasts');
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

/**
 * Create a podcast for premium users
 *
 * Premium users can select podcast format (single-speaker vs multi-speaker)
 * but don't have access to all advanced admin settings.
 *
 * This action:
 * - Validates premium access (subscription or credits)
 * - Sets sensible defaults for non-exposed admin fields
 * - Allows format selection
 * - Creates single-language podcast group
 *
 * @param data - Premium podcast creation data
 * @returns The created podcast group with language
 */
export async function createPremiumPodcastAction(
  data: Omit<CreatePodcastGroupWithNewPodcastsData, 'languages'> & {
    language: {
      // Basic info (user provides)
      title: string;
      description: string;
      cover_image?: string;
      image_style?: string;

      // Content source (user provides)
      contentSource: 'telegram' | 'urls';
      telegramChannel?: string;
      telegramHours?: number;
      urls?: string[];

      // Format selection (user provides)
      podcastFormat?: 'single-speaker' | 'multi-speaker';
      speaker1Role: string;
      speaker2Role?: string;

      // Style (user provides)
      conversationStyle: string;
      introPrompt?: string;
      outroPrompt?: string;

      // Schedule (user provides)
      episodeFrequency: number;
      autoGeneration: boolean;

      // Language (user provides)
      language: string;
      outputLanguage: OutputLanguage;
    };
  }
): Promise<ActionResult<PodcastGroupWithLanguages>> {
  try {
    const { getUser } = await import('@/lib/auth');
    const { checkAdvancedPodcastAccessAction } = await import('./subscription-actions');

    // Verify user is authenticated
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Check premium access
    const accessCheck = await checkAdvancedPodcastAccessAction();
    if (!accessCheck.hasAccess) {
      return {
        success: false,
        error: 'Premium subscription or sufficient credits required'
      };
    }

    // Generate podcast name from title (kebab-case)
    const podcastName = data.language.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Set sensible defaults for admin-only fields
    const fullLanguageData = {
      language_code: data.language.language,
      is_primary: true,
      title: data.language.title,
      description: data.language.description,
      cover_image: data.language.cover_image,
      image_style: data.language.image_style,
      contentSource: data.language.contentSource,
      telegramChannel: data.language.telegramChannel,
      telegramHours: data.language.telegramHours,
      urls: data.language.urls,

      // Admin fields with defaults
      creator: user.email || 'Anonymous',
      podcastName: podcastName,
      slogan: undefined,
      creativityLevel: 0.7, // Medium creativity
      mixingTechniques: ['rhetorical-questions', 'personal-anecdotes'],
      additionalInstructions: undefined,

      // User-provided fields
      podcastFormat: data.language.podcastFormat,
      conversationStyle: data.language.conversationStyle,
      speaker1Role: data.language.speaker1Role,
      speaker2Role: data.language.speaker2Role,
      outputLanguage: data.language.outputLanguage,
      episodeFrequency: data.language.episodeFrequency,
    };

    // Construct full creation data
    const fullData: CreatePodcastGroupWithNewPodcastsData = {
      base_title: data.language.title,
      base_description: data.language.description,
      base_cover_image: data.language.cover_image,
      languages: [fullLanguageData]
    };

    // Import podcast creation utilities
    const { podcastsApi, podcastConfigsApi } = await import('@/lib/db/api');

    try {
      // Create podcast metadata
      const podcast = await podcastsApi.createPodcast({
        title: fullLanguageData.title,
        description: fullLanguageData.description,
        cover_image: fullLanguageData.cover_image || null,
        image_style: fullLanguageData.image_style || null,
        language_code: fullLanguageData.language_code, // ISO language code
        created_by: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      if (!podcast) {
        throw new Error('Failed to create podcast');
      }

      // Filter and prepare URLs
      const filteredUrls = fullLanguageData.urls
        ? fullLanguageData.urls.filter(url => url && url.trim() !== '')
        : [];

      // Create podcast config
      await podcastConfigsApi.createPodcastConfig({
        podcast_id: podcast.id,
        content_source: fullLanguageData.contentSource,
        telegram_channel: fullLanguageData.telegramChannel || null,
        telegram_hours: fullLanguageData.telegramHours || null,
        urls: filteredUrls.length > 0 ? filteredUrls : null,
        creator: fullLanguageData.creator,
        podcast_name: fullLanguageData.podcastName,
        slogan: fullLanguageData.slogan || null,
        // NOTE: language removed - now using podcasts.language_code instead
        creativity_level: Math.round(fullLanguageData.creativityLevel * 100),
        podcast_format: fullLanguageData.podcastFormat || 'multi-speaker',
        conversation_style: fullLanguageData.conversationStyle,
        speaker1_role: fullLanguageData.speaker1Role,
        speaker2_role: fullLanguageData.speaker2Role || null,
        mixing_techniques: fullLanguageData.mixingTechniques,
        additional_instructions: fullLanguageData.additionalInstructions || null,
        episode_frequency: fullLanguageData.episodeFrequency,
      });

      // Create the podcast group
      const group = await createPodcastGroup({
        base_title: fullData.base_title,
        base_description: fullData.base_description,
        base_cover_image: fullData.base_cover_image
      });

      // Add language variant
      await addLanguageVariant({
        podcast_group_id: group.id,
        language_code: fullLanguageData.language_code,
        title: fullLanguageData.title,
        description: fullLanguageData.description,
        cover_image: fullLanguageData.cover_image,
        is_primary: true,
        podcast_id: podcast.id
      });

      // Link podcast to group
      await linkPodcastToGroup(
        podcast.id,
        group.id,
        fullLanguageData.language_code
      );

      // Fetch the complete group with languages
      const completeGroup = await getPodcastGroupWithLanguages(group.id);

      if (!completeGroup) {
        throw new Error('Failed to retrieve created podcast group');
      }

      // Revalidate relevant pages
      revalidatePath('/podcasts');
      revalidatePath('/podcasts/my');

      return {
        success: true,
        data: completeGroup
      };
    } catch (innerError) {
      console.error('[createPremiumPodcastAction] Error:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('[createPremiumPodcastAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to create podcast');
  }
}

/**
 * Create a podcast for regular (free) users
 *
 * Regular users get:
 * - Hardcoded multi-speaker format (cannot change)
 * - Sensible defaults for all advanced settings
 * - Basic configuration only
 *
 * This action:
 * - Verifies user authentication (any authenticated user can create)
 * - Sets all admin fields to defaults
 * - Forces multi-speaker format
 * - Creates single-language podcast group
 *
 * @param data - Regular user podcast creation data
 * @returns The created podcast group with language
 */
export async function createUserPodcastAction(
  data: Omit<CreatePodcastGroupWithNewPodcastsData, 'languages'> & {
    language: {
      // Basic info (user provides)
      title: string;
      description: string;
      cover_image?: string;
      image_style?: string;

      // Content source (user provides)
      contentSource: 'telegram' | 'urls';
      telegramChannel?: string;
      telegramHours?: number;
      urls?: string[];

      // Schedule (user provides)
      episodeFrequency: number;
      autoGeneration: boolean;

      // Language (user provides)
      language: string;
      outputLanguage: OutputLanguage;
    };
  }
): Promise<ActionResult<PodcastGroupWithLanguages>> {
  try {
    const { getUser } = await import('@/lib/auth');

    // Verify user is authenticated
    const user = await getUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Generate podcast name from title (kebab-case)
    const podcastName = data.language.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Set defaults for all advanced fields
    const fullLanguageData = {
      language_code: data.language.language,
      is_primary: true,
      title: data.language.title,
      description: data.language.description,
      cover_image: data.language.cover_image,
      image_style: data.language.image_style,
      contentSource: data.language.contentSource,
      telegramChannel: data.language.telegramChannel,
      telegramHours: data.language.telegramHours,
      urls: data.language.urls,

      // Admin fields with defaults
      creator: user.email || 'Anonymous',
      podcastName: podcastName,
      slogan: undefined,
      creativityLevel: 0.7, // Medium creativity
      mixingTechniques: ['rhetorical-questions', 'personal-anecdotes'],
      additionalInstructions: undefined,

      // Hardcoded format and style for regular users
      podcastFormat: 'multi-speaker' as const,
      conversationStyle: 'casual',
      speaker1Role: 'Host',
      speaker2Role: 'Co-host',
      outputLanguage: data.language.outputLanguage,
      episodeFrequency: data.language.episodeFrequency,
    };

    // Construct full creation data
    const fullData: CreatePodcastGroupWithNewPodcastsData = {
      base_title: data.language.title,
      base_description: data.language.description,
      base_cover_image: data.language.cover_image,
      languages: [fullLanguageData]
    };

    // Import podcast creation utilities
    const { podcastsApi, podcastConfigsApi } = await import('@/lib/db/api');

    try {
      // Create podcast metadata
      const podcast = await podcastsApi.createPodcast({
        title: fullLanguageData.title,
        description: fullLanguageData.description,
        cover_image: fullLanguageData.cover_image || null,
        image_style: fullLanguageData.image_style || null,
        language_code: fullLanguageData.language_code, // ISO language code
        created_by: user.id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      if (!podcast) {
        throw new Error('Failed to create podcast');
      }

      // Filter and prepare URLs
      const filteredUrls = fullLanguageData.urls
        ? fullLanguageData.urls.filter(url => url && url.trim() !== '')
        : [];

      // Create podcast config
      await podcastConfigsApi.createPodcastConfig({
        podcast_id: podcast.id,
        content_source: fullLanguageData.contentSource,
        telegram_channel: fullLanguageData.telegramChannel || null,
        telegram_hours: fullLanguageData.telegramHours || null,
        urls: filteredUrls.length > 0 ? filteredUrls : null,
        creator: fullLanguageData.creator,
        podcast_name: fullLanguageData.podcastName,
        slogan: fullLanguageData.slogan || null,
        // NOTE: language removed - now using podcasts.language_code instead
        creativity_level: Math.round(fullLanguageData.creativityLevel * 100),
        podcast_format: fullLanguageData.podcastFormat,
        conversation_style: fullLanguageData.conversationStyle,
        speaker1_role: fullLanguageData.speaker1Role,
        speaker2_role: fullLanguageData.speaker2Role,
        mixing_techniques: fullLanguageData.mixingTechniques,
        additional_instructions: fullLanguageData.additionalInstructions || null,
        episode_frequency: fullLanguageData.episodeFrequency,
      });

      // Create the podcast group
      const group = await createPodcastGroup({
        base_title: fullData.base_title,
        base_description: fullData.base_description,
        base_cover_image: fullData.base_cover_image
      });

      // Add language variant
      await addLanguageVariant({
        podcast_group_id: group.id,
        language_code: fullLanguageData.language_code,
        title: fullLanguageData.title,
        description: fullLanguageData.description,
        cover_image: fullLanguageData.cover_image,
        is_primary: true,
        podcast_id: podcast.id
      });

      // Link podcast to group
      await linkPodcastToGroup(
        podcast.id,
        group.id,
        fullLanguageData.language_code
      );

      // Fetch the complete group with languages
      const completeGroup = await getPodcastGroupWithLanguages(group.id);

      if (!completeGroup) {
        throw new Error('Failed to retrieve created podcast group');
      }

      // Revalidate relevant pages
      revalidatePath('/podcasts');
      revalidatePath('/podcasts/my');

      return {
        success: true,
        data: completeGroup
      };
    } catch (innerError) {
      console.error('[createUserPodcastAction] Error:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('[createUserPodcastAction] Error:', error);
    return errorResult(error instanceof Error ? error.message : 'Failed to create podcast');
  }
}
