'use server';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getEpisodeById } from '@/lib/db/api/episodes';
import { episodesApi } from '@/lib/db/api';
import { requireAdmin } from '../auth-actions';
import { parseS3Uri, verifyS3ObjectExists, createS3Client } from '@/lib/utils/s3-utils';
import { errorToString, logError } from '@/lib/utils/error-utils';
import { revalidateEpisodePaths } from '@/lib/utils/revalidation-utils';

/**
 * Generate a presigned URL for an episode's audio file
 */
export async function getEpisodeAudioUrl(episodeId: string): Promise<{ url: string; error?: string }> {
  try {
    console.log('=== Start getEpisodeAudioUrl ===');
    console.log('Episode ID:', episodeId);
    
    // Fetch episode data
    const episode = await getEpisodeById(episodeId);
    
    if (!episode) {
      console.error('Episode not found:', episodeId);
      return { 
        url: '', 
        error: 'Episode not found' 
      };
    }

    const audioUrl = episode.audio_url;
    console.log('Original audio URL:', audioUrl);
    
    // Validate audio URL exists
    if (!audioUrl) {
      console.error('Episode has no audio URL');
      return {
        url: '',
        error: 'Episode has no audio URL'
      };
    }
    
    // If URL is already in HTTPS format, return it directly
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      console.log('Returning direct HTTPS URL:', audioUrl);
      return { url: audioUrl };
    }
    
    // Parse S3 URI - note we need to await this now as it's async
    const s3UriParts = await parseS3Uri(audioUrl);
    
    if (!s3UriParts) {
      console.error('Invalid S3 URI format or parsing failed:', audioUrl);
      return { 
        url: '', 
        error: `Invalid S3 URI format: ${audioUrl}` 
      };
    }
    
    const { bucket, key } = s3UriParts;
    
    // Double check that we have both bucket and key
    if (!bucket || !key) {
      console.error('S3 URI parsed but missing bucket or key:', { bucket, key, audioUrl });
      return {
        url: '',
        error: 'S3 URI parsed but missing bucket or key'
      };
    }
    
    console.log('Parsed S3 URI - Bucket:', bucket, 'Key:', key);
    
    // Create S3 client - note we need to await this now as it's async
    const { client: s3Client, error: clientError } = await createS3Client();
    
    if (!s3Client) {
      console.error('Failed to create S3 client:', clientError);
      return {
        url: '',
        error: clientError || 'Unknown error creating S3 client'
      };
    }
    
    // Verify the object exists in S3
    console.log('Verifying object exists in S3...');
    const objectExists = await verifyS3ObjectExists(s3Client, bucket, key);
    if (!objectExists) {
      console.error('S3 object does not exist or is not accessible');
      return {
        url: '',
        error: `S3 object not found or inaccessible in bucket: ${bucket}, key: ${key}`
      };
    }
    
    // Create command to get the object
    console.log('Creating GetObjectCommand...');
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    // Generate a presigned URL that's valid for 1 hour (3600 seconds)
    console.log('Generating presigned URL...');
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    console.log('Generated presigned URL:', presignedUrl);
    
    console.log('=== End getEpisodeAudioUrl - Success ===');
    return { url: presignedUrl };
  } catch (error) {
    logError('getEpisodeAudioUrl', error);
    return {
      url: '',
      error: `Failed to generate audio URL: ${errorToString(error)}`
    };
  }
}

/**
 * Regenerates the audio for an episode
 * This is a server action that requires admin permissions
 */
export async function regenerateEpisodeAudio(episodeId: string): Promise<boolean> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Get the episode
    const episode = await episodesApi.getEpisodeById(episodeId);
    
    if (!episode) {
      throw new Error('Episode not found');
    }
    
    // Update the episode status to 'processing'
    await episodesApi.updateEpisode(episodeId, {
      status: 'processing'
    });
    
    // TODO: In a real implementation, this would trigger an async job
    // to regenerate the audio file. For now, we'll just update the status
    // and pretend it's processing.
    
    // Revalidate paths
    revalidateEpisodePaths(episodeId, episode.podcast_id);
    
    return true;
  } catch (error) {
    logError('regenerateEpisodeAudio', error);
    throw new Error(`Failed to regenerate episode audio: ${errorToString(error)}`);
  }
} 