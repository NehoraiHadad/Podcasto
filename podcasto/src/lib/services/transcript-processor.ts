import type { IS3Service, ITranscriptService } from './interfaces';

/**
 * Service for handling podcast transcript processing
 */
export class TranscriptProcessor implements ITranscriptService {
  private s3Service: IS3Service;

  /**
   * Initialize the transcript processor with dependency injection
   *
   * @param s3Service - The S3 service to use for transcript retrieval
   */
  constructor(s3Service: IS3Service) {
    if (!s3Service) {
      throw new Error('S3Service is required for TranscriptProcessor');
    }
    this.s3Service = s3Service;
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
        transcript = await this.s3Service.getTranscriptFromS3(podcastId, episodeId);
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
 * Factory function to create a TranscriptProcessor
 *
 * @param s3Service - The S3 service instance to inject
 * @returns ITranscriptService interface implementation
 */
export function createTranscriptProcessor(s3Service: IS3Service): ITranscriptService {
  if (!s3Service) {
    throw new Error('s3Service is required');
  }
  return new TranscriptProcessor(s3Service);
} 