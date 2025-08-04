// Status constants for episodes
export const PENDING_STATUS = 'pending';
export const CONTENT_COLLECTED_STATUS = 'content_collected';
export const SCRIPT_READY_STATUS = 'script_ready';
export const AUDIO_PROCESSING_STATUS = 'audio_processing';
export const COMPLETED_STATUS = 'completed'; // Audio generated, awaiting post-processing
export const SUMMARY_COMPLETED_STATUS = 'summary_completed'; // Post-processing (e.g., transcription, summarization) completed
export const FAILED_STATUS = 'failed';
export const PROCESSED_STATUS = 'processed'; // Post-processing completed (legacy status)
export const PUBLISHED_STATUS = 'published'; // Episode fully completed and published

// Time constants (in milliseconds)
export const MAX_PENDING_TIME_MS = 30 * 60 * 1000; // 30 minutes 