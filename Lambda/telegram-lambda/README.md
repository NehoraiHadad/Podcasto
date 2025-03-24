# Telegram Collector Lambda Function

This Lambda function collects messages from Telegram channels based on configurations provided in the event. It processes the messages, extracts media and URLs, and saves the results to S3.

## Features

- Collects messages from Telegram channels
- Processes messages with advanced filtering
- Downloads and uploads media to S3 (configurable by media type)
- Filters URLs based on domain patterns
- Saves results to S3
- Provides detailed statistics

## Directory Structure

```
telegram-lambda/
├── src/                           # Source code for the lambda function
│   ├── __init__.py
│   ├── lambda_handler.py          # Main lambda handler (entry point)
│   ├── config.py                  # Configuration management
│   ├── message_processor.py       # Message processing logic
│   ├── media_handler.py           # Media download and processing
│   ├── channel_processor.py       # Channel processing logic
│   ├── result_formatter.py        # Result formatting and statistics
│   ├── clients/                   # External service clients
│   │   ├── __init__.py
│   │   ├── s3_client.py           # S3 client
│   │   └── telegram_client.py     # Telegram client wrapper
│   └── utils/                     # Utility functions
│       ├── __init__.py
│       └── logging.py             # Logging utilities
├── tests/                         # Test code
│   ├── unit/                      # Unit tests
│   └── integration/               # Integration tests
├── scripts/                       # Utility scripts
├── events/                        # Test event payloads
├── requirements.txt               # Python dependencies
└── README.md                      # Documentation
```

## Prerequisites

- AWS Lambda environment
- Telegram API credentials
- S3 bucket for storing results

## Environment Variables

The following environment variables must be set:

- `TELEGRAM_API_ID`: Your Telegram API ID
- `TELEGRAM_API_HASH`: Your Telegram API hash
- `TELEGRAM_SESSION`: Your Telegram session string
- `S3_BUCKET_NAME`: Your S3 bucket name (default: 'telegram-data-collector')
- `LOG_LEVEL`: Logging level (default: 'INFO')
- `AWS_SAM_LOCAL`: Set to 'true' when running locally
- `SQS_QUEUE_URL`: Your SQS queue URL for podcast processing
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_KEY`: Your Supabase API key

### Setting up environment variables

1. Create a `.env` file from the template:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your credentials:

```
# Telegram API Credentials
TELEGRAM_API_ID=your_telegram_api_id
TELEGRAM_API_HASH=your_telegram_api_hash
TELEGRAM_SESSION=your_telegram_session_string

# AWS Configuration
S3_BUCKET_NAME=your_s3_bucket_name
AWS_SAM_LOCAL=false
SQS_QUEUE_URL=your_sqs_queue_url

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Logging
LOG_LEVEL=INFO
```

> ⚠️ **IMPORTANT**: Never commit your `.env` file to Git. It contains sensitive API keys and credentials.

## Generating a Telegram Session String

To generate a Telegram session string, use the following script:

```python
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

# Replace with your own API credentials
api_id = 12345
api_hash = 'your_api_hash'

with TelegramClient(StringSession(), api_id, api_hash) as client:
    print("Please log in to your Telegram account")
    client.start()
    session_string = client.session.save()
    print(f"Your session string is: {session_string}")
```

## Usage

The Lambda function expects an event with the following structure:

```json
{
  "podcast_config": {
    "id": "your-podcast-config-id",
    "telegram_channel": "channel_username",
    "telegram_hours": 24,
    "filtered_domains": [
      "exact:example.com",
      "contains:badsite",
      "starts:spam.",
      "ends:.ads"
    ],
    "media_types": ["image", "video", "audio", "file"]
  }
}
```

### Configuration Options

#### Podcast Config

- `id` (required): Unique identifier for the podcast configuration
- `telegram_channel` (required): Username of the Telegram channel to collect messages from
- `telegram_hours` (optional): Number of hours to look back for messages (default: 24)

#### Filtered Domains

The `filtered_domains` array allows you to specify domains that should be filtered out from URLs in messages. You can use the following patterns:

- `exact:domain.com` - Matches only the exact domain
- `contains:keyword` - Matches any domain containing the keyword
- `starts:prefix` - Matches domains starting with the prefix
- `ends:suffix` - Matches domains ending with the suffix
- `domain.com` - Default behavior is "contains" if no prefix is specified

#### Media Types

The `media_types` array allows you to specify which types of media should be downloaded and processed. Available options:

- `image` - Process image files (default if not specified)
- `video` - Process video files
- `audio` - Process audio files
- `file` - Process other file types

If not specified, only images will be processed by default.

## Response Format

The function returns a JSON response with the following structure:

```json
{
  "statusCode": 200,
  "body": {
    "message": "Processing completed",
    "results": {
      "podcast-config-id": {
        "message": "Data collected successfully",
        "podcast_config_id": "podcast-config-id",
        "channel": "channel_username",
        "days_back": 1,
        "total_messages": 10,
        "messages_per_channel": {
          "channel_username": 10
        },
        "media_stats": {
          "channel_username": {
            "image": 5,
            "video": 2,
            "audio": 0,
            "file": 1,
            "download_failed": 0
          }
        },
        "url_stats": {
          "channel_username": 3
        },
        "filtered_domains": ["exact:example.com", "contains:badsite"],
        "media_types": ["image", "video"],
        "output_file": "s3://bucket-name/podcast-config-id/episode_20230101_123456/telegram_data.json"
      }
    }
  }
}
```

## S3 Output Structure

The function organizes data in S3 with the following structure:

```
s3://bucket-name/
├── podcast-config-id/
│   ├── episode_20230101_123456/
│   │   ├── images/
│   │   │   ├── photo_12345_20230101.jpg
│   │   │   └── ...
│   │   ├── videos/
│   │   │   ├── video_12345_20230101.mp4
│   │   │   └── ...
│   │   ├── audio/
│   │   │   ├── audio_12345_20230101.mp3
│   │   │   └── ...
│   │   ├── files/
│   │   │   ├── document_12345_20230101.pdf
│   │   │   └── ...
│   │   └── telegram_data.json
```

## Local Development

To run the function locally:

1. Set up your environment variables in `.env` file
2. The function will automatically use these environment variables:
   ```bash
   # Create an env.json file from your .env file
   node scripts/generate-env-json.js # If you have this script, or similar
   
   # Or use the existing env.json which references environment variables
   sam local invoke TelegramCollector --event events/test-event.json --env-vars env.json
   ```

3. For direct invocation (not using SAM):
   ```python
   python -c "from src.lambda_handler import lambda_handler; lambda_handler({'podcast_config': {'id': 'test', 'telegram_channel': 'your_channel'}}, None)"
   ```

> **Note**: The `env.json` file is configured to automatically use values from your environment variables (from `.env` file). This ensures consistent configuration across different execution methods.

## Deployment with AWS SAM

1. Build the function:
   ```
   sam build --use-container
   ```

2. Deploy the function:
   ```
   sam deploy --stack-name podcasto-telegram-collector
   ```

3. Invoke the function:
   ```
   aws lambda invoke --function-name TelegramCollector --cli-binary-format raw-in-base64-out --payload file://events/test_event.json response.json
   ```

## Error Handling

The function includes comprehensive error handling:

- If a podcast configuration is not valid, it returns a 400 status code
- If there's an error processing a specific configuration, it continues with the others
- If there's a global error, it returns a 500 status code with the error message

## Limitations

- The function is limited to processing 100 messages per channel to prevent timeouts
- Media downloads are limited to 5 concurrent downloads to prevent memory issues
- The function requires a valid Telegram session string to authenticate 