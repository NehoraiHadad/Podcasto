# Podcast Scheduler Lambda

This Lambda function checks which podcasts need new episodes based on their frequency and triggers the appropriate processes to generate them.

## Features

- Automatically schedules podcast creation based on configured frequency
- Integrates with Telegram Collector and Podcast Generator Lambdas
- Manages podcast scheduling through Supabase database
- Sends messages to SQS for podcast processing

## Prerequisites

- AWS Lambda environment
- Supabase database with podcast configurations
- AWS SAM CLI for local development and deployment

## Environment Variables

The following environment variables must be set:

- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_KEY`: Your Supabase API key
- `TELEGRAM_LAMBDA_NAME`: Name of the Telegram Collector Lambda function
- `AUDIO_LAMBDA_NAME`: Name of the Podcast Generator Lambda function
- `SQS_QUEUE_URL`: URL of the SQS queue for podcast processing

### Setting up environment variables

1. Create a `.env` file from the template:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your credentials:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Lambda Configuration
TELEGRAM_LAMBDA_NAME=your_telegram_lambda_name
AUDIO_LAMBDA_NAME=your_audio_lambda_name

# SQS Configuration
SQS_QUEUE_URL=your_sqs_queue_url
```

> ⚠️ **IMPORTANT**: Never commit your `.env` file to Git. It contains sensitive API keys and credentials.

## Local Development

To run the function locally:

1. Set up your environment variables in `.env`
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the function using SAM CLI:

```bash
sam local invoke PodcastSchedulerFunction --env-vars env.json
```

The `env.json` file is configured to automatically use values from your environment variables (from `.env` file). This ensures:

- You don't have to duplicate sensitive information
- The same values are used consistently across different execution methods
- You can easily update all configuration values in one place

## Deployment with AWS SAM

1. Build the function:
```bash
sam build
```

2. Deploy the function:
```bash
sam deploy
```

This will deploy the function using the configuration in `samconfig.toml`.

## Configuration

The Lambda function relies on a Supabase database table that contains podcast configurations, including:

- Podcast ID
- Schedule frequency (daily, weekly, etc.)
- Last generated date
- Channel configurations
- Content filters

## Note on Sensitive Data

All API keys and credentials should be stored in environment variables, never in the codebase. The template.yaml file and samconfig.toml should reference these environment variables rather than containing actual sensitive values.

When deploying, the SAM CLI will use the values from your local environment or parameter store. 