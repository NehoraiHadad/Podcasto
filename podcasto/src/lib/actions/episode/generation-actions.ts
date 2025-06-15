'use server';

import { requireAdmin } from '../auth-actions';
import { episodesApi } from '@/lib/db/api';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { getPostProcessingConfig } from '@/lib/utils/post-processing-utils';
import { S3StorageUtils } from '@/lib/services/storage-utils';
import { AIService } from '@/lib/ai';
import { TranscriptProcessor } from '@/lib/services/transcript-processor';

/**
 * Manually generate title and description for an episode using AI
 * This is a server action that requires admin permissions
 */
export async function generateEpisodeTitleAndDescription(
  episodeId: string
): Promise<{
  success: boolean;
  title?: string;
  description?: string;
  error?: string;
}> {
  // Ensure the user is an admin
  await requireAdmin();

  try {
    // Get the episode
    const episode = await episodesApi.getEpisodeById(episodeId);
    
    if (!episode) {
      throw new Error('Episode not found');
    }

    if (!episode.podcast_id) {
      throw new Error('Episode has no associated podcast');
    }

    // Get configuration and create services
    const { config, error: configError } = await getPostProcessingConfig(true, true);
    
    if (configError) {
      throw new Error(`Configuration error: ${configError}`);
    }
    
    if (!config.s3 || !config.ai) {
      throw new Error('Both S3 and AI configuration are required for title and description generation');
    }
    
    // Create services directly
    const storageUtils = new S3StorageUtils(config.s3);
    const aiService = new AIService(config.ai);
    const transcriptProcessor = new TranscriptProcessor(storageUtils);
    
    // Get transcript from S3
    const transcript = await storageUtils.getTranscriptFromS3(
      episode.podcast_id, 
      episodeId
    );
    
    if (!transcript) {
      throw new Error('No transcript found for this episode. Cannot generate title and description without transcript.');
    }

    // Use episode language or default to English
    const language = episode.language === 'hebrew' ? 'Hebrew' : 'English';
    
    // Preprocess transcript
    const processedTranscript = transcriptProcessor.preprocessTranscript(transcript);
    
    // Generate title and summary using AI service
    const { title, summary } = await aiService.generateTitleAndSummary(
      processedTranscript,
      { 
        language,
        style: 'engaging',
        maxLength: 60 
      },
      { 
        language,
        style: 'concise',
        maxLength: 150 
      }
    );

    return {
      success: true,
      title,
      description: summary
    };

  } catch (error) {
    logError('generateEpisodeTitleAndDescription', error);
    return {
      success: false,
      error: errorToString(error)
    };
  }
} 