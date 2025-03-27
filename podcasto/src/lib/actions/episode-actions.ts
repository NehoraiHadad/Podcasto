'use server';

import { getEpisodeById } from '../db/api/episodes';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

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