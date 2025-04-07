'use server';

import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

export interface S3ClientConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Parse an S3 URI into bucket and key components
 */
export async function parseS3Uri(s3Uri: string): Promise<{ bucket: string; key: string } | null> {
  if (!s3Uri || typeof s3Uri !== 'string' || !s3Uri.startsWith('s3://')) {
    console.log('Invalid S3 URI format (not starting with s3://)', s3Uri);
    return null;
  }

  try {
    // Remove s3:// prefix
    const withoutProtocol = s3Uri.substring(5);
    
    // Find the first slash that separates bucket from key
    const firstSlashIndex = withoutProtocol.indexOf('/');
    
    if (firstSlashIndex === -1) {
      console.log('Invalid S3 URI format (no slash after bucket)', s3Uri);
      return null;
    }
    
    const bucket = withoutProtocol.substring(0, firstSlashIndex);
    const key = withoutProtocol.substring(firstSlashIndex + 1);
    
    // Add validation to ensure we have both bucket and key
    if (!bucket || !key) {
      console.log('Invalid S3 URI - empty bucket or key', { bucket, key, uri: s3Uri });
      return null;
    }
    
    // Log successful parsing
    console.log('Successfully parsed S3 URI:', { bucket, key });
    
    return { bucket, key };
  } catch (error) {
    console.error('Error parsing S3 URI:', error, 'URI:', s3Uri);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    return null;
  }
}

/**
 * Try to verify if an S3 object exists before generating a URL
 */
export async function verifyS3ObjectExists(client: S3Client, bucket: string, key: string): Promise<boolean> {
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
 * Creates an S3 client from environment variables or config
 */
export async function createS3Client(config?: S3ClientConfig): Promise<{ client: S3Client | null; error?: string }> {
  try {
    // Use provided config or get from environment
    const region = config?.region || process.env.AWS_REGION;
    const accessKeyId = config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    
    // Log config (without secret key)
    console.log('Creating S3 client - Region:', region);
    console.log('Access Key ID:', accessKeyId ? `${accessKeyId.substring(0, 5)}...` : "Missing");
    console.log('Secret Access Key:', secretAccessKey ? `Configured (length: ${secretAccessKey.length})` : "Missing");
    
    // Detailed validation of each credential
    if (!region) {
      console.error('Missing AWS region configuration');
      return {
        client: null,
        error: 'Missing AWS region. Check your environment variables or config.'
      };
    }
    
    if (!accessKeyId) {
      console.error('Missing AWS access key ID');
      return {
        client: null,
        error: 'Missing AWS access key ID. Check your environment variables or config.'
      };
    }
    
    if (!secretAccessKey) {
      console.error('Missing AWS secret access key');
      return {
        client: null,
        error: 'Missing AWS secret access key. Check your environment variables or config.'
      };
    }
    
    // Create S3 client
    console.log('Initializing S3 client with valid credentials...');
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    console.log('S3 client created successfully');
    return { client: s3Client };
  } catch (error) {
    console.error('Error creating S3 client:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    return { 
      client: null, 
      error: `Failed to create S3 client: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 