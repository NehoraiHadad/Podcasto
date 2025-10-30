'use server';

/**
 * Gallery management actions for podcast images.
 * Handles listing and deleting images from S3 gallery.
 */

import { requireAdmin } from '@/lib/auth/server';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { buildS3Url } from '@/lib/utils/s3-url-utils';
import type { GalleryResult, GalleryImage } from './types';

/**
 * List all images in the S3 gallery for a podcast.
 * This allows users to view and select from previously generated images.
 *
 * @param podcastId - The ID of the podcast
 * @returns Result containing array of gallery images or error
 */
export async function listPodcastImagesGallery(
  podcastId: string
): Promise<GalleryResult> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_GALLERY] Listing gallery images for podcast ${podcastId}`);

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    const bucket = process.env.S3_BUCKET_NAME!;
    const region = process.env.AWS_REGION || 'us-east-1';
    const basePrefix = `podcasts/${podcastId}/`;

    // Make two targeted S3 requests instead of fetching everything
    // 1. Get cover images (including variants)
    const coverCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${basePrefix}cover-image`,
      MaxKeys: 100
    });

    // 2. Get original images
    const originalCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${basePrefix}original-image`,
      MaxKeys: 100
    });

    // Execute both requests in parallel
    const [coverResponse, originalResponse] = await Promise.all([
      s3Client.send(coverCommand),
      s3Client.send(originalCommand)
    ]);

    // Combine results
    const allContents = [
      ...(coverResponse.Contents || []),
      ...(originalResponse.Contents || [])
    ];

    console.log(`[IMAGE_GALLERY] Found ${allContents.length} total images for podcast ${podcastId}`);
    console.log(`[IMAGE_GALLERY] - Cover images: ${coverResponse.Contents?.length || 0}`);
    console.log(`[IMAGE_GALLERY] - Original images: ${originalResponse.Contents?.length || 0}`);

    if (allContents.length === 0) {
      console.log(`[IMAGE_GALLERY] No cover or original images found for podcast ${podcastId}`);
      return {
        success: true,
        images: []
      };
    }

    // Log all found keys
    allContents.forEach(item => {
      console.log(`[IMAGE_GALLERY] Found: ${item.Key}`);
    });

    // Map to GalleryImage format (no filtering needed - we already got exactly what we want)
    const images: GalleryImage[] = await Promise.all(
      allContents
        .filter(item => {
          const key = item.Key || '';
          // Only filter out non-image files (shouldn't happen, but just in case)
          return key.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        })
        .map(async item => {
          const key = item.Key!;
          const url = await buildS3Url({ bucket, region, key });

          // Determine image type from filename
          const filename = key.split('/').pop() || '';
          let type: 'cover' | 'variant' | 'original' = 'cover';

          if (filename.startsWith('original-image')) {
            type = 'original';
          } else if (filename.includes('variant')) {
            type = 'variant';
          }

          return {
            url,
            key,
            lastModified: item.LastModified || new Date(),
            size: item.Size || 0,
            type
          };
        })
    );

    // Sort by most recent first
    images.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    console.log(`[IMAGE_GALLERY] Found ${images.length} images in gallery`);

    return {
      success: true,
      images
    };
  } catch (error) {
    console.error('[IMAGE_GALLERY] Error listing gallery images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete a single image from S3 gallery.
 *
 * @param s3Key - The S3 key of the image to delete
 * @returns Success status or error message
 */
export async function deleteGalleryImage(
  s3Key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_GALLERY] Deleting gallery image: ${s3Key}`);

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });

    const bucket = process.env.S3_BUCKET_NAME!;

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: s3Key
    });

    await s3Client.send(command);

    console.log(`[IMAGE_GALLERY] Successfully deleted gallery image: ${s3Key}`);

    return {
      success: true
    };
  } catch (error) {
    console.error('[IMAGE_GALLERY] Error deleting gallery image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
