'use server';

import { requireAdmin } from '../auth-actions';
import { getTelegramChannelImage } from '@/lib/services/telegram-image-scraper';
import { createPodcastImageEnhancer } from '@/lib/services/podcast-image-enhancer';
import { db } from '@/lib/db';
import { podcasts, podcastConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
  const filename = `${filenamePrefix}.${extension}`;

  // S3 key for podcast cover image
  const key = `podcasts/${podcastId}/${filename}`;

  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: imageBuffer,
    ContentType: mimeType,
    CacheControl: 'max-age=31536000' // Cache for 1 year
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

          // Update database with main image and style
          await db
            .update(podcasts)
            .set({
              cover_image: s3ImageUrl,
              image_style: options?.styleId || null,
              updated_at: new Date()
            })
            .where(eq(podcasts.id, podcastId));

          console.log(`[IMAGE_ACTION] Updated podcast ${podcastId} with ${allVariationUrls.length} variations${options?.styleId ? ` (style: ${options.styleId})` : ''}`);

          // Revalidate relevant pages
          revalidatePath('/admin/podcasts');
          revalidatePath(`/admin/podcasts/${podcastId}`);
          revalidatePath(`/podcasts/${podcastId}`);
          revalidatePath('/podcasts');
          revalidatePath('/');

          return {
            success: true,
            imageUrl: s3ImageUrl,
            imageUrls: allVariationUrls,
            enhancedWithAI: true
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

  // Update database with image and style
  await db
    .update(podcasts)
    .set({
      cover_image: s3ImageUrl,
      image_style: options?.styleId || null,
      updated_at: new Date()
    })
    .where(eq(podcasts.id, podcastId));

  console.log(`[IMAGE_ACTION] Updated podcast ${podcastId} with new image${options?.styleId ? ` (style: ${options.styleId})` : ''}`);

  // Revalidate relevant pages
  revalidatePath('/admin/podcasts');
  revalidatePath(`/admin/podcasts/${podcastId}`);
  revalidatePath(`/podcasts/${podcastId}`);
  revalidatePath('/podcasts');
  revalidatePath('/');

  return {
    success: true,
    imageUrl: s3ImageUrl,
    enhancedWithAI
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
