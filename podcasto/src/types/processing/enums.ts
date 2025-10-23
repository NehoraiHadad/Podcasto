/**
 * Processing stage and status enumerations
 */

/**
 * All possible processing stages an episode can go through
 */
export enum ProcessingStage {
  CREATED = 'created',
  TELEGRAM_QUEUED = 'telegram_queued',
  TELEGRAM_PROCESSING = 'telegram_processing',
  TELEGRAM_COMPLETED = 'telegram_completed',
  TELEGRAM_FAILED = 'telegram_failed',
  SCRIPT_QUEUED = 'script_queued',
  SCRIPT_PROCESSING = 'script_processing',
  SCRIPT_COMPLETED = 'script_completed',
  SCRIPT_FAILED = 'script_failed',
  AUDIO_QUEUED = 'audio_queued',
  AUDIO_PROCESSING = 'audio_processing',
  AUDIO_COMPLETED = 'audio_completed',
  AUDIO_FAILED = 'audio_failed',
  IMAGE_PROCESSING = 'image_processing',
  IMAGE_FAILED = 'image_failed',
  POST_PROCESSING = 'post_processing',
  PUBLISHED = 'published',
  FAILED = 'failed'
}

/**
 * Status of a processing stage
 */
export enum StageStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
