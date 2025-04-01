import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * Utilities for handling transcript file operations
 */
export class TranscriptFileUtils {
  private s3Client: S3Client;
  private s3Bucket: string;

  /**
   * Initialize transcript file utilities
   */
  constructor(s3Client: S3Client, s3Bucket: string) {
    this.s3Client = s3Client;
    this.s3Bucket = s3Bucket;
  }

  /**
   * Find and combine transcript files from S3
   */
  async getTranscriptsFromS3(podcastId: string, episodeId: string): Promise<string | null> {
    try {
      // Construct the transcript file path
      const transcriptPrefix = `podcasts/${podcastId}/${episodeId}/transcripts/`;
      
      // List all objects in the transcripts directory
      const listCommand = new ListObjectsV2Command({
        Bucket: this.s3Bucket,
        Prefix: transcriptPrefix,
      });
      
      const listResponse = await this.s3Client.send(listCommand);
      
      // Check if any files were found
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        console.error(`[TRANSCRIPT_UTILS] No transcript files found for episode ${episodeId}`);
        return null;
      }
      
      // Filter only txt files
      const transcriptFiles = this.filterAndSortTranscriptFiles(listResponse.Contents);
      
      if (transcriptFiles.length === 0) {
        console.error(`[TRANSCRIPT_UTILS] No .txt transcript files found for episode ${episodeId}`);
        return null;
      }
      
      console.log(`[TRANSCRIPT_UTILS] Found ${transcriptFiles.length} transcript files, processing in order`);
      
      // Combine transcript files in order
      return await this.combineTranscriptFiles(transcriptFiles);
    } catch (error) {
      console.error('[TRANSCRIPT_UTILS] Error retrieving transcripts from S3:', error);
      return null;
    }
  }
  
  /**
   * Filter transcript files and sort them appropriately
   */
  private filterAndSortTranscriptFiles(files: { Key?: string; LastModified?: Date }[]): Array<{
    key: string;
    filename: string;
    lastModified: Date;
  }> {
    const transcriptFiles = files
      .filter(file => file.Key && file.Key.endsWith('.txt'))
      .map(file => ({
        key: file.Key!,
        filename: file.Key!.split('/').pop() || '',
        lastModified: file.LastModified || new Date(0)
      }));
      
    // Sort files by LastModified date (or by name if dates are the same)
    transcriptFiles.sort((a, b) => {
      // If timestamp difference is less than 1 second, sort by name
      if (Math.abs(a.lastModified.getTime() - b.lastModified.getTime()) < 1000) {
        return a.filename.localeCompare(b.filename);
      }
      return a.lastModified.getTime() - b.lastModified.getTime();
    });
    
    return transcriptFiles;
  }
  
  /**
   * Combine multiple transcript files from S3 into one text
   */
  private async combineTranscriptFiles(
    files: Array<{ key: string; filename: string; lastModified: Date }>
  ): Promise<string | null> {
    let combinedTranscript = '';
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const getCommand = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: file.key,
      });
      
      const response = await this.s3Client.send(getCommand);
      const fileContent = await response.Body?.transformToString();
      
      if (fileContent) {
        console.log(`[TRANSCRIPT_UTILS] Retrieved transcript file ${i+1}/${files.length}: ${file.filename}`);
        
        // Add a separator between files if we already have content
        if (combinedTranscript) {
          combinedTranscript += '\n\n';
        }
        combinedTranscript += fileContent;
      }
    }
    
    if (!combinedTranscript) {
      console.error(`[TRANSCRIPT_UTILS] No transcript content found from retrieved files`);
      return null;
    }
    
    return combinedTranscript;
  }
}

/**
 * Create transcript file utilities
 */
export function createTranscriptFileUtils(s3Client: S3Client, s3Bucket: string): TranscriptFileUtils {
  return new TranscriptFileUtils(s3Client, s3Bucket);
} 