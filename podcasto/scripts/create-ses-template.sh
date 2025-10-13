#!/bin/bash

# Script to create SES email template for Podcasto
# Run this once to set up the email template in AWS SES

set -e  # Exit on error

TEMPLATE_NAME="podcasto-new-episode-v1"
REGION="${AWS_SES_REGION:-us-east-1}"

echo "Creating SES email template: $TEMPLATE_NAME in region $REGION"

# Create template JSON
cat > /tmp/ses-template.json <<'EOF'
{
  "Template": {
    "TemplateName": "podcasto-new-episode-v1",
    "SubjectPart": "New Episode: {{episodeTitle}} - {{podcastTitle}}",
    "HtmlPart": "<!DOCTYPE html>\n<html lang=\"en\" dir=\"ltr\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>New Episode: {{episodeTitle}}</title>\n  <style>\n    body {\n      margin: 0;\n      padding: 0;\n      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n      background-color: #f5f5f5;\n      color: #333333;\n    }\n    .container {\n      max-width: 600px;\n      margin: 40px auto;\n      background-color: #ffffff;\n      border-radius: 8px;\n      overflow: hidden;\n      box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n    }\n    .header {\n      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n      padding: 32px 24px;\n      text-align: center;\n      color: #ffffff;\n    }\n    .header h1 {\n      margin: 0;\n      font-size: 24px;\n      font-weight: 600;\n    }\n    .cover-image {\n      width: 100%;\n      height: auto;\n      display: block;\n    }\n    .content {\n      padding: 32px 24px;\n    }\n    .episode-title {\n      font-size: 22px;\n      font-weight: 600;\n      color: #1a1a1a;\n      margin: 0 0 16px 0;\n    }\n    .podcast-title {\n      font-size: 14px;\n      color: #666666;\n      margin: 0 0 24px 0;\n    }\n    .description {\n      font-size: 15px;\n      line-height: 1.6;\n      color: #333333;\n      margin: 0 0 24px 0;\n    }\n    .metadata {\n      display: flex;\n      gap: 16px;\n      font-size: 13px;\n      color: #666666;\n      margin-bottom: 24px;\n    }\n    .cta-button {\n      display: inline-block;\n      padding: 14px 32px;\n      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n      color: #ffffff !important;\n      text-decoration: none;\n      border-radius: 6px;\n      font-weight: 600;\n      font-size: 16px;\n      transition: opacity 0.2s;\n    }\n    .cta-button:hover {\n      opacity: 0.9;\n    }\n    .footer {\n      padding: 24px;\n      text-align: center;\n      font-size: 13px;\n      color: #999999;\n      background-color: #f9f9f9;\n    }\n    .footer a {\n      color: #667eea;\n      text-decoration: none;\n    }\n  </style>\n</head>\n<body>\n  <div class=\"container\">\n    <div class=\"header\">\n      <h1>🎙️ New Episode Available</h1>\n    </div>\n    {{#if coverImage}}\n    <img src=\"{{coverImage}}\" alt=\"{{episodeTitle}}\" class=\"cover-image\">\n    {{/if}}\n    <div class=\"content\">\n      <p class=\"podcast-title\">From {{podcastTitle}}</p>\n      <h2 class=\"episode-title\">{{episodeTitle}}</h2>\n      {{#if episodeDescription}}\n      <p class=\"description\">{{episodeDescription}}</p>\n      {{/if}}\n      {{#if durationMinutes}}\n      <div class=\"metadata\">\n        <span>⏱️ {{durationMinutes}} minutes</span>\n        {{#if publishDate}}\n        <span>📅 {{publishDate}}</span>\n        {{/if}}\n      </div>\n      {{else}}\n      {{#if publishDate}}\n      <div class=\"metadata\">\n        <span>📅 {{publishDate}}</span>\n      </div>\n      {{/if}}\n      {{/if}}\n      <div style=\"text-align: center;\">\n        <a href=\"{{episodeUrl}}\" class=\"cta-button\">Listen Now</a>\n      </div>\n    </div>\n    <div class=\"footer\">\n      <p>You're receiving this because you subscribed to {{podcastTitle}}</p>\n      <p><a href=\"{{settingsUrl}}\">Manage your subscriptions</a> · <a href=\"{{unsubscribeUrl}}\">Unsubscribe</a></p>\n    </div>\n  </div>\n</body>\n</html>",
    "TextPart": "🎙️ NEW EPISODE AVAILABLE\n\nFrom: {{podcastTitle}}\n\n{{episodeTitle}}\n\n{{#if episodeDescription}}\n{{episodeDescription}}\n\n{{/if}}\n{{#if durationMinutes}}\nDuration: {{durationMinutes}} minutes\n{{/if}}\n{{#if publishDate}}\nPublished: {{publishDate}}\n{{/if}}\n\nListen now: {{episodeUrl}}\n\n---\nYou're receiving this because you subscribed to {{podcastTitle}}\nManage your subscriptions: {{settingsUrl}}\nUnsubscribe: {{unsubscribeUrl}}"
  }
}
EOF

# Check if template exists
echo "Checking if template already exists..."
if aws ses get-template --template-name "$TEMPLATE_NAME" --region "$REGION" 2>/dev/null; then
  echo "Template exists. Updating..."
  aws ses update-template --cli-input-json file:///tmp/ses-template.json --region "$REGION"
  echo "✅ Template updated successfully!"
else
  echo "Template doesn't exist. Creating..."
  aws ses create-template --cli-input-json file:///tmp/ses-template.json --region "$REGION"
  echo "✅ Template created successfully!"
fi

# Cleanup
rm /tmp/ses-template.json

echo ""
echo "SES Template Name: $TEMPLATE_NAME"
echo "Region: $REGION"
echo ""
echo "You can now use this template in your email sending code."
