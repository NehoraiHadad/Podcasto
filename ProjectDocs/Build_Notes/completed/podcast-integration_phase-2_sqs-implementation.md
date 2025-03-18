# SQS Queue Implementation for Podcast Processing

## Task Objective
Implement SQS queue-based communication between the telegram-lambda and podcastfy-lambda to enable asynchronous, fault-tolerant podcast processing.

## Current State Assessment
The telegram-lambda and podcastfy-lambda functions are currently communicating directly. The telegram-lambda collects data, and the podcastfy-lambda is triggered directly to process the data. This approach lacks error handling, retry capabilities, and could lead to lost data if the podcastfy-lambda fails.

## Future State Goal
Implement an asynchronous communication system using SQS, where telegram-lambda sends messages to a queue, and podcastfy-lambda consumes these messages. This will provide better error handling, automatic retries, and dead letter queue functionality for failed messages.

## Implementation Plan

1. **SQS Queue Setup** ✅
   - [x] Create main processing queue (podcast-processing-queue)
   - [x] Create dead letter queue (podcast-processing-dlq)
   - [x] Configure redrive policy with maxReceiveCount of 3
   - [x] Create JSON configuration file for the SQS settings

2. **Telegram Lambda Updates** ✅
   - [x] Create SQS client utility in src/clients/sqs_client.py
   - [x] Update lambda_handler.py to send messages to SQS
   - [x] Add boto3 to requirements.txt
   - [x] Update template.yml with SQS permissions and queue configuration

3. **Podcastfy Lambda Updates** ✅
   - [x] Update template.yaml to add SQS event trigger
   - [x] Modify lambda_handler.py to process SQS events
   - [x] Add separate handlers for SQS events and direct API calls
   - [x] Update S3 client to use consistent folder structure
   - [x] Create SQSHandler for processing SQS messages
   - [x] Add download_telegram_content method to S3Client

4. **Scheduler Lambda Updates** ✅
   - [x] Update template.yaml to add SQS permissions
   - [x] Modify lambda_handler.py to work with SQS-based architecture
   - [x] Add SQS status checking functionality
   - [x] Update podcast processing workflow to use SQS messaging

5. **Admin Interface Updates** ✅
   - [x] Add a "Generate Episode Now" button in the admin interface
   - [x] Create server action to trigger the podcast generation
   - [x] Add status indicators for podcast generation process
   - [x] Create API endpoint for checking generation status

6. **Testing and Deployment**
   - [ ] Deploy the updated Lambda functions to AWS
   - [ ] Test the telegram-lambda to verify messages are sent to SQS
   - [ ] Monitor the SQS queue to ensure messages are being received
   - [ ] Verify podcastfy-lambda processes messages from the queue
   - [ ] Test error scenarios to verify dead letter queue functionality
   - [ ] Test the admin interface podcast generation functionality

## Technical Details

### SQS Queue Configuration
The SQS queue is configured with the following properties:
- Main Queue: podcast-processing-queue
- Dead Letter Queue: podcast-processing-dlq
- Max Receive Count: 3 (message will be moved to DLQ after 3 failed processing attempts)

### Message Format
Messages sent from telegram-lambda to SQS have the following format:
```json
{
  "podcast_config_id": "<podcast_id>",
  "result": {
    // Result data from telegram processing
  },
  "timestamp": "<processing_timestamp>",
  "s3_path": "podcasts/<podcast_id>/<timestamp>/"
}
```

### Lambda Function Changes
1. telegram-lambda:
   - New SQS client created for sending messages
   - Lambda handler updated to send messages to SQS
   - Updated S3 client to use consistent folder structure
   - IAM permissions added for SQS access

2. podcastfy-lambda:
   - Added SQS event trigger
   - Updated handler to distinguish between SQS events and direct API calls
   - Added specific handler for SQS message processing
   - Updated S3 client to use consistent folder structure
   - Added method to download telegram content from S3
   - Modified podcast processor to handle SQS message data

3. podcast-scheduler:
   - Updated to work with SQS-based architecture
   - Added status checking functionality
   - Removed direct invocation of podcastfy-lambda

### Admin Interface Updates
1. Added "Generate Episode Now" button to podcast actions menu
2. Created server action to trigger immediate podcast generation
3. Added status indicator component to display generation status
4. Created API endpoint for checking generation status

## Next Steps
1. Deploy the updated Lambda functions
2. Set up proper monitoring and alerting for the SQS queue
3. Conduct thorough testing of the entire workflow
4. Document the new architecture for future reference 