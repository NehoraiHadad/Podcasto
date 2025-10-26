/**
 * AWS SES Bulk Email Templates
 * Uses Handlebars syntax for personalization with inline templates
 */

import { formatInTimezoneServer } from '@/lib/utils/date/server';
import { DEFAULT_TIMEZONE } from '@/lib/utils/date/constants';

/**
 * Template data interface for SES bulk sending
 * All values must be strings for SES (dates/numbers converted to strings)
 */
export interface SESTemplateData {
  /** Episode title */
  episodeTitle: string;
  /** Episode description (optional) */
  episodeDescription: string;
  /** Podcast title */
  podcastTitle: string;
  /** Podcast ID for URL construction */
  podcastId: string;
  /** Episode ID for URL construction */
  episodeId: string;
  /** Cover image URL (optional) */
  coverImage: string;
  /** Duration in minutes as string (e.g., "45") */
  durationMinutes: string;
  /** Formatted publish date (e.g., "January 15, 2025") */
  publishDate: string;
  /** Full episode URL */
  episodeUrl: string;
  /** Site base URL */
  siteUrl: string;
  /** Settings page URL for managing subscriptions */
  settingsUrl: string;
  /** Global unsubscribe URL (all notifications) */
  unsubscribeAllUrl: string;
  /** Podcast-specific unsubscribe URL */
  unsubscribePodcastUrl: string;
}

/**
 * HTML template for new episode notification with Handlebars syntax
 * Supports conditional rendering with {{#if}} helpers
 */
export const NEW_EPISODE_HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Episode: {{episodeTitle}}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .cover-image {
      width: 100%;
      height: auto;
      display: block;
    }
    .content {
      padding: 32px 24px;
    }
    .episode-title {
      font-size: 22px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0 0 16px 0;
    }
    .podcast-title {
      font-size: 14px;
      color: #666666;
      margin: 0 0 24px 0;
    }
    .description {
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
      margin: 0 0 24px 0;
    }
    .metadata {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #666666;
      margin-bottom: 24px;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: opacity 0.2s;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 13px;
      color: #999999;
      background-color: #f9f9f9;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎙️ New Episode Available</h1>
    </div>
    {{#if coverImage}}
    <img src="{{coverImage}}" alt="{{episodeTitle}}" class="cover-image">
    {{/if}}
    <div class="content">
      <p class="podcast-title">From {{podcastTitle}}</p>
      <h2 class="episode-title">{{episodeTitle}}</h2>
      {{#if episodeDescription}}
      <p class="description">{{episodeDescription}}</p>
      {{/if}}
      {{#if durationMinutes}}
      <div class="metadata">
        <span>⏱️ {{durationMinutes}} minutes</span>
        {{#if publishDate}}
        <span>📅 {{publishDate}}</span>
        {{/if}}
      </div>
      {{else}}
      {{#if publishDate}}
      <div class="metadata">
        <span>📅 {{publishDate}}</span>
      </div>
      {{/if}}
      {{/if}}
      <div style="text-align: center;">
        <a href="{{episodeUrl}}" class="cta-button">Listen Now</a>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you subscribed to {{podcastTitle}}</p>
      <p>
        <a href="{{settingsUrl}}">Manage your subscriptions</a> ·
        <a href="{{unsubscribePodcastUrl}}">Unsubscribe from this podcast</a> ·
        <a href="{{unsubscribeAllUrl}}">Unsubscribe from all emails</a>
      </p>
    </div>
  </div>
</body>
</html>
`.trim();

/**
 * Plain text template for new episode notification with Handlebars syntax
 */
export const NEW_EPISODE_TEXT_TEMPLATE = `
🎙️ NEW EPISODE AVAILABLE

From: {{podcastTitle}}

{{episodeTitle}}

{{#if episodeDescription}}
{{episodeDescription}}

{{/if}}
{{#if durationMinutes}}
Duration: {{durationMinutes}} minutes
{{/if}}
{{#if publishDate}}
Published: {{publishDate}}
{{/if}}

Listen now: {{episodeUrl}}

---
You're receiving this because you subscribed to {{podcastTitle}}

Manage your subscriptions: {{settingsUrl}}
Unsubscribe from this podcast: {{unsubscribePodcastUrl}}
Unsubscribe from all emails: {{unsubscribeAllUrl}}
`.trim();

/**
 * Converts episode email data to SES template data format
 * All values must be strings for SES compatibility
 */
export function convertToSESTemplateData(
  episodeId: string,
  episodeTitle: string,
  podcastTitle: string,
  podcastId: string,
  episodeUrl: string,
  options: {
    episodeDescription?: string;
    coverImage?: string;
    duration?: number;
    publishedAt?: Date;
  } = {}
): SESTemplateData {
  const {
    episodeDescription = '',
    coverImage = '',
    duration,
    publishedAt,
  } = options;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://podcasto.app';

  return {
    episodeTitle,
    episodeDescription,
    podcastTitle,
    podcastId,
    episodeId,
    coverImage,
    durationMinutes: duration ? Math.floor(duration / 60).toString() : '',
    publishDate: publishedAt
      ? formatInTimezoneServer(publishedAt, DEFAULT_TIMEZONE, 'dd MMMM yyyy')
      : '',
    episodeUrl,
    siteUrl,
    settingsUrl: `${siteUrl}/settings/notifications`,
    unsubscribeAllUrl: `${siteUrl}/unsubscribe?token={{token}}`,
    unsubscribePodcastUrl: `${siteUrl}/unsubscribe?token={{token}}&podcast=${podcastId}`,
  };
}
