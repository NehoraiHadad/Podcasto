import { AIService } from '../ai';
import { AIServiceConfig } from '../ai/types';
import { S3StorageUtils } from './storage-utils';
import { TranscriptProcessor } from './transcript-processor';
import { EpisodeUpdater } from './episode-updater';
import { ImageGenerationService } from './image-generation';
import { ImageHandler } from './image-handler';
import { S3StorageConfig } from './storage-utils';
import { episodesApi } from '../db/api';

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
  audio_url?: string | null;
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
      // Get episode data
      const episode = await this.getEpisode(episodeId);
      if (!episode || !episode.podcast_id) {
        return { success: false, message: 'Episode not found' };
      }

      // Get transcript
      const transcript = await this.storageUtils.getTranscriptFromS3(episode.podcast_id, episodeId);
      if (!transcript) {
        return { success: false, message: 'No transcript found for episode' };
      }

      // Use episode language (which was copied from podcast config during creation)
      const language = this.normalizeLanguageForAI(episode.language);
      console.log(`[POST_PROCESSING] Processing episode ${episodeId} in ${language} (episode.language: ${episode.language})`);

      // Preprocess transcript
      const processedTranscript = this.transcriptProcessor.preprocessTranscript(transcript);
      
      console.log(`[POST_PROCESSING] Generating title and summary in ${language} for episode ${episodeId}`);
      
      // Generate title and summary directly with AI service
      const { title, summary } = await this.aiService.generateTitleAndSummary(
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

      // Update episode
      await this.episodeUpdater.updateEpisodeWithSummary(
        episodeId,
        options?.skipTitleGeneration ? '' : title,
        options?.skipSummaryGeneration ? '' : summary
      );

      const updatedEpisode = { 
        id: episodeId, 
        title, 
        description: summary
      };

      // Generate image if needed
      if (!options?.skipImageGeneration) {
        await this.generateEpisodeImage(episode.podcast_id, episodeId, updatedEpisode, true);
      }

      return {
        success: true,
        message: 'Episode processed successfully',
        episode: updatedEpisode
      };
    } catch (error) {
      console.error(`[POST_PROCESSING] Error in processCompletedEpisode:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get episode by ID
   */
  private async getEpisode(episodeId: string): Promise<Episode | null> {
    try {
      return await episodesApi.getEpisodeById(episodeId);
    } catch (error) {
      console.error(`[POST_PROCESSING] Error getting episode:`, error);
      return null;
    }
  }

  /**
   * Normalize language value for AI generation
   * Convert 'hebrew'/'english' to 'Hebrew'/'English' as expected by AI service
   */
  private normalizeLanguageForAI(language?: string | null): string {
    if (!language) return 'English';
    return language === 'hebrew' ? 'Hebrew' : 'English';
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

/**
 * Create a limited post-processing service for image generation only (no S3)
 */
export function createImageOnlyService(config: {
  ai: AIServiceConfig;
}): Pick<PostProcessingService, 'generateEpisodeImagePreview' | 'generateImagePrompt'> {
  if (!config.ai) {
    throw new Error('ai config is required');
  }
  
  if (!config.ai.apiKey) {
    throw new Error('aiService is required');
  }
  
  // Create AI service
  const aiService = new AIService(config.ai);
  
  // Create a minimal service with only image preview capabilities
  return {
    async generateImagePrompt(summary: string, title?: string): Promise<string> {
      const { ImageGenerationService } = await import('./image-generation');
      const imageService = new ImageGenerationService({ aiService });
      return imageService.generateImagePrompt(summary, title);
    },
    
    async generateEpisodeImagePreview(summary: string, title?: string): Promise<{
      success: boolean;
      imageData: Buffer | null;
      mimeType: string;
      generatedFromPrompt?: string;
      error?: string;
    }> {
      try {
        const { ImageGenerationService } = await import('./image-generation');
        const imageService = new ImageGenerationService({ aiService });
        const result = await imageService.generateImagePreview(summary, title);
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
  };
}

/**
 * Create a limited post-processing service for S3 operations only (no AI)
 */
export function createS3OnlyService(config: {
  s3: S3StorageConfig;
}): Pick<PostProcessingService, 'saveGeneratedImage'> {
  if (!config.s3) {
    throw new Error('s3 config is required');
  }
  
  // Create required services
  const storageUtils = new S3StorageUtils(config.s3);
  const episodeUpdater = new EpisodeUpdater();
  
  // Create a minimal service with only S3 save capabilities
  return {
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
      try {
        console.log(`[S3_SERVICE] Saving generated image for episode ${episodeId}`);
        
        // Get the episode to save its original description
        const episode = await episodesApi.getEpisodeById(episodeId);
        
        if (!episode) {
          throw new Error('Episode not found');
        }
        
        // Upload image to S3
        const imageUrl = await storageUtils.uploadImageToS3(
          podcastId, 
          episodeId, 
          imageData, 
          mimeType
        );
        console.log(`[S3_SERVICE] Uploaded image to S3: ${imageUrl}`);
        
        // Update episode with image URL
        await episodeUpdater.updateEpisodeWithImage(
          episodeId, 
          imageUrl, 
          episode.description || undefined
        );
        
        return {
          success: true,
          imageUrl
        };
      } catch (error) {
        console.error(`[S3_SERVICE] Error saving generated image:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
  };
} 