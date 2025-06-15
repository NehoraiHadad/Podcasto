# Audio Generation Lambda

AWS Lambda function for generating podcast audio using Google Gemini 2.5 Flash TTS. This function processes SQS messages to generate multi-speaker podcast episodes with natural conversation flow.

## Architecture

- **SQS Queue**: Receives episode generation requests from Vercel
- **Lambda Function**: Processes episodes using Google services
- **S3**: Stores generated audio files and retrieves Telegram data
- **Supabase**: Updates episode status and metadata

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **SAM CLI** installed for deployment
3. **Google Gemini API key** with access to Gemini 2.5 Flash TTS
4. **Supabase** database with episodes and podcast_configs tables

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure AWS Secrets Manager

Store your secrets in AWS Secrets Manager with the name `podcasto-secrets`:

```json
{
  "SUPABASE_URL": "your-supabase-url",
  "SUPABASE_SERVICE_KEY": "your-service-key",
  "GEMINI_API_KEY": "your-gemini-api-key"
}
```

### 3. Deploy Lambda

```bash
# Deploy to dev environment
./deploy.sh dev

# Deploy to production
./deploy.sh prod
```

### 4. Configure Vercel Environment Variables

Add these variables to your Vercel environment:

```
AUDIO_GENERATION_QUEUE_URL=<sqs-queue-url-from-deployment>
AWS_ACCESS_KEY_ID=<your-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret-key>
AWS_REGION=<your-aws-region>
```

## Message Format

The Lambda expects SQS messages with this format:

```json
{
  "episode_id": "uuid-of-episode",
  "podcast_id": "uuid-of-podcast",
  "s3_path": "optional-custom-s3-path",
  "timestamp": "2024-01-01T00:00:00Z",
  "source": "vercel_trigger"
}
```

## Processing Flow

1. Receive SQS message with episode details
2. Update episode status to 'processing'
3. Retrieve episode and podcast configuration from Supabase
4. Fetch Telegram data from S3 with retry logic
5. Prepare conversational podcast script from Telegram messages
6. Generate multi-speaker audio using Google Gemini 2.5 Flash TTS
7. Stream and combine audio chunks into WAV format
8. Upload audio to S3
9. Update episode with audio URL and completion status

## Error Handling

- Failed episodes are marked with status 'failed'
- Error details are stored in episode metadata
- Dead letter queue captures messages that fail repeatedly
- Retry logic handles temporary S3 data unavailability

## Monitoring

- CloudWatch logs capture all processing details
- SQS metrics show queue depth and processing rates
- Lambda metrics show execution duration and errors

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Test the Google TTS integration
export GEMINI_API_KEY=your_api_key
python test-local.py

# Local SAM testing
sam local start-api
```

## File Structure

```
src/
├── handlers/
│   └── audio_generation_handler.py    # Main Lambda handler
├── clients/
│   ├── supabase_client.py             # Database operations
│   ├── s3_client.py                   # S3 file operations
│   └── telegram_data_client.py        # Telegram data retrieval
├── services/
│   └── google_podcast_generator.py    # Google AI integration
└── utils/
    └── logging.py                     # Logging configuration
```

## Troubleshooting

### Common Issues

1. **Gemini API key not found**
   - Ensure `GEMINI_API_KEY` is properly set in AWS Secrets Manager
   - Verify the API key has access to Gemini 2.5 Flash TTS model

2. **Audio generation timeout**
   - Check Lambda timeout settings (current: 15 minutes)
   - Monitor memory usage during audio processing
   - Consider splitting large episodes into smaller chunks

3. **S3 data not found**
   - Check if Telegram Lambda has processed the episode
   - Verify S3 bucket permissions and naming conventions

4. **Supabase connection errors**
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
   - Check database table schemas match expected format

### Debugging

Enable debug logging by setting environment variable:
```
LOG_LEVEL=DEBUG
```

### Performance Tuning

- Adjust Lambda memory allocation based on audio generation needs
- Monitor timeout settings for longer episodes
- Consider batch processing for multiple episodes 