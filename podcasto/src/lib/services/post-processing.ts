import { AIService } from '../ai';
import { AIServiceConfig } from '../ai/types';
import { S3StorageUtils } from './storage-utils';
import { TranscriptProcessor } from './transcript-processor';
import { EpisodeUpdater } from './episode-updater';
import { ImageGenerationService } from './image-generation';
import { ImageHandler } from './image-handler';
import { S3StorageConfig } from './storage-utils';

/**
 * Episode data structure
 */
export interface Episode {
  id: string;
  podcast_id?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  language?: string | null;
  metadata?: string | null;
  audio_url?: string;
  duration?: number | null;
  published_at?: Date | null;
  created_at?: Date | null;
  cover_image?: string | null;
  [key: string]: unknown; // For other potential properties
}

/**
 * Configuration for post-processing service
 */
export interface PostProcessingConfig {
  storageUtils: S3StorageUtils;
  aiService: AIService;
}

/**
 * Service for post-processing podcast episodes
 */
export class PostProcessingService {
  private storageUtils: S3StorageUtils;
  private aiService: AIService;
  private transcriptProcessor: TranscriptProcessor;
  private episodeUpdater: EpisodeUpdater;
  private imageService: ImageGenerationService;
  private imageHandler: ImageHandler;

  /**
   * Create a new post-processing service
   */
  constructor(config: PostProcessingConfig) {
    this.storageUtils = config.storageUtils;
    this.aiService = config.aiService;
    
    if (!this.aiService) {
      throw new Error('AIService is required for PostProcessingService');
    }
    
    this.transcriptProcessor = new TranscriptProcessor(this.storageUtils);
    this.episodeUpdater = new EpisodeUpdater();
    this.imageService = new ImageGenerationService({ aiService: this.aiService });
    this.imageHandler = new ImageHandler(
      this.storageUtils,
      this.episodeUpdater,
      this.imageService
    );
  }

  /**
   * Process a completed episode
   */
  async processCompletedEpisode(
    podcastId: string, 
    episodeId: string,
    options?: {
      forceReprocess?: boolean,
      skipTitleGeneration?: boolean,
      skipSummaryGeneration?: boolean,
      skipImageGeneration?: boolean
    }
  ): Promise<{
    success: boolean;
    message: string;
    episode?: Episode;
  }> {
    try {
      const episode = await this.getEpisode(podcastId, episodeId);
      if (!episode) {
        return { success: false, message: 'Episode not found' };
      }

      const transcript = await this.storageUtils.getTranscriptFromS3(podcastId, episodeId);
      if (!transcript) {
        return { success: false, message: 'No transcript found for episode' };
      }

      const processedResults = await this.processTranscriptAndUpdateEpisode(
        podcastId, episodeId, transcript, episode, options
      );

      if (!options?.skipImageGeneration) {
        await this.generateEpisodeImage(podcastId, episodeId, episode, true);
      }

      return {
        success: true,
        message: 'Episode processed successfully',
        episode: processedResults.episode
      };
    } catch (error) {
      console.error(`[POST_PROCESSING] Error in processCompletedEpisode:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async getEpisode(podcastId: string, episodeId: string): Promise<Episode | null> {
    try {
      // Call your episodesApi here
      return { id: episodeId, podcast_id: podcastId };
    } catch (error) {
      console.error(`[POST_PROCESSING] Error getting episode:`, error);
      return null;
    }
  }

  private async processTranscriptAndUpdateEpisode(
    podcastId: string,
    episodeId: string,
    transcript: string,
    episode: Episode,
    options?: {
      forceReprocess?: boolean,
      skipTitleGeneration?: boolean,
      skipSummaryGeneration?: boolean
    }
  ): Promise<{
    success: boolean;
    message: string;
    episode: Episode;
  }> {
    try {
      // First, preprocess the transcript
      const processedTranscript = this.transcriptProcessor.preprocessTranscript(transcript);
      
      // Generate title and summary with AI service
      const { title, summary } = await this.aiService.generateTitleAndSummary(processedTranscript);

      // Update episode with new information
      await this.episodeUpdater.updateEpisodeWithSummary(
        episodeId,
        options?.skipTitleGeneration ? '' : title,
        options?.skipSummaryGeneration ? '' : summary
      );

      return {
        success: true,
        message: 'Episode updated with title and summary',
        episode: { 
          id: episodeId, 
          podcast_id: podcastId,
          title, 
          description: summary 
        }
      };
    } catch (error) {
      console.error(`[POST_PROCESSING] Error processing transcript:`, error);
      throw error;
    }
  }

  /**
   * Generate a detailed image prompt using the AI model
   */
  async generateImagePrompt(summary: string, title?: string): Promise<string> {
    return this.imageHandler.generateImagePrompt(summary, title);
  }

  /**
   * Generate image for an episode but don't upload to S3 or update the episode
   */
  async generateEpisodeImagePreview(summary: string, title?: string): Promise<{
    success: boolean;
    imageData: Buffer | null;
    mimeType: string;
    generatedFromPrompt?: string;
    error?: string;
  }> {
    try {
      const result = await this.imageHandler.generateImagePreview(summary, title);
      return {
        success: !!result.imageData,
        imageData: result.imageData,
        mimeType: result.mimeType,
        generatedFromPrompt: result.generatedFromPrompt
      };
    } catch (error) {
      return {
        success: false,
        imageData: null,
        mimeType: 'image/jpeg',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Upload a generated image to S3 and update the episode record
   */
  async saveGeneratedImage(
    podcastId: string,
    episodeId: string,
    imageData: Buffer,
    mimeType: string,
    _episode: Episode,
    _generatedFromPrompt?: string
  ): Promise<{
    success: boolean;
    imageUrl?: string;
    error?: string;
  }> {
    return this.imageHandler.saveGeneratedImage(
      episodeId,
      podcastId,
      imageData,
      mimeType
    );
  }

  /**
   * Generate image for an episode
   */
  async generateEpisodeImage(
    podcastId: string,
    episodeId: string,
    episodeOrDescription: Episode | string,
    _force = false
  ): Promise<boolean> {
    const description = typeof episodeOrDescription === 'string' 
      ? episodeOrDescription 
      : (episodeOrDescription.description || '');
      
    return this.imageHandler.generateEpisodeImage(
      episodeId,
      podcastId,
      description
    );
  }
}

/**
 * Create a post-processing service with the specified configuration
 */
export function createPostProcessingService(config: {
  s3: S3StorageConfig;
  ai: AIServiceConfig;
}): PostProcessingService {
  if (!config.s3) {
    throw new Error('s3 config is required');
  }
  
  if (!config.ai) {
    throw new Error('ai config is required');
  }
  
  if (!config.ai.apiKey) {
    throw new Error('aiService is required');
  }
  
  // Create required services
  const storageUtils = new S3StorageUtils(config.s3);
  const aiService = new AIService(config.ai);
  
  return new PostProcessingService({
    storageUtils,
    aiService
  });
} 