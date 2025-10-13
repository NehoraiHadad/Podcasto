/**
 * Post-Processing Interfaces - Central Export
 * Re-exports all post-processing related interfaces from split modules
 *
 * This file maintains backward compatibility while keeping individual
 * interface files under 150 lines as per project standards.
 */

// Re-export types
export type {
  Episode,
  PostProcessingResult,
  ImagePreviewResult,
  ImageSaveResult,
} from './post-processing-types.interface';

// Re-export service interfaces
export type {
  ITranscriptService,
  ITitleGenerationService,
  ISummaryGenerationService,
  IImageGenerationService,
} from './post-processing-services.interface';

// Re-export orchestrator interface
export type {
  IPostProcessingOrchestrator,
} from './post-processing-orchestrator.interface';
