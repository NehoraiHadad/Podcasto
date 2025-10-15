'use server';

/**
 * S3 upload operations for podcast images.
 * Handles uploading images to S3 and generating public URLs.
 */

import { requireAdmin } from '@/lib/auth';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { buildS3Url } from '@/lib/utils/s3-url-utils';

/**
 * Upload a podcast cover image to S3.
 * Internal helper function used by other image actions.
 *
 * @param podcastId - The podcast ID
 * @param imageBuffer - The image data as a Buffer
 * @param mimeType - The MIME type of the image
 * @param filenamePrefix - Optional filename prefix (defaults to 'cover-image')
 * @returns The public URL of the uploaded image
 */
export async function uploadPodcastImageToS3(
  podcastId: string,
  imageBuffer: Buffer,
  mimeType: string,
  filenamePrefix: string = 'cover-image'
): Promise<string> {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  });

  const bucket = process.env.S3_BUCKET_NAME!;
  const region = process.env.AWS_REGION || 'us-east-1';

  // Determine file extension from MIME type
  const extension = mimeType.split('/')[1] || 'jpg';

  // Add timestamp to avoid caching issues
  const timestamp = Date.now();
  const filename = `${filenamePrefix}-${timestamp}.${extension}`;

  // S3 key for podcast cover image
  const key = `podcasts/${podcastId}/${filename}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: imageBuffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable' // Cache for 1 year (immutable because we use unique filenames)
  });

  await s3Client.send(command);

  // Build and return public URL
  return await buildS3Url({
    bucket,
    region,
    key
  });
}

/**
 * Upload base64 image data to S3.
 * This is called when the user saves the form after generating/selecting an image.
 *
 * @param podcastId - The ID of the podcast
 * @param base64Data - The base64-encoded image data
 * @param mimeType - The MIME type of the image (defaults to 'image/jpeg')
 * @returns Success status and image URL or error message
 */
export async function uploadBase64ImageToS3(
  podcastId: string,
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_UPLOAD] Uploading base64 image to S3 for podcast ${podcastId}`);

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Upload to S3 with consistent filename (will overwrite previous)
    const imageUrl = await uploadPodcastImageToS3(
      podcastId,
      imageBuffer,
      mimeType,
      'cover-image' // Consistent name - no timestamp, will overwrite
    );

    console.log(`[IMAGE_UPLOAD] Uploaded image to S3: ${imageUrl}`);

    return {
      success: true,
      imageUrl
    };
  } catch (error) {
    console.error('[IMAGE_UPLOAD] Error uploading base64 image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
