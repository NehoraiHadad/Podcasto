import { AIService } from '../ai';
import type { IS3Service } from './interfaces/storage.interface';
import { TranscriptProcessor } from './transcript-processor';
import { EpisodeUpdater } from './episode-updater';
import { ImageHandler } from './image-handler';
import { ImageGenerationService } from './image-generation';
import { episodesApi } from '../db/api';

export interface Episode {
  id: string;
  podcast_id?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  language?: string | null;
  [key: string]: unknown;
}

export interface PostProcessingConfig {
  s3Service: IS3Service;
  aiService: AIService;
}

/**
 * Orchestrator for post-processing podcast episodes
 */
export class PostProcessingService {
  private s3Service: IS3Service;
  private aiService: AIService;
  private transcriptProcessor: TranscriptProcessor;
  private episodeUpdater: EpisodeUpdater;
  private imageHandler: ImageHandler;

  constructor(config: PostProcessingConfig) {
    this.s3Service = config.s3Service;
    this.aiService = config.aiService;
    if (!this.aiService) throw new Error('AIService is required for PostProcessingService');
    this.transcriptProcessor = new TranscriptProcessor(this.s3Service);
    this.episodeUpdater = new EpisodeUpdater();
    const imageService = new ImageGenerationService(this.aiService);
    this.imageHandler = new ImageHandler(this.s3Service, this.episodeUpdater, imageService);
  }

  async processCompletedEpisode(
    podcastId: string,
    episodeId: string,
    options?: {
      forceReprocess?: boolean;
      skipTitleGeneration?: boolean;
      skipSummaryGeneration?: boolean;
      skipImageGeneration?: boolean;
    }
  ): Promise<{ success: boolean; message: string; episode?: Episode }> {
    try {
      const episode = await this.getEpisode(episodeId);
      if (!episode?.podcast_id) return { success: false, message: 'Episode not found' };

      const transcript = await this.s3Service.getTranscriptFromS3(
        episode.podcast_id,
        episodeId
      );
      if (!transcript) return { success: false, message: 'No transcript found for episode' };

      const language = this.normalizeLanguageForAI(episode.language);
      const processedTranscript = this.transcriptProcessor.preprocessTranscript(transcript);

      const { title, summary } = await this.aiService.generateTitleAndSummary(
        processedTranscript,
        { language, style: 'engaging', maxLength: 60 },
        { language, style: 'concise', maxLength: 150 }
      );

      await this.episodeUpdater.updateEpisodeWithSummary(
        episodeId,
        options?.skipTitleGeneration ? '' : title,
        options?.skipSummaryGeneration ? '' : summary
      );

      const updatedEpisode = { id: episodeId, title, description: summary };

      if (!options?.skipImageGeneration) {
        await this.imageHandler.generateEpisodeImage(episodeId, episode.podcast_id, summary);
      }

      return { success: true, message: 'Episode processed successfully', episode: updatedEpisode };
    } catch (error) {
      console.error(`[POST_PROCESSING] Error in processCompletedEpisode:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async generateImagePrompt(summary: string, title?: string): Promise<string> {
    return this.imageHandler.generateImagePrompt(summary, title);
  }

  async generateEpisodeImagePreview(
    summary: string,
    title?: string
  ): Promise<{
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
        generatedFromPrompt: result.generatedFromPrompt,
      };
    } catch (error) {
      return {
        success: false,
        imageData: null,
        mimeType: 'image/jpeg',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async saveGeneratedImage(
    podcastId: string,
    episodeId: string,
    imageData: Buffer,
    mimeType: string,
    _episode: Episode,
    _generatedFromPrompt?: string
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    return this.imageHandler.saveGeneratedImage(episodeId, podcastId, imageData, mimeType);
  }

  async generateEpisodeImage(
    podcastId: string,
    episodeId: string,
    episodeOrDescription: Episode | string,
    _force = false
  ): Promise<boolean> {
    const description =
      typeof episodeOrDescription === 'string'
        ? episodeOrDescription
        : episodeOrDescription.description || '';
    return this.imageHandler.generateEpisodeImage(episodeId, podcastId, description);
  }

  private async getEpisode(episodeId: string): Promise<Episode | null> {
    try {
      return await episodesApi.getEpisodeById(episodeId);
    } catch (error) {
      console.error(`[POST_PROCESSING] Error getting episode:`, error);
      return null;
    }
  }

  private normalizeLanguageForAI(language?: string | null): string {
    return !language ? 'English' : language === 'hebrew' ? 'Hebrew' : 'English';
  }
}

export {
  createPostProcessingService,
  createImageOnlyService,
  createS3OnlyService,
} from './post-processing-factory';
