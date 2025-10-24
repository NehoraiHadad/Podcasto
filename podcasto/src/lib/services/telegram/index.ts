/**
 * Telegram scraping utilities module
 * Provides modular, reusable functions for scraping Telegram channel data
 * from the public web interface at t.me/s/{channel}
 */

// Export types
export type {
  TelegramScraperResult,
  TelegramChannelInfo,
  TelegramScraperOptions,
  MessageCheckResult,
  MessageCheckOptions,
} from './types';

export { DEFAULT_SCRAPER_OPTIONS } from './types';

// Export base scraper utilities
export {
  cleanChannelUsername,
  fetchTelegramChannelPage,
  parseChannelImageFromHTML,
  parseLatestMessageDateFromHTML,
} from './telegram-scraper-base';

// Export message checker service
export { checkForNewMessages } from './message-checker';
