# Podcastfy Lambda

This Lambda function generates podcasts from various inputs (URLs, text, Telegram data) and uploads them to S3.

## Features

- Generate podcasts from URLs
- Generate podcasts from raw text
- Generate podcasts from Telegram message data
- Customizable conversation styles and engagement techniques
- Support for longform podcasts

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

4. Edit the `.env` file with your Podcastfy API key

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

## Examples

See the `events/` directory for example requests. 