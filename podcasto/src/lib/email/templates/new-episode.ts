/**
 * Email templates for new episode notifications
 * Supports both HTML and plain text formats
 */

export interface EpisodeEmailData {
  episodeId: string;
  episodeTitle: string;
  episodeDescription?: string;
  podcastTitle: string;
  podcastId: string;
  coverImage?: string;
  duration?: number;
  publishedAt?: Date;
}

/**
 * Generates HTML email for new episode notification
 */
export function generateNewEpisodeHTML(data: EpisodeEmailData): string {
  const {
    episodeTitle,
    episodeDescription,
    podcastTitle,
    podcastId,
    episodeId,
    coverImage,
    duration,
    publishedAt,
  } = data;

  const episodeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://podcasto.app'}/podcasts/${podcastId}`;
  const durationText = duration ? `${Math.floor(duration / 60)} minutes` : '';
  const dateText = publishedAt ? publishedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Episode: ${episodeTitle}</title>
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
    ${coverImage ? `
    .cover-image {
      width: 100%;
      height: auto;
      display: block;
    }
    ` : ''}
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
    ${coverImage ? `<img src="${coverImage}" alt="${episodeTitle}" class="cover-image">` : ''}
    <div class="content">
      <p class="podcast-title">From ${podcastTitle}</p>
      <h2 class="episode-title">${episodeTitle}</h2>
      ${episodeDescription ? `<p class="description">${episodeDescription}</p>` : ''}
      ${durationText || dateText ? `
      <div class="metadata">
        ${durationText ? `<span>⏱️ ${durationText}</span>` : ''}
        ${dateText ? `<span>📅 ${dateText}</span>` : ''}
      </div>
      ` : ''}
      <div style="text-align: center;">
        <a href="${episodeUrl}" class="cta-button">Listen Now</a>
      </div>
    </div>
    <div class="footer">
      <p>You're receiving this because you subscribed to ${podcastTitle}</p>
      <p><a href="${episodeUrl}">Manage your subscriptions</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates plain text email for new episode notification
 */
export function generateNewEpisodeText(data: EpisodeEmailData): string {
  const {
    episodeTitle,
    episodeDescription,
    podcastTitle,
    podcastId,
    duration,
    publishedAt,
  } = data;

  const episodeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://podcasto.app'}/podcasts/${podcastId}`;
  const durationText = duration ? `Duration: ${Math.floor(duration / 60)} minutes` : '';
  const dateText = publishedAt ? `Published: ${publishedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}` : '';

  return `
🎙️ NEW EPISODE AVAILABLE

From: ${podcastTitle}

${episodeTitle}

${episodeDescription ? `${episodeDescription}\n` : ''}
${durationText ? `${durationText}\n` : ''}
${dateText ? `${dateText}\n` : ''}

Listen now: ${episodeUrl}

---
You're receiving this because you subscribed to ${podcastTitle}
Manage your subscriptions: ${episodeUrl}
  `.trim();
}
