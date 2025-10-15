'use server';

import { requireAdmin } from '@/lib/auth';
import { episodesApi } from '@/lib/db/api';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { getPostProcessingConfig } from '@/lib/utils/post-processing-utils';
import { createS3Service } from '@/lib/services/s3-service';
import { createTranscriptProcessorInstance } from '@/lib/services/service-factory';
import { AIService } from '@/lib/ai';

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

    // Create services using factory pattern
    const s3Service = createS3Service(config.s3);
    const aiService = new AIService(config.ai);
    const transcriptProcessor = createTranscriptProcessorInstance(s3Service);

    // Get transcript from S3
    const transcript = await s3Service.getTranscriptFromS3(
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