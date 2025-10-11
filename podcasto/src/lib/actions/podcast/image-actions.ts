'use server';

import { requireAdmin } from '../auth-actions';
import { getTelegramChannelImage } from '@/lib/services/telegram-image-scraper';
import { createPodcastImageEnhancer, ImageAnalysis } from '@/lib/services/podcast-image-enhancer';
import { db } from '@/lib/db';
import { podcasts, podcastConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { PutObjectCommand, S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { buildS3Url } from '@/lib/utils/s3-url-utils';

/**
 * Result type for image generation actions
 */
export interface ImageActionResult {
  success: boolean;
  imageUrl?: string;
  imageUrls?: string[]; // For multiple variations
  error?: string;
  enhancedWithAI?: boolean;
  analysis?: ImageAnalysis; // AI analysis of source image
  prompt?: string; // The prompt used to generate the image
  originalImageUrl?: string; // URL of original source image
}

/**
 * Options for image generation
 */
export interface ImageGenerationOptions {
  style?: string;
  styleId?: string; // The style ID to save to database (e.g., 'modern-professional')
  variationsCount?: number;
}

/**
 * Single image metadata from gallery
 */
export interface GalleryImage {
  url: string;
  key: string;
  lastModified: Date;
  size: number;
  type: 'cover' | 'variant' | 'original';
}

/**
 * Result type for gallery listing
 */
export interface GalleryResult {
  success: boolean;
  images?: GalleryImage[];
  error?: string;
}

/**
 * Generate podcast cover image from Telegram channel profile photo
 * This will scrape the channel's public page and upload the image to S3
 */
export async function generatePodcastImageFromTelegram(
  podcastId: string,
  options?: ImageGenerationOptions
): Promise<ImageActionResult> {
  try {
    // Require admin authentication
    await requireAdmin();

    console.log(`[IMAGE_ACTION] Generating image for podcast ${podcastId}`);

    // Get podcast and config
    const [podcast] = await db
      .select()
      .from(podcasts)
      .where(eq(podcasts.id, podcastId))
      .limit(1);

    if (!podcast) {
      return {
        success: false,
        error: 'Podcast not found'
      };
    }

    const [config] = await db
      .select()
      .from(podcastConfigs)
      .where(eq(podcastConfigs.podcast_id, podcastId))
      .limit(1);

    if (!config || !config.telegram_channel) {
      return {
        success: false,
        error: 'No Telegram channel configured for this podcast'
      };
    }

    // Fetch image from Telegram
    console.log(`[IMAGE_ACTION] Fetching image from Telegram channel: ${config.telegram_channel}`);
    const telegramResult = await getTelegramChannelImage(config.telegram_channel);

    if (!telegramResult.success || !telegramResult.imageBuffer) {
      return {
        success: false,
        error: telegramResult.error || 'Failed to fetch channel image'
      };
    }

    // Use shared enhancement and upload function
    return await enhanceAndUploadImage(
      podcastId,
      telegramResult.imageBuffer,
      podcast.title,
      options
    );
  } catch (error) {
    console.error('[IMAGE_ACTION] Error generating podcast image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Upload a podcast cover image to S3
 * @param podcastId - The podcast ID
 * @param imageBuffer - The image data as a Buffer
 * @param mimeType - The MIME type of the image
 * @param filenamePrefix - Optional filename prefix (defaults to 'cover-image')
 * @returns The public URL of the uploaded image
 */
async function uploadPodcastImageToS3(
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
 * Generate podcast cover image from uploaded file
 * @param podcastId - The podcast ID
 * @param base64Image - The image data as base64 string
 * @param mimeType - The MIME type of the image
 * @param options - Generation options (style, variations)
 */
export async function generatePodcastImageFromFile(
  podcastId: string,
  base64Image: string,
  mimeType: string,
  podcastTitle: string,
  options?: ImageGenerationOptions
): Promise<ImageActionResult> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_ACTION] Generating image from uploaded file for podcast ${podcastId}`);

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    return await enhanceAndUploadImage(
      podcastId,
      imageBuffer,
      podcastTitle,
      options
    );
  } catch (error) {
    console.error('[IMAGE_ACTION] Error generating from file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate podcast cover image from URL
 * @param podcastId - The podcast ID
 * @param imageUrl - The URL of the image to download
 * @param podcastTitle - The podcast title
 * @param options - Generation options (style, variations)
 */
export async function generatePodcastImageFromUrl(
  podcastId: string,
  imageUrl: string,
  podcastTitle: string,
  options?: ImageGenerationOptions
): Promise<ImageActionResult> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_ACTION] Generating image from URL for podcast ${podcastId}: ${imageUrl}`);

    // Validate URL
    try {
      new URL(imageUrl);
    } catch {
      return {
        success: false,
        error: 'Invalid URL format'
      };
    }

    // Download image from URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to download image: ${response.statusText}`
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return {
        success: false,
        error: 'URL does not point to an image'
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    return await enhanceAndUploadImage(
      podcastId,
      imageBuffer,
      podcastTitle,
      options
    );
  } catch (error) {
    console.error('[IMAGE_ACTION] Error generating from URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Shared function to enhance and upload image
 * Used by all image generation sources
 */
async function enhanceAndUploadImage(
  podcastId: string,
  imageBuffer: Buffer,
  podcastTitle: string,
  options?: ImageGenerationOptions
): Promise<ImageActionResult> {
  let finalImageBuffer = imageBuffer;
  let enhancedWithAI = false;
  let analysis: ImageAnalysis | undefined;
  let prompt: string | undefined;
  let originalImageUrl: string | undefined;

  // Upload original image to S3 for display in UI
  try {
    originalImageUrl = await uploadPodcastImageToS3(
      podcastId,
      imageBuffer,
      'image/jpeg',
      'original-image'
    );
    console.log(`[IMAGE_ACTION] Uploaded original image: ${originalImageUrl}`);
  } catch (error) {
    console.error('[IMAGE_ACTION] Failed to upload original image:', error);
  }

  // Try to enhance with AI if Gemini API key is available
  if (process.env.GEMINI_API_KEY) {
    const variationsCount = options?.variationsCount || 1;
    console.log(`[IMAGE_ACTION] Enhancing image with AI (${variationsCount} variation${variationsCount > 1 ? 's' : ''})`);

    try {
      const enhancer = createPodcastImageEnhancer(process.env.GEMINI_API_KEY);
      const enhancementResult = await enhancer.enhanceImage(
        imageBuffer,
        {
          podcastTitle,
          podcastStyle: options?.style || 'modern, professional',
          aspectRatio: '1:1',
          variationsCount
        }
      );

      if (enhancementResult.success && enhancementResult.variations && enhancementResult.variations.length > 0) {
        console.log(`[IMAGE_ACTION] AI enhancement successful - ${enhancementResult.variations.length} variation(s) generated`);

        // Store analysis and prompt for return
        analysis = enhancementResult.analysis;
        prompt = enhancementResult.prompt;

        // Handle multiple variations
        if (variationsCount > 1 && enhancementResult.variations.length > 1) {
          // Upload all variations to S3
          const uploadPromises = enhancementResult.variations.map(async (variation, index) => {
            const variantImageUrl = await uploadPodcastImageToS3(
              podcastId,
              variation.imageData,
              variation.mimeType,
              `cover-image-variant-${index}`
            );
            return variantImageUrl;
          });

          const allVariationUrls = await Promise.all(uploadPromises);

          // Use first variation as the main image
          const s3ImageUrl = allVariationUrls[0];

          // DON'T update database - let the user save the form when ready
          console.log(`[IMAGE_ACTION] Generated ${allVariationUrls.length} variations (not saved to DB yet)`);

          return {
            success: true,
            imageUrl: s3ImageUrl,
            imageUrls: allVariationUrls,
            enhancedWithAI: true,
            analysis,
            prompt,
            originalImageUrl
          };
        } else {
          // Single variation
          finalImageBuffer = enhancementResult.variations[0].imageData;
          enhancedWithAI = true;
        }
      } else {
        console.warn(`[IMAGE_ACTION] AI enhancement failed, using original: ${enhancementResult.error}`);
      }
    } catch (error) {
      console.error(`[IMAGE_ACTION] Error during AI enhancement:`, error);
      console.log(`[IMAGE_ACTION] Falling back to original image`);
    }
  } else {
    console.log(`[IMAGE_ACTION] GEMINI_API_KEY not found, skipping AI enhancement`);
  }

  // Upload to S3
  const s3ImageUrl = await uploadPodcastImageToS3(
    podcastId,
    finalImageBuffer,
    'image/jpeg'
  );

  console.log(`[IMAGE_ACTION] Uploaded image to S3: ${s3ImageUrl} (AI enhanced: ${enhancedWithAI})`);
  console.log(`[IMAGE_ACTION] Image generated but NOT saved to DB - user must save the form`);

  // DON'T update database - let the user save the form when ready
  // The form will handle saving when the user clicks Save

  return {
    success: true,
    imageUrl: s3ImageUrl,
    enhancedWithAI,
    analysis,
    prompt,
    originalImageUrl
  };
}

/**
 * Refresh podcast cover image by re-fetching from Telegram
 * This is useful when the channel's profile photo has been updated
 */
export async function refreshPodcastImage(
  podcastId: string
): Promise<ImageActionResult> {
  // Same as generatePodcastImageFromTelegram but with explicit "refresh" semantics
  return generatePodcastImageFromTelegram(podcastId);
}

/**
 * Delete podcast cover image from S3 and database
 */
export async function deletePodcastImage(
  podcastId: string
): Promise<ImageActionResult> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_ACTION] Deleting image for podcast ${podcastId}`);

    // Update database to remove image URL
    await db
      .update(podcasts)
      .set({
        cover_image: null,
        updated_at: new Date()
      })
      .where(eq(podcasts.id, podcastId));

    // Note: We don't delete from S3 to avoid breaking cached references
    // S3 objects can be cleaned up via a separate lifecycle policy

    // Revalidate pages
    revalidatePath('/admin/podcasts');
    revalidatePath(`/admin/podcasts/${podcastId}`);
    revalidatePath(`/podcasts/${podcastId}`);
    revalidatePath('/podcasts');

    return {
      success: true
    };
  } catch (error) {
    console.error('[IMAGE_ACTION] Error deleting podcast image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Upload a podcast cover image from a URL
 * This is useful for manually specifying an image URL
 */
export async function setPodcastImageFromUrl(
  podcastId: string,
  imageUrl: string
): Promise<ImageActionResult> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_ACTION] Setting image URL for podcast ${podcastId}: ${imageUrl}`);

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return {
        success: false,
        error: 'Invalid URL format'
      };
    }

    // Update database
    await db
      .update(podcasts)
      .set({
        cover_image: imageUrl,
        updated_at: new Date()
      })
      .where(eq(podcasts.id, podcastId));

    // Revalidate pages
    revalidatePath('/admin/podcasts');
    revalidatePath(`/admin/podcasts/${podcastId}`);
    revalidatePath(`/podcasts/${podcastId}`);
    revalidatePath('/podcasts');

    return {
      success: true,
      imageUrl
    };
  } catch (error) {
    console.error('[IMAGE_ACTION] Error setting podcast image URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * List all images in the S3 gallery for a podcast
 * This allows users to view and select from previously generated images
 */
export async function listPodcastImagesGallery(
  podcastId: string
): Promise<GalleryResult> {
  try {
    await requireAdmin();

    console.log(`[IMAGE_ACTION] Listing gallery images for podcast ${podcastId}`);

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

    console.log(`[IMAGE_ACTION] Found ${images.length} images in gallery`);

    return {
      success: true,
      images
    };
  } catch (error) {
    console.error('[IMAGE_ACTION] Error listing gallery images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
