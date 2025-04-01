'use server';

import { getEpisodeById } from '../db/api/episodes';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { episodesApi } from '@/lib/db/api';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from './auth-actions';

/**
 * Parse an S3 URI into bucket and key components
 */
function parseS3Uri(s3Uri: string): { bucket: string; key: string } | null {
  if (!s3Uri.startsWith('s3://')) {
    return null;
  }

  try {
    // Remove s3:// prefix and split by first /
    const withoutProtocol = s3Uri.substring(5);
    const firstSlashIndex = withoutProtocol.indexOf('/');
    
    if (firstSlashIndex === -1) {
      return null;
    }
    
    const bucket = withoutProtocol.substring(0, firstSlashIndex);
    const key = withoutProtocol.substring(firstSlashIndex + 1);
    
    return { bucket, key };
  } catch (error) {
    console.error('Error parsing S3 URI:', error);
    return null;
  }
}

/**
 * Try to verify if an S3 object exists before generating a URL
 */
async function verifyS3ObjectExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    console.log(`Attempting to verify S3 object exists - Bucket: ${bucket}, Key: ${key}`);
    
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    
    console.log('Sending HeadObjectCommand...');
    const response = await client.send(command);
    console.log('HeadObjectCommand response:', JSON.stringify(response));
    return true;
  } catch (error) {
    console.error(`Error verifying S3 object in bucket ${bucket} with key ${key}:`, error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    return false;
  }
}

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
    
    // If URL is already in HTTPS format, return it directly
    if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
      console.log('Returning direct HTTPS URL:', audioUrl);
      return { url: audioUrl };
    }
    
    // Parse S3 URI
    const s3UriParts = parseS3Uri(audioUrl);
    
    if (!s3UriParts) {
      console.error('Invalid S3 URI format:', audioUrl);
      return { 
        url: audioUrl, 
        error: 'Invalid S3 URI format'
      };
    }
    
    const { bucket, key } = s3UriParts;
    console.log('Parsed S3 URI - Bucket:', bucket, 'Key:', key);
    
    // Get AWS config from environment variables
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    // Log config (without secret key)
    console.log('AWS Config - Region:', region);
    console.log('Access Key ID:', accessKeyId ? accessKeyId.substring(0, 5) + '...' : "Missing");
    console.log('Secret Access Key:', secretAccessKey ? "Configured (length: " + secretAccessKey.length + ")" : "Missing");
    
    if (!region || !accessKeyId || !secretAccessKey) {
      console.error('Missing AWS configuration');
      return {
        url: '',
        error: `Missing AWS configuration: ${!region ? 'region' : ''} ${!accessKeyId ? 'accessKeyId' : ''} ${!secretAccessKey ? 'secretAccessKey' : ''}`
      };
    }
    
    // Create S3 client
    console.log('Creating S3 client with region:', region);
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
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
    console.error('=== Error getting episode audio URL ===');
    console.error(error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    return {
      url: '',
      error: `Failed to generate audio URL: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Deletes an episode
 * This is a server action that requires admin permissions
 */
export async function deleteEpisode(episodeId: string): Promise<boolean> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Delete the episode from the database
    const success = await episodesApi.deleteEpisode(episodeId);
    
    if (success) {
      // Revalidate the episodes page and any specific episode page
      revalidatePath('/admin/episodes');
      revalidatePath(`/admin/episodes/${episodeId}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error deleting episode:', error);
    throw new Error('Failed to delete episode');
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
    
    // Revalidate the episodes page and the specific episode page
    revalidatePath('/admin/episodes');
    revalidatePath(`/admin/episodes/${episodeId}`);
    
    return true;
  } catch (error) {
    console.error('Error regenerating episode audio:', error);
    throw new Error('Failed to regenerate episode audio');
  }
}

/**
 * Updates an episode's details
 * This is a server action that requires admin permissions
 */
export async function updateEpisodeDetails(
  episodeId: string,
  data: {
    title?: string;
    description?: string;
    language?: string;
    status?: string;
  }
): Promise<Awaited<ReturnType<typeof episodesApi.updateEpisode>>> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Update the episode
    const updatedEpisode = await episodesApi.updateEpisode(episodeId, data);
    
    if (updatedEpisode) {
      // Revalidate relevant paths
      revalidatePath('/admin/episodes');
      revalidatePath(`/admin/episodes/${episodeId}`);
      
      // If the episode belongs to a podcast, revalidate that path too
      if (updatedEpisode.podcast_id) {
        revalidatePath(`/admin/podcasts/${updatedEpisode.podcast_id}`);
      }
    }
    
    return updatedEpisode;
  } catch (error) {
    console.error('Error updating episode:', error);
    throw new Error('Failed to update episode');
  }
}

/**
 * Manually generate an image for an episode based on its description
 * This is a server action that requires admin permissions
 */
export async function generateEpisodeImage(episodeId: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Get the episode
    const episode = await episodesApi.getEpisodeById(episodeId);
    
    if (!episode) {
      throw new Error('Episode not found');
    }
    
    if (!episode.podcast_id) {
      throw new Error('Episode has no associated podcast');
    }
    
    if (!episode.description) {
      throw new Error('Episode has no description for image generation');
    }
    
    // Import required modules
    const { createPostProcessingService } = await import('@/lib/services/post-processing');
    
    // Initialize post-processing service
    const s3Region = process.env.AWS_REGION;
    const s3Bucket = process.env.S3_BUCKET_NAME;
    const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const aiApiKey = process.env.GEMINI_API_KEY;
    
    // Check if required environment variables are available
    if (!s3Region || !s3Bucket || !s3AccessKeyId || !s3SecretAccessKey || !aiApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    // Create post-processing service
    const postProcessingService = createPostProcessingService({
      s3: {
        region: s3Region,
        bucket: s3Bucket,
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
      ai: {
        provider: 'gemini',
        apiKey: aiApiKey,
      },
    });
    
    // Generate the image
    const success = await postProcessingService.generateEpisodeImage(
      episodeId,
      episode.podcast_id,
      episode.description
    );
    
    if (success) {
      // Refresh the episode data to get the updated cover_image URL
      const updatedEpisode = await episodesApi.getEpisodeById(episodeId);
      
      // Revalidate the episodes page and the specific episode page
      revalidatePath('/admin/episodes');
      revalidatePath(`/admin/episodes/${episodeId}`);
      
      return { 
        success: true,
        imageUrl: updatedEpisode?.cover_image || undefined
      };
    } else {
      return { 
        success: false,
        error: 'Failed to generate image'
      };
    }
  } catch (error) {
    console.error('Error generating episode image:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Generate a preview image for an episode based on its description without saving it
 * This is a server action that requires admin permissions
 */
export async function generateEpisodeImagePreview(
  episodeId: string
): Promise<{ 
  success: boolean; 
  imageDataUrl?: string; 
  error?: string;
  episodeDescription?: string;
  generatedFromPrompt?: string;
}> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Get the episode
    const episode = await episodesApi.getEpisodeById(episodeId);
    
    if (!episode) {
      throw new Error('Episode not found');
    }
    
    if (!episode.podcast_id) {
      throw new Error('Episode has no associated podcast');
    }
    
    // Check if we have a description to work with
    let description = episode.description;
    
    // If the description appears to be an error message, try to get the original description from metadata
    if (description?.includes('failed') || description?.includes('error') || description?.startsWith('Image generation failed')) {
      console.log('[IMAGE_PREVIEW] Description looks like an error message, checking metadata for original description');
      
      if (episode.metadata) {
        try {
          const metadata = JSON.parse(episode.metadata);
          
          // If metadata has original_description, use that instead
          if (metadata.original_description) {
            console.log('[IMAGE_PREVIEW] Using original description from metadata');
            description = metadata.original_description;
          }
        } catch (parseError) {
          console.warn('[IMAGE_PREVIEW] Could not parse metadata JSON', parseError);
        }
      }
    }
    
    // Still no usable description
    if (!description) {
      throw new Error('Episode has no description for image generation');
    }
    
    // Import required modules
    const { createPostProcessingService } = await import('@/lib/services/post-processing');
    
    // Initialize post-processing service with AI only (no S3 needed for preview)
    const aiApiKey = process.env.GEMINI_API_KEY;
    
    // Check if required environment variables are available
    if (!aiApiKey) {
      throw new Error('Missing required environment variables');
    }
    
    // Create post-processing service (with empty S3 config for now)
    const postProcessingService = createPostProcessingService({
      s3: {
        region: 'us-east-1', // Dummy values for preview
        bucket: 'preview-only',
        accessKeyId: 'preview-only',
        secretAccessKey: 'preview-only',
      },
      ai: {
        provider: 'gemini',
        apiKey: aiApiKey,
      },
    });
    
    // Get the episode title
    const title = episode.title || undefined;
    
    // Generate the image preview
    const previewResult = await postProcessingService.generateEpisodeImagePreview(
      description,
      title
    );
    
    if (previewResult.success && previewResult.imageData) {
      // Convert image data to a base64 data URL for preview
      const base64Data = previewResult.imageData.toString('base64');
      const dataUrl = `data:${previewResult.mimeType};base64,${base64Data}`;
      
      return { 
        success: true,
        imageDataUrl: dataUrl,
        episodeDescription: description,
        generatedFromPrompt: previewResult.generatedFromPrompt
      };
    } else {
      return { 
        success: false,
        error: previewResult.error || 'Failed to generate image preview',
        episodeDescription: description,
        generatedFromPrompt: previewResult.generatedFromPrompt
      };
    }
  } catch (error) {
    console.error('Error generating episode image preview:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Save a generated image preview to S3 and update the episode
 * This is a server action that requires admin permissions
 */
export async function saveEpisodeImagePreview(
  episodeId: string,
  imageDataUrl: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  // Ensure the user is an admin
  await requireAdmin();
  
  try {
    // Get the episode
    const episode = await episodesApi.getEpisodeById(episodeId);
    
    if (!episode) {
      throw new Error('Episode not found');
    }
    
    if (!episode.podcast_id) {
      throw new Error('Episode has no associated podcast');
    }
    
    // Extract binary data from data URL
    const matches = imageDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid image data URL format');
    }
    
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Import required modules
    const { createPostProcessingService } = await import('@/lib/services/post-processing');
    
    // Initialize post-processing service
    const s3Region = process.env.AWS_REGION;
    const s3Bucket = process.env.S3_BUCKET_NAME;
    const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    // Check if required environment variables are available
    if (!s3Region || !s3Bucket || !s3AccessKeyId || !s3SecretAccessKey) {
      throw new Error('Missing required environment variables');
    }
    
    // Create post-processing service
    const postProcessingService = createPostProcessingService({
      s3: {
        region: s3Region,
        bucket: s3Bucket,
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
      ai: {
        provider: 'gemini',
        apiKey: 'not-needed-for-save', // Not used for saving
      },
    });
    
    // Save the image
    const saveResult = await postProcessingService.saveGeneratedImage(
      episode.podcast_id,
      episodeId,
      buffer,
      mimeType,
      episode
    );
    
    if (saveResult.success) {
      // Revalidate the episodes page and the specific episode page
      revalidatePath('/admin/episodes');
      revalidatePath(`/admin/episodes/${episodeId}`);
      
      return { 
        success: true,
        imageUrl: saveResult.imageUrl
      };
    } else {
      return { 
        success: false,
        error: saveResult.error || 'Failed to save image'
      };
    }
  } catch (error) {
    console.error('Error saving episode image:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
} 