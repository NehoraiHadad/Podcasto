import { S3StorageUtils } from './storage-utils';

/**
 * Utilities for handling podcast transcript processing
 */
export class TranscriptProcessor {
  private storageUtils: S3StorageUtils;

  /**
   * Initialize the transcript processor
   */
  constructor(storageUtils: S3StorageUtils) {
    this.storageUtils = storageUtils;
  }

  /**
   * Get transcript for an episode with retry logic
   */
  async getTranscriptWithRetry(
    podcastId: string, 
    episodeId: string,
    maxRetries: number = 3
  ): Promise<string> {
    let transcript: string | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        transcript = await this.storageUtils.getTranscriptFromS3(podcastId, episodeId);
        if (transcript) break;
        
        console.warn(`[TRANSCRIPT_PROCESSOR] Attempt ${attempt + 1}/${maxRetries} failed to retrieve transcript, retrying...`);
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      } catch (transcriptError) {
        console.error(`[TRANSCRIPT_PROCESSOR] Error in transcript retrieval attempt ${attempt + 1}:`, transcriptError);
        
        if (attempt === maxRetries - 1) {
          // Last attempt failed
          throw new Error(`Failed to retrieve transcript after ${maxRetries} attempts: ${transcriptError}`);
        }
      }
    }
    
    if (!transcript) {
      throw new Error(`Failed to retrieve transcript for episode ${episodeId} after multiple attempts`);
    }

    // Pre-process transcript for better AI processing
    return this.preprocessTranscript(transcript);
  }

  /**
   * Preprocess transcript for better AI analysis
   */
  preprocessTranscript(transcript: string, maxLength: number = 15000): string {
    // Remove redundant whitespace
    let processed = transcript.replace(/\s+/g, ' ').replace(/ \n/g, '\n').replace(/\n /g, '\n');
    
    // Limit length to avoid token limits (if needed)
    if (processed.length > maxLength) {
      console.warn(`[TRANSCRIPT_PROCESSOR] Truncating transcript from ${processed.length} to ${maxLength} chars`);
      processed = processed.substring(0, maxLength) + '...';
    }
    
    return processed;
  }
}

/**
 * Create a transcript processor with the specified storage utils
 */
export function createTranscriptProcessor(storageUtils: S3StorageUtils): TranscriptProcessor {
  return new TranscriptProcessor(storageUtils);
} 