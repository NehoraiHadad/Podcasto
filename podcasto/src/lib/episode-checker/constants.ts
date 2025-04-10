// Status constants for episodes
export const PENDING_STATUS = 'pending';
export const COMPLETED_STATUS = 'completed'; // Audio generated, awaiting post-processing
export const SUMMARY_COMPLETED_STATUS = 'summary_completed'; // Post-processing (e.g., transcription, summarization) completed
export const FAILED_STATUS = 'failed';
export const PROCESSED_STATUS = 'processed'; // Post-processing (e.g., transcription, summarization) completed

// Time constants (in milliseconds)
export const MAX_PENDING_TIME_MS = 30 * 60 * 1000; // 30 minutes 