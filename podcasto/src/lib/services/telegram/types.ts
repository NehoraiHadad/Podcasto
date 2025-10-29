/**
 * TypeScript type definitions for Telegram scraping utilities
 */

/**
 * Status of channel accessibility when checking for messages
 */
export enum ChannelAccessStatus {
  /** Channel has public message preview and is accessible */
  ACCESSIBLE = 'accessible',
  /** Channel exists but does not allow public message preview */
  NO_PREVIEW = 'no_preview',
  /** Channel was not found or is completely private */
  NOT_FOUND = 'not_found',
  /** Error occurred while checking channel accessibility */
  ERROR = 'error',
}

/**
 * Result structure for Telegram scraper operations
 * Follows the RORO pattern with success/error/data
 */
export interface TelegramScraperResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Channel metadata extracted from Telegram's public interface
 */
export interface TelegramChannelInfo {
  channelUsername: string;
  imageUrl: string | null;
  latestMessageDate: Date | null;
  title?: string;
  description?: string;
}

/**
 * Options for configuring Telegram scraper behavior
 */
export interface TelegramScraperOptions {
  /** Maximum number of retry attempts for failed requests */
  retries?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom HTTP headers to include in requests */
  headers?: Record<string, string>;
  /** User agent string for requests */
  userAgent?: string;
}

/**
 * Default scraper options
 */
export const DEFAULT_SCRAPER_OPTIONS: Required<TelegramScraperOptions> = {
  retries: 3,
  timeout: 10000,
  headers: {},
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

/**
 * Result of checking for new messages in a Telegram channel
 */
export interface MessageCheckResult {
  /** Whether new messages were found in the specified date range */
  hasNewMessages: boolean;
  /** Status of channel accessibility during the check */
  accessStatus: ChannelAccessStatus;
  /** The date of the latest message found (if any) */
  latestMessageDate?: Date;
  /** The channel username that was checked */
  channelUsername: string;
  /** Timestamp when the check was performed */
  checkedAt: Date;
  /** Error message if the check failed */
  error?: string;
}

/**
 * Options for configuring message check date range
 */
export interface MessageCheckOptions {
  /** Start of the date range to check for messages */
  startDate: Date;
  /** End of the date range to check for messages */
  endDate: Date;
}
