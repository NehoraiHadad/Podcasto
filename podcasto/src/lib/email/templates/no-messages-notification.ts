/**
 * Generates the "no new messages" email content for creators.
 * Returns both HTML and plain text variants following the Podcasto brand styling.
 */
import { formatInTimezoneServer } from '@/lib/utils/date/server';
import { DEFAULT_TIMEZONE } from '@/lib/utils/date/constants';

export function generateNoMessagesEmail({
  channelName,
  dateRange,
  podcastName,
  manualTriggerUrl,
}: {
  channelName: string;
  dateRange: { start: Date; end: Date };
  podcastName: string;
  manualTriggerUrl: string;
}): { html: string; text: string } {
  const formatDate = (date: Date | string) =>
    formatInTimezoneServer(date, DEFAULT_TIMEZONE, 'dd MMM yyyy');

  const formattedRange = `${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}`;

  const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>No New Messages – ${podcastName}</title>
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
    .content {
      padding: 32px 24px;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #333333;
      margin: 0 0 24px 0;
    }
    .details-box {
      background-color: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
      font-size: 14px;
      color: #555555;
    }
    .details-box strong {
      color: #333333;
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
      transition: opacity 0.2s ease-in-out;
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
      <h1>📭 No New Messages</h1>
    </div>
    <div class="content">
      <p class="message">
        We attempted to generate a new episode for <strong>${podcastName}</strong>, but no new messages were found in <strong>${channelName}</strong> during the selected window.
      </p>
      <div class="details-box">
        <p><strong>Podcast</strong>: ${podcastName}</p>
        <p><strong>Channel</strong>: ${channelName}</p>
        <p><strong>Range Checked</strong>: ${formattedRange}</p>
        <p><strong>Credits</strong>: No credits were deducted</p>
      </div>
      <p class="message">
        If you were expecting new content, please double-check your channel activity or adjust the collection window. You can also trigger a manual generation whenever you're ready.
      </p>
      <div style="text-align: center; margin-top: 32px;">
        <a href="${manualTriggerUrl}" class="cta-button">Trigger Episode Manually</a>
      </div>
    </div>
    <div class="footer">
      <p>This automated alert keeps you informed about Podcasto generation attempts.</p>
      <p><a href="${manualTriggerUrl}">Open your podcast dashboard</a></p>
    </div>
  </div>
</body>
</html>
`.trim();

  const text = `
📭 NO NEW MESSAGES

Podcast: ${podcastName}
Channel: ${channelName}
Range Checked: ${formattedRange}
Credits: No credits were deducted

We attempted to generate a new episode but didn't find fresh messages in your channel.

If you were expecting new content, please review your channel activity or adjust the collection window. You can also trigger a manual generation here:
${manualTriggerUrl}

— The Podcasto Team
`.trim();

  return { html, text };
}
