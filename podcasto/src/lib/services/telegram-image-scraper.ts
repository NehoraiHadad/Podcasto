/**
 * Service for scraping channel images from Telegram's public web interface
 * Uses t.me/s/{channel} to extract profile photos without requiring Bot API
 */

interface TelegramImageResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * Get the profile image URL for a Telegram channel
 * @param channelUsername - The channel username (with or without @)
 * @returns The image URL or null if not found
 */
export async function getTelegramChannelImageUrl(
  channelUsername: string
): Promise<TelegramImageResult> {
  try {
    // Clean channel username (remove @ if present)
    const cleanChannel = channelUsername.replace(/^@/, '').trim();

    if (!cleanChannel) {
      return {
        success: false,
        error: 'Invalid channel username'
      };
    }

    // Fetch the public Telegram channel page
    const url = `https://t.me/s/${cleanChannel}`;
    console.log(`[TELEGRAM_SCRAPER] Fetching channel page: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`[TELEGRAM_SCRAPER] HTTP ${response.status}: ${response.statusText}`);
      return {
        success: false,
        error: `Channel not found or not accessible (${response.status})`
      };
    }

    const html = await response.text();

    // Extract og:image meta tag which contains the channel profile photo
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

    if (ogImageMatch && ogImageMatch[1]) {
      const imageUrl = ogImageMatch[1];
      console.log(`[TELEGRAM_SCRAPER] Found channel image: ${imageUrl.substring(0, 80)}...`);

      return {
        success: true,
        imageUrl
      };
    }

    // Fallback: try to find the channel photo directly
    const photoMatch = html.match(/class="tgme_page_photo_image"[^>]+style="background-image:url\('([^']+)'\)"/);

    if (photoMatch && photoMatch[1]) {
      const imageUrl = photoMatch[1];
      console.log(`[TELEGRAM_SCRAPER] Found channel photo (fallback): ${imageUrl.substring(0, 80)}...`);

      return {
        success: true,
        imageUrl
      };
    }

    console.warn(`[TELEGRAM_SCRAPER] No image found for channel: ${cleanChannel}`);
    return {
      success: false,
      error: 'No profile image found for this channel'
    };

  } catch (error) {
    console.error('[TELEGRAM_SCRAPER] Error fetching channel image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Download the image as a Buffer
 * @param imageUrl - The URL of the image to download
 * @returns Buffer containing the image data
 */
export async function downloadTelegramImage(imageUrl: string): Promise<Buffer> {
  try {
    console.log(`[TELEGRAM_SCRAPER] Downloading image from: ${imageUrl.substring(0, 80)}...`);

    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[TELEGRAM_SCRAPER] Downloaded ${buffer.length} bytes`);

    return buffer;
  } catch (error) {
    console.error('[TELEGRAM_SCRAPER] Error downloading image:', error);
    throw error;
  }
}

/**
 * Validate that a Telegram channel exists and is accessible
 * @param channelUsername - The channel username to validate
 * @returns true if the channel exists and is public
 */
export async function validateTelegramChannel(
  channelUsername: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const cleanChannel = channelUsername.replace(/^@/, '').trim();

    if (!cleanChannel) {
      return { valid: false, error: 'Invalid channel username' };
    }

    const url = `https://t.me/s/${cleanChannel}`;
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 404) {
      return { valid: false, error: 'Channel not found' };
    } else {
      return { valid: false, error: `Channel not accessible (${response.status})` };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get both the image URL and download the image in one operation
 * @param channelUsername - The channel username
 * @returns Object with imageUrl and imageBuffer
 */
export async function getTelegramChannelImage(
  channelUsername: string
): Promise<{
  success: boolean;
  imageUrl?: string;
  imageBuffer?: Buffer;
  error?: string;
}> {
  try {
    // First, get the image URL
    const result = await getTelegramChannelImageUrl(channelUsername);

    if (!result.success || !result.imageUrl) {
      return result;
    }

    // Then download the image
    const imageBuffer = await downloadTelegramImage(result.imageUrl);

    return {
      success: true,
      imageUrl: result.imageUrl,
      imageBuffer
    };
  } catch (error) {
    console.error('[TELEGRAM_SCRAPER] Error in getTelegramChannelImage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
