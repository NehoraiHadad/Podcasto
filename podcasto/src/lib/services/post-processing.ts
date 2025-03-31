import { createAIService, AIServiceConfig } from '../ai';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { episodesApi } from '../db/api';
import { randomUUID } from 'crypto';

/**
 * Configuration for post-processing service
 */
export interface PostProcessingConfig {
  s3: {
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  ai: AIServiceConfig;
}

/**
 * Service for post-processing podcast episodes
 */
export class PostProcessingService {
  private s3Client: S3Client;
  private aiService;
  private s3Bucket: string;

  /**
   * Create a new post-processing service
   */
  constructor(config: PostProcessingConfig) {
    // Initialize S3 client
    this.s3Client = new S3Client({
      region: config.s3.region,
      credentials: {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      },
    });
    
    this.s3Bucket = config.s3.bucket;
    
    // Initialize AI service
    this.aiService = createAIService(config.ai);
  }

  /**
   * Process a completed episode
   */
  async processCompletedEpisode(episode: {
    id: string;
    podcast_id: string;
    metadata?: string | null;
  }): Promise<boolean> {
    try {
      console.log(`[POST_PROCESSING] Processing episode ${episode.id}`);
      
      // 1. Parse metadata to get S3 paths
      const metadata = this.parseEpisodeMetadata(episode.metadata);
      if (!metadata || !metadata.s3_key) {
        console.warn(`[POST_PROCESSING] Missing S3 key in metadata for episode ${episode.id}, trying to continue without it`);
      }
      
      // 2. Get the transcript file from S3 with retry logic
      let transcript: string | null = null;
      const maxRetries = 3;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          transcript = await this.getTranscriptFromS3(episode.podcast_id, episode.id);
          if (transcript) break;
          
          console.warn(`[POST_PROCESSING] Attempt ${attempt + 1}/${maxRetries} failed to retrieve transcript, retrying...`);
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        } catch (transcriptError) {
          console.error(`[POST_PROCESSING] Error in transcript retrieval attempt ${attempt + 1}:`, transcriptError);
          
          if (attempt === maxRetries - 1) {
            // Last attempt failed
            throw new Error(`Failed to retrieve transcript after ${maxRetries} attempts: ${transcriptError}`);
          }
        }
      }
      
      if (!transcript) {
        throw new Error(`Failed to retrieve transcript for episode ${episode.id} after multiple attempts`);
      }

      // 3. Pre-process transcript for better AI processing
      const processedTranscript = this.preprocessTranscript(transcript);
      console.log(`[POST_PROCESSING] Successfully retrieved and processed transcript (${processedTranscript.length} chars)`);
      
      // 4. Generate title and summary
      const { title, summary } = await this.aiService.generateTitleAndSummary(processedTranscript);
      console.log(`[POST_PROCESSING] Generated title: "${title}"`);
      console.log(`[POST_PROCESSING] Generated summary (${summary.length} chars)`);
      
      // 5. Update episode with title and summary
      await episodesApi.updateEpisode(episode.id, {
        title,
        description: summary,
        status: 'summary_completed' // New intermediate status
      });
      
      // 6. Trigger async image generation instead of generating it inline
      // This will be handled by a separate API route
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const apiUrl = new URL(`/api/episodes/${episode.id}/generate-image`, baseUrl).toString();
      
      // Fire and forget - we don't wait for the response
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        },
        body: JSON.stringify({ summary })
      }).catch(error => {
        console.error(`[POST_PROCESSING] Failed to trigger image generation for episode ${episode.id}:`, error);
      });
      
      console.log(`[POST_PROCESSING] Successfully processed episode ${episode.id} and triggered image generation`);
      return true;
    } catch (error) {
      console.error(`[POST_PROCESSING] Error processing episode ${episode.id}:`, error);
      
      // Try to mark the episode as failed
      try {
        await episodesApi.updateEpisode(episode.id, {
          status: 'failed',
          description: `Processing failed: ${error instanceof Error ? error.message : String(error)}`
        });
      } catch (updateError) {
        console.error(`[POST_PROCESSING] Failed to update episode status after error:`, updateError);
      }
      
      return false;
    }
  }

  /**
   * Generate image for an episode
   */
  async generateEpisodeImage(episodeId: string, podcastId: string, summary: string): Promise<boolean> {
    try {
      console.log(`[POST_PROCESSING] Generating image for episode ${episodeId}`);
      
      // Generate image based on summary
      const imageResult = await this.aiService.generateImage(summary);
      
      // Upload image to S3 if available
      if (imageResult.imageData) {
        const imageUrl = await this.uploadImageToS3(
          podcastId, 
          episodeId, 
          imageResult.imageData, 
          imageResult.mimeType
        );
        console.log(`[POST_PROCESSING] Generated and uploaded image: ${imageUrl}`);
        
        // Update episode with image URL
        await episodesApi.updateEpisode(episodeId, {
          cover_image: imageUrl,
          status: 'processed' // Final status
        });
        
        return true;
      } else {
        console.warn(`[POST_PROCESSING] No image was generated for episode ${episodeId}`);
        
        // Mark as processed even without image
        await episodesApi.updateEpisode(episodeId, {
          status: 'processed' // Final status
        });
        
        return false;
      }
    } catch (error) {
      console.error(`[POST_PROCESSING] Error generating image for episode ${episodeId}:`, error);
      
      // Update episode status but don't mark as failed - the summary is still valid
      try {
        await episodesApi.updateEpisode(episodeId, {
          status: 'processed', // Still mark as processed, just without image
          description: `Image generation failed: ${error instanceof Error ? error.message : String(error)}`
        });
      } catch (updateError) {
        console.error(`[POST_PROCESSING] Failed to update episode status after image error:`, updateError);
      }
      
      return false;
    }
  }

  /**
   * Parse episode metadata
   */
  private parseEpisodeMetadata(metadataStr?: string | null): Record<string, unknown> | null {
    if (!metadataStr) return null;
    
    try {
      return JSON.parse(metadataStr);
    } catch (error) {
      console.error('[POST_PROCESSING] Error parsing episode metadata:', error);
      return null;
    }
  }

  /**
   * Get transcript file from S3
   */
  private async getTranscriptFromS3(podcastId: string, episodeId: string): Promise<string | null> {
    try {
      // Construct the transcript file path
      const transcriptPrefix = `podcasts/${podcastId}/${episodeId}/transcripts/`;
      
      // List all objects in the transcripts directory
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      const listCommand = new ListObjectsV2Command({
        Bucket: this.s3Bucket,
        Prefix: transcriptPrefix,
      });
      
      const listResponse = await this.s3Client.send(listCommand);
      
      // Check if any files were found
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.error(`[POST_PROCESSING] No transcript files found for episode ${episodeId}`);
        return null;
      }
      
      // Filter only txt files
      const transcriptFiles = listResponse.Contents
        .filter(file => file.Key && file.Key.endsWith('.txt'))
        .map(file => ({
          key: file.Key!,
          filename: file.Key!.split('/').pop() || '',
          lastModified: file.LastModified || new Date(0)
        }));
      
      if (transcriptFiles.length === 0) {
        console.error(`[POST_PROCESSING] No .txt transcript files found for episode ${episodeId}`);
        return null;
      }
      
      // Sort files by LastModified date (or by name if dates are the same)
      transcriptFiles.sort((a, b) => {
        // If timestamp difference is less than 1 second, sort by name
        if (Math.abs(a.lastModified.getTime() - b.lastModified.getTime()) < 1000) {
          return a.filename.localeCompare(b.filename);
        }
        return a.lastModified.getTime() - b.lastModified.getTime();
      });
      
      console.log(`[POST_PROCESSING] Found ${transcriptFiles.length} transcript files, processing in order`);
      
      // Combine transcript files in order
      let combinedTranscript = '';
      
      for (let i = 0; i < transcriptFiles.length; i++) {
        const file = transcriptFiles[i];
        const getCommand = new GetObjectCommand({
          Bucket: this.s3Bucket,
          Key: file.key,
        });
        
        const response = await this.s3Client.send(getCommand);
        const fileContent = await response.Body?.transformToString();
        
        if (fileContent) {
          console.log(`[POST_PROCESSING] Retrieved transcript file ${i+1}/${transcriptFiles.length}: ${file.filename}`);
          
          // Add a separator between files if we already have content
          if (combinedTranscript) {
            combinedTranscript += '\n\n';
          }
          combinedTranscript += fileContent;
        }
      }
      
      if (!combinedTranscript) {
        console.error(`[POST_PROCESSING] No transcript content found for episode ${episodeId}`);
        return null;
      }
      
      return combinedTranscript;
    } catch (error) {
      console.error('[POST_PROCESSING] Error retrieving transcripts from S3:', error);
      return null;
    }
  }

  /**
   * Upload episode image to S3
   */
  private async uploadImageToS3(
    podcastId: string, 
    episodeId: string, 
    imageData: Buffer,
    mimeType: string
  ): Promise<string> {
    // Generate a unique filename
    const extension = mimeType.split('/')[1] || 'jpg';
    const filename = `cover-${randomUUID()}.${extension}`;
    
    // Construct the image path
    const imageKey = `podcasts/${podcastId}/${episodeId}/images/${filename}`;
    
    // Upload the image
    const command = new PutObjectCommand({
      Bucket: this.s3Bucket,
      Key: imageKey,
      Body: imageData,
      ContentType: mimeType,
    });
    
    await this.s3Client.send(command);
    
    // Return the public URL
    return `https://${this.s3Bucket}.s3.amazonaws.com/${imageKey}`;
  }

  /**
   * Preprocess transcript for better AI analysis
   */
  private preprocessTranscript(transcript: string): string {
    // Remove redundant whitespace
    let processed = transcript.replace(/\s+/g, ' ').replace(/ \n/g, '\n').replace(/\n /g, '\n');
    
    // Limit length to avoid token limits (if needed)
    const maxLength = 15000;
    if (processed.length > maxLength) {
      console.warn(`[POST_PROCESSING] Truncating transcript from ${processed.length} to ${maxLength} chars`);
      processed = processed.substring(0, maxLength) + '...';
    }
    
    return processed;
  }
}

/**
 * Create a post-processing service with the specified configuration
 */
export function createPostProcessingService(config: PostProcessingConfig): PostProcessingService {
  return new PostProcessingService(config);
} 