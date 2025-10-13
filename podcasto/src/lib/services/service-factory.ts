/**
 * Service Factory - Central Dependency Injection Container
 *
 * This factory creates service instances with proper dependency injection,
 * ensuring services depend on interfaces rather than concrete implementations.
 *
 * Usage:
 * ```typescript
 * // Create individual services
 * const s3Service = createS3ServiceInstance();
 * const emailService = createEmailServiceInstance(s3Service);
 *
 * // Or create all services at once
 * const services = createAllServices();
 * services.s3Service.uploadFile(...);
 * ```
 */

import { AIService, type AIServiceConfig } from '../ai';
import { S3Service, type S3ServiceConfig } from './s3-service';
import { EpisodeUpdater } from './episode-updater';
import { TitleGenerationService } from './title-generation';
import { SummaryGenerationService } from './summary-generation';
import { ImageGenerationService } from './image-generation';
import { TranscriptProcessor } from './transcript-processor';
import { TelegramDataService } from './telegram-data-service';
import { PodcastImageAnalyzer } from './podcast-image-analyzer';
import { PodcastImageEnhancer } from './podcast-image-enhancer';
import type {
  IS3Service,
  IEpisodeUpdater,
  ITitleGenerationService,
  ISummaryGenerationService,
  IImageGenerationService,
  ITranscriptService,
  ITelegramDataService,
  IPodcastImageAnalyzer,
  IPodcastImageEnhancer,
} from './interfaces';

/**
 * Configuration for service factory
 */
export interface ServiceFactoryConfig {
  s3?: Partial<S3ServiceConfig>;
  ai?: AIServiceConfig;
  telegramBucketName?: string;
}

/**
 * Complete service collection returned by createAllServices
 */
export interface ServiceCollection {
  s3Service: IS3Service;
  episodeUpdater: IEpisodeUpdater;
  transcriptService: ITranscriptService;
  telegramDataService: ITelegramDataService;
  aiService?: AIService;
  titleService?: ITitleGenerationService;
  summaryService?: ISummaryGenerationService;
  imageService?: IImageGenerationService;
  imageAnalyzer?: IPodcastImageAnalyzer;
  imageEnhancer?: IPodcastImageEnhancer;
}

/**
 * Creates an S3 service instance
 *
 * @param config - Optional S3 configuration
 * @returns IS3Service interface implementation
 */
export function createS3ServiceInstance(config?: Partial<S3ServiceConfig>): IS3Service {
  return new S3Service(config);
}

/**
 * Creates an EpisodeUpdater service instance
 *
 * @returns IEpisodeUpdater interface implementation
 */
export function createEpisodeUpdaterInstance(): IEpisodeUpdater {
  return new EpisodeUpdater();
}

/**
 * Creates a TranscriptProcessor service instance
 *
 * @param s3Service - The S3 service to use for transcript retrieval
 * @returns ITranscriptService interface implementation
 */
export function createTranscriptProcessorInstance(s3Service: IS3Service): ITranscriptService {
  if (!s3Service) {
    throw new Error('s3Service is required for TranscriptProcessor');
  }
  return new TranscriptProcessor(s3Service);
}

/**
 * Creates a TelegramDataService instance
 *
 * @param bucketName - Optional S3 bucket name
 * @returns ITelegramDataService interface implementation
 */
export function createTelegramDataServiceInstance(bucketName?: string): ITelegramDataService {
  return new TelegramDataService(bucketName);
}

/**
 * Creates a TitleGenerationService instance
 *
 * @param aiService - The AI service to use for title generation
 * @returns ITitleGenerationService interface implementation
 */
export function createTitleGenerationServiceInstance(
  aiService: AIService
): ITitleGenerationService {
  if (!aiService) {
    throw new Error('aiService is required for TitleGenerationService');
  }
  return new TitleGenerationService(aiService);
}

/**
 * Creates a SummaryGenerationService instance
 *
 * @param aiService - The AI service to use for summary generation
 * @returns ISummaryGenerationService interface implementation
 */
export function createSummaryGenerationServiceInstance(
  aiService: AIService
): ISummaryGenerationService {
  if (!aiService) {
    throw new Error('aiService is required for SummaryGenerationService');
  }
  return new SummaryGenerationService(aiService);
}

/**
 * Creates an ImageGenerationService instance
 *
 * @param aiService - The AI service to use for image generation
 * @returns IImageGenerationService interface implementation
 */
export function createImageGenerationServiceInstance(
  aiService: AIService
): IImageGenerationService {
  if (!aiService) {
    throw new Error('aiService is required for ImageGenerationService');
  }
  return new ImageGenerationService(aiService);
}

/**
 * Creates a PodcastImageAnalyzer instance
 *
 * @param apiKey - Gemini API key
 * @returns IPodcastImageAnalyzer interface implementation
 */
export function createPodcastImageAnalyzerInstance(apiKey: string): IPodcastImageAnalyzer {
  if (!apiKey) {
    throw new Error('apiKey is required for PodcastImageAnalyzer');
  }
  return new PodcastImageAnalyzer(apiKey);
}

/**
 * Creates a PodcastImageEnhancer instance
 *
 * @param apiKey - Gemini API key
 * @param analyzer - The image analyzer service
 * @returns IPodcastImageEnhancer interface implementation
 */
export function createPodcastImageEnhancerInstance(
  apiKey: string,
  analyzer: IPodcastImageAnalyzer
): IPodcastImageEnhancer {
  if (!apiKey) {
    throw new Error('apiKey is required for PodcastImageEnhancer');
  }
  if (!analyzer) {
    throw new Error('analyzer is required for PodcastImageEnhancer');
  }
  return new PodcastImageEnhancer(apiKey, analyzer);
}

/**
 * Creates all services with proper dependency injection
 *
 * This is a convenience function that sets up the complete service dependency graph.
 * Services that require AI configuration will only be created if AI config is provided.
 *
 * @param config - Optional configuration for services
 * @returns Complete service collection with all dependencies properly injected
 *
 * @example
 * ```typescript
 * // Create all services with default config
 * const services = createAllServices();
 *
 * // Create with custom config
 * const services = createAllServices({
 *   s3: { bucket: 'my-bucket', region: 'us-west-2' },
 *   ai: { apiKey: 'my-api-key' }
 * });
 *
 * // Use services
 * await services.s3Service.uploadFile(...);
 * await services.titleService?.generateTitle(...);
 * ```
 */
export function createAllServices(config?: ServiceFactoryConfig): ServiceCollection {
  // Create foundational services (no dependencies)
  const s3Service = createS3ServiceInstance(config?.s3);
  const episodeUpdater = createEpisodeUpdaterInstance();

  // Create S3-dependent services
  const transcriptService = createTranscriptProcessorInstance(s3Service);
  const telegramDataService = createTelegramDataServiceInstance(
    config?.telegramBucketName || config?.s3?.bucket
  );

  // Create AI service if config provided
  let aiService: AIService | undefined;
  let titleService: ITitleGenerationService | undefined;
  let summaryService: ISummaryGenerationService | undefined;
  let imageService: IImageGenerationService | undefined;
  let imageAnalyzer: IPodcastImageAnalyzer | undefined;
  let imageEnhancer: IPodcastImageEnhancer | undefined;

  if (config?.ai?.apiKey) {
    aiService = new AIService(config.ai);

    // Create AI-dependent services
    titleService = createTitleGenerationServiceInstance(aiService);
    summaryService = createSummaryGenerationServiceInstance(aiService);
    imageService = createImageGenerationServiceInstance(aiService);

    // Create image analysis services
    imageAnalyzer = createPodcastImageAnalyzerInstance(config.ai.apiKey);
    imageEnhancer = createPodcastImageEnhancerInstance(config.ai.apiKey, imageAnalyzer);
  }

  return {
    s3Service,
    episodeUpdater,
    transcriptService,
    telegramDataService,
    aiService,
    titleService,
    summaryService,
    imageService,
    imageAnalyzer,
    imageEnhancer,
  };
}

/**
 * Creates a minimal service collection for S3 operations only
 *
 * @param config - Optional S3 configuration
 * @returns Service collection with S3-related services only
 */
export function createS3Services(config?: Partial<S3ServiceConfig>) {
  const s3Service = createS3ServiceInstance(config);
  const transcriptService = createTranscriptProcessorInstance(s3Service);
  const telegramDataService = createTelegramDataServiceInstance(config?.bucket);

  return {
    s3Service,
    transcriptService,
    telegramDataService,
  };
}

/**
 * Creates AI-dependent services only
 *
 * @param aiConfig - AI service configuration
 * @returns Service collection with AI-related services only
 */
export function createAIServices(aiConfig: AIServiceConfig) {
  if (!aiConfig.apiKey) {
    throw new Error('AI API key is required');
  }

  const aiService = new AIService(aiConfig);
  const titleService = createTitleGenerationServiceInstance(aiService);
  const summaryService = createSummaryGenerationServiceInstance(aiService);
  const imageService = createImageGenerationServiceInstance(aiService);
  const imageAnalyzer = createPodcastImageAnalyzerInstance(aiConfig.apiKey);
  const imageEnhancer = createPodcastImageEnhancerInstance(aiConfig.apiKey, imageAnalyzer);

  return {
    aiService,
    titleService,
    summaryService,
    imageService,
    imageAnalyzer,
    imageEnhancer,
  };
}
