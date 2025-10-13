/**
 * Service Interfaces - Central Export
 *
 * This module provides TypeScript interfaces for all services in the application,
 * enabling type-safe dependency injection and better testability.
 *
 * These interfaces follow the SOLID principles:
 * - Interface Segregation: Each interface is focused and minimal
 * - Dependency Inversion: Services depend on abstractions, not concrete implementations
 *
 * Usage:
 * ```typescript
 * import { IS3Service, IEmailSender } from '@/lib/services/interfaces';
 *
 * function processEpisode(s3Service: IS3Service, emailSender: IEmailSender) {
 *   // Type-safe service usage
 * }
 * ```
 */

// Storage interfaces
export type {
  IS3Service,
  S3ServiceFactory,
} from './storage.interface';

// Email interfaces
export type {
  IEmailSender,
} from './email.interface';

// Post-processing interfaces
export type {
  ITranscriptService,
  ITitleGenerationService,
  ISummaryGenerationService,
  IImageGenerationService,
  IPostProcessingOrchestrator,
  Episode,
  PostProcessingResult,
  ImagePreviewResult,
  ImageSaveResult,
} from './post-processing.interface';

// Image interfaces
export type {
  IPodcastImageEnhancer,
  IPodcastImageAnalyzer,
  IImageHandler,
  EnhancementOptions,
  SingleVariation,
  ImageAnalysis,
  EnhancementResult,
} from './image.interface';

// Telegram interfaces
export type {
  ITelegramDataService,
  TelegramMessage,
  TelegramData,
  TelegramRetryConfig,
} from './telegram.interface';

// Episode interfaces
export type {
  IEpisodeUpdater,
} from './episode.interface';

// Prompt interfaces
export type {
  IPromptGenerator,
  IPromptCleaner,
  PromptGeneratorConfig,
} from './prompt.interface';
