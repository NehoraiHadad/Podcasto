# Podcastfy Lambda

This Lambda function generates podcasts from various inputs (URLs, text, Telegram data) and uploads them to S3.

## Features

- Generate podcasts from URLs
- Generate podcasts from raw text
- Generate podcasts from Telegram message data
- Customizable conversation styles and engagement techniques
- Support for longform podcasts
- Automatic upload of transcript files to S3 alongside audio files

## Setup

### Prerequisites

- AWS SAM CLI
- Python 3.9+
- AWS CLI configured with appropriate permissions

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create a `.env` file from the template:

```bash
cp .env.example .env
```

4. Edit the `.env` file with your API keys and configuration:

```
# API Keys
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# AWS Configuration
S3_BUCKET_NAME=your_s3_bucket_name
AWS_SAM_LOCAL=false
AWS_ACCOUNT_ID=your_aws_account_id
SQS_QUEUE_URL=your_sqs_queue_url
SQS_QUEUE_ARN=your_sqs_queue_arn

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Local Storage
STORAGE_DIR=/tmp/podcasts
```

> ⚠️ **IMPORTANT**: 
> - Never commit your `.env` file to Git. It contains sensitive API keys and credentials.
> - All values in the `.env` file are used as defaults when deploying with SAM CLI.
> - For deployments, the template.yaml and samconfig.toml files will use these environment variables automatically.

## Local Development with S3 Upload

To run the Lambda locally with real S3 uploads:

1. Set up your environment:

```powershell
# Run the setup script
.\setup_local_env.ps1
```

2. Run the Lambda directly:

```powershell
# Run the Lambda with S3 upload
python run_with_s3.py
```

This will process the test event in `events/test-event-telegram.json` and upload the resulting podcast to the S3 bucket configured in `.env`.

## Using SAM CLI

You can also use the SAM CLI to run the Lambda locally:

```powershell
# Install SAM CLI if you haven't already
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Run the Lambda with SAM CLI
sam local invoke PodcastGeneratorFunction --event events/test-event-telegram.json --env-vars env.json
```

The `env.json` file is configured to automatically use values from your environment variables (from `.env` file). This ensures that:

1. You don't have to duplicate sensitive information
2. The same values are used consistently across different execution methods
3. You can easily update all configuration values in one place

Note: When using SAM CLI, the Lambda still uses real S3 upload if you've modified the S3Client to remove the local simulation mode.

## Deployment

To deploy the Lambda to AWS:

```powershell
sam build
sam deploy
```

This will deploy the Lambda using the configuration in `samconfig.toml`.

## Configuration

- `.env`: Environment variables for local development
- `env.json`: Environment variables for SAM CLI
- `template.yaml`: SAM template for the Lambda
- `samconfig.toml`: SAM CLI configuration

## API Reference

### Request Format

The Lambda function accepts POST requests with JSON bodies in the following format:

```json
{
  "podcasts": [
    {
      "id": "podcast1",
      "type": "url",
      "urls": [
        "https://example.com/article1",
        "https://example.com/article2"
      ],
      "metadata": {
        "title": "My Podcast",
        "description": "A podcast about interesting topics"
      },
      "conversation_config": {
        "podcast_name": "My Podcast",
        "podcast_tagline": "A podcast about interesting topics",
        "output_language": "en",
        "conversation_style": ["Engaging", "Educational"],
        "host_names": ["Host", "Co-host"],
        "engagement_techniques": ["Storytelling", "Q&A format"],
        "creativity": 0.7
      },
      "longform": true
    }
  ]
}
```

### Podcast Types

The function supports three types of podcasts:

1. **URL Podcasts (`type: "url"`)**
   - Generate podcasts from web content
   - Required fields: `urls` (array of strings)

2. **Text Podcasts (`type: "text"`)**
   - Generate podcasts from raw text
   - Required fields: `text` (string)

3. **Telegram Podcasts (`type: "telegram"`)**
   - Generate podcasts from Telegram message data
   - Required fields: `telegram_data` (object)

### Response Format

The function returns a JSON response with the following structure:

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "message": "Podcast generation completed",
    "results": {
      "podcast1": {
        "error": false,
        "message": "Podcast generated successfully",
        "output_path": "/tmp/podcasts/20230101120000_My_Podcast.mp3",
        "metadata": {
          "title": "My Podcast",
          "description": "A podcast about interesting topics"
        }
      }
    }
  }
}
```

### Transcript Upload

During podcast generation, transcript files are created and stored in the `/tmp/podcastify-demo/transcripts` directory. The Lambda function automatically uploads these transcript files to S3 alongside the audio files.

#### S3 Storage Structure

Transcripts are stored in S3 using the following path structure:

```
s3://[bucket-name]/podcasts/[podcast-id]/[episode-id]/transcripts/[transcript-filename]
```

For example:
```
s3://podcasto-podcasts/podcasts/daily_news/episode_20250327123456/transcripts/transcript_96b61d9302754164b4806cc1f0d34f43.txt
```

This feature enables:
- Preserving valuable transcript data after Lambda execution completes
- Maintaining the relationship between podcasts, episodes, and their transcripts
- Future features like transcript searching, analysis, or display alongside podcast content

For more details, see the [transcript upload documentation](docs/transcript_upload.md).

## Examples

See the `events/` directory for example requests.

## Code Refactoring

The Lambda codebase has been significantly refactored to improve maintainability, reduce code duplication, and simplify the overall structure. The following key improvements were made:

### 1. Standardized Response Handling

- Created a unified `create_api_response` function in `utils/responses.py`
- Eliminated duplicate response handling code throughout the codebase
- Ensured consistent response format for all API endpoints

### 2. Simplified Supabase Client

- Created a reusable `_make_request` helper method to handle common request patterns
- Standardized return values with a consistent format (success/error pattern)
- Removed repetitive code in database operation methods
- Added improved error handling and logging

### 3. Streamlined Configuration Manager

- Removed unused validation code and redundant methods
- Focused on the essential functionality of retrieving podcast configurations
- Improved integration with the Supabase client

### 4. Enhanced SQS Handler

- Updated to work with the new standardized client return values
- Improved error handling and logging
- Removed duplicated processing logic 

### 5. Consistent Logging Format

- Standardized log prefix format across all modules
- Improved request tracing with consistent request ID usage
- Enhanced error reporting and debugging capabilities

These improvements make the codebase more maintainable, easier to understand, and less prone to errors. The code now follows a more consistent pattern throughout the application, with clearer separation of concerns and better error handling. 