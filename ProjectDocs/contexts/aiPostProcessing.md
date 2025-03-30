# AI Post-Processing for Podcast Episodes

## Overview
This document outlines the post-processing pipeline that enhances podcast episodes after audio generation is complete, using AI to create titles, summaries, and episode images.

## Processing Pipeline

1. **Episode Creation and Audio Generation**
   - The existing podcast generation system creates episodes with a `pending` status.
   - When complete, the Lambda function uploads the audio file and transcripts to S3.
   - The episode status is updated to `completed` once the audio URL is available.

2. **Status Checking and Trigger**
   - A cron job runs every 10 minutes to check for newly completed episodes.
   - When an episode with status `completed` is found, the post-processing is triggered.

3. **Transcript Retrieval and Analysis**
   - The system fetches the transcript file from S3.
   - The transcript content is analyzed using Google's Gemini AI to generate:
     - A contextually relevant episode title
     - A concise summary capturing key themes

4. **Image Generation**
   - Based on the summary, the Gemini AI generates a custom image.
   - The image maintains a consistent style for all podcast episodes.
   - The generated image is uploaded to S3 in the episode's folder.

5. **Episode Update**
   - The episode record is updated with the new title, summary, and image URL.
   - The status is changed to `processed` to indicate completion.
   - UI paths are revalidated to reflect the changes immediately.

## Key Components

### AI Integration Layer
A modular AI service layer that abstracts different AI providers through a common interface:

```
/lib/ai/
  ├── index.ts             # Main API and service creation
  ├── types.ts             # Common interfaces and types
  └── providers/
      └── gemini.ts        # Google Gemini implementation
```

### Post-Processing Service
A service that coordinates the entire post-processing workflow:

```
/lib/services/
  └── post-processing.ts   # Handles S3 operations and orchestration
```

### Status Checker
An API endpoint that runs periodically to identify completed episodes and trigger post-processing:

```
/app/api/cron/
  └── episode-checker/
      └── route.ts         # Checks and updates episode status
```

## Configuration

The post-processing can be enabled/disabled via environment variables:

```
# Enable/disable the entire post-processing feature
ENABLE_POST_PROCESSING=true

# Gemini AI API key for title, summary, and image generation
GEMINI_API_KEY=your-gemini-api-key

# AWS S3 configuration for transcript retrieval and image storage
AWS_S3_REGION=your-aws-region
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

## Future Enhancements

- Integration with additional AI providers (OpenAI, Anthropic, etc.)
- More customization options for image generation styles
- Localization support for title and summary generation
- Automated sharing of episodes to social media with the generated assets
- A/B testing different title and summary styles for engagement metrics 