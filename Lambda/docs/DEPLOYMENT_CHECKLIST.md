# Deployment Checklist - Single-Speaker Feature

This checklist ensures proper deployment of the single-speaker podcast format feature across all Lambda functions.

## Pre-Deployment Verification

### Code Changes Review

- [ ] **Telegram Lambda**
  - [ ] `src/config.py` includes `podcast_format` field in PodcastConfig
  - [ ] `src/clients/sqs_client.py` includes `podcast_format` in SQS message
  - [ ] `src/lambda_handler.py` passes `podcast_format` to SQS client
  - [ ] Logging includes format tracking

- [ ] **Script Preprocessor Lambda**
  - [ ] `src/handlers/script_preprocessor_handler.py` extracts and validates `podcast_format`
  - [ ] Format passed to script generation service
  - [ ] Format included in `dynamic_config` for Audio Lambda
  - [ ] Logging includes format tracking

- [ ] **Audio Generation Lambda**
  - [ ] `src/handlers/audio_generation_handler.py` extracts and validates `podcast_format`
  - [ ] Format passed to audio generation service
  - [ ] Single-speaker handling implemented
  - [ ] Logging includes format tracking

- [ ] **Shared Layer**
  - [ ] Voice configuration manager supports single-speaker
  - [ ] Google Podcast Generator handles both formats
  - [ ] Script generator handles both formats

### Testing

- [ ] Unit tests passing (if exist)
- [ ] Local testing completed with SAM CLI
- [ ] Integration tests pass (script generation → audio generation)
- [ ] Backward compatibility verified (multi-speaker still works)

### Documentation

- [ ] SQS message schemas documented
- [ ] Database schema includes podcast_format column
- [ ] README updated with format information
- [ ] API documentation updated

---

## Deployment Steps

### Environment: Development

#### 1. Deploy Shared Layer

```bash
cd /home/ubuntu/projects/podcasto/Lambda/shared-layer
./deploy.sh
```

**Verification:**
- [ ] Layer version updated in AWS Lambda console
- [ ] No errors in deployment logs
- [ ] Layer ARN captured for other Lambda deployments

---

#### 2. Deploy Script Preprocessor Lambda

```bash
cd /home/ubuntu/projects/podcasto/Lambda/script-preprocessor-lambda
./deploy.sh dev
```

**Verification:**
- [ ] Lambda function updated successfully
- [ ] Environment variables correct (GEMINI_API_KEY, etc.)
- [ ] Timeout set appropriately (recommended: 5 minutes)
- [ ] Memory allocation sufficient (recommended: 1024 MB)
- [ ] Dead Letter Queue configured
- [ ] CloudWatch Logs group exists

**Test:**
```bash
# Send test message to script-generation-queue with podcast_format
aws sqs send-message \
  --queue-url <SCRIPT_GENERATION_QUEUE_URL> \
  --message-body '{
    "episode_id": "test-001",
    "podcast_id": "test-podcast-001",
    "podcast_config_id": "test-config-001",
    "podcast_format": "single-speaker",
    "s3_path": "s3://bucket/test/telegram_data.json",
    "timestamp": "2024-01-31T12:00:00Z"
  }'
```

Check CloudWatch Logs for:
- [ ] `[SCRIPT_PREP] Episode test-001 podcast_format: single-speaker`
- [ ] Script generation successful
- [ ] Message sent to audio-generation-queue

---

#### 3. Deploy Audio Generation Lambda

```bash
cd /home/ubuntu/projects/podcasto/Lambda/audio-generation-lambda
./deploy.sh dev
```

**Verification:**
- [ ] Lambda function updated successfully
- [ ] Environment variables correct (GEMINI_API_KEY, API_BASE_URL, etc.)
- [ ] Timeout set appropriately (recommended: 15 minutes)
- [ ] Memory allocation sufficient (recommended: 2048 MB)
- [ ] Dead Letter Queue configured
- [ ] CloudWatch Logs group exists
- [ ] SQS trigger configured with ReportBatchItemFailures

**Test:**
```bash
# Send test message to audio-generation-queue with single-speaker format
aws sqs send-message \
  --queue-url <AUDIO_GENERATION_QUEUE_URL> \
  --message-body '{
    "episode_id": "test-001",
    "podcast_id": "test-podcast-001",
    "podcast_config_id": "test-config-001",
    "script_url": "s3://bucket/test/script.txt",
    "dynamic_config": {
      "podcast_format": "single-speaker",
      "speaker1_role": "Narrator",
      "speaker2_role": null,
      "speaker1_voice": "Alnilam",
      "speaker2_voice": null,
      "speaker1_gender": "male",
      "speaker2_gender": null,
      "language": "he",
      "content_type": "news",
      "content_analysis": {}
    },
    "timestamp": "2024-01-31T12:05:00Z"
  }'
```

Check CloudWatch Logs for:
- [ ] `[AUDIO_GEN] Episode test-001 podcast_format: single-speaker`
- [ ] Audio generation successful with single voice
- [ ] Episode status updated to 'completed'

---

#### 4. Deploy Telegram Lambda

```bash
cd /home/ubuntu/projects/podcasto/Lambda/telegram-lambda
./deploy.sh dev
```

**Verification:**
- [ ] Lambda function updated successfully
- [ ] Environment variables correct (TELEGRAM_API_ID, TELEGRAM_API_HASH, etc.)
- [ ] Timeout set appropriately (recommended: 5 minutes)
- [ ] Memory allocation sufficient (recommended: 512 MB)
- [ ] SQS queue URL configured
- [ ] CloudWatch Logs group exists

**Test:**
```bash
# Invoke Telegram Lambda with single-speaker podcast
aws lambda invoke \
  --function-name telegram-lambda-dev \
  --payload '{
    "podcast_config": {
      "id": "test-config-001",
      "telegram_channel": "test_channel",
      "podcast_format": "single-speaker"
    },
    "episode_id": "test-001",
    "podcast_id": "test-podcast-001"
  }' \
  response.json
```

Check CloudWatch Logs for:
- [ ] `[TELEGRAM_LAMBDA] Episode test-001 podcast_format: single-speaker`
- [ ] SQS message sent to script-generation-queue
- [ ] Message includes `podcast_format` field

---

### Environment: Production

Repeat all steps above with `prod` environment:

1. **Pre-Production Checklist:**
   - [ ] All dev tests passed successfully
   - [ ] Regression tests passed (multi-speaker still works)
   - [ ] Load testing completed (if applicable)
   - [ ] Rollback plan documented
   - [ ] Monitoring alerts configured

2. **Deploy in Order:**
   ```bash
   # 1. Shared Layer
   cd Lambda/shared-layer && ./deploy.sh

   # 2. Script Preprocessor
   cd ../script-preprocessor-lambda && ./deploy.sh prod

   # 3. Audio Generation
   cd ../audio-generation-lambda && ./deploy.sh prod

   # 4. Telegram Lambda
   cd ../telegram-lambda && ./deploy.sh prod
   ```

3. **Production Verification:**
   - [ ] Create real single-speaker podcast in UI
   - [ ] Trigger episode generation
   - [ ] Monitor CloudWatch Logs through entire pipeline
   - [ ] Verify audio generated with single voice
   - [ ] Download and play audio to confirm quality
   - [ ] Check episode status in database

---

## Post-Deployment Verification

### CloudWatch Monitoring

Check these CloudWatch Log Groups:

1. **Telegram Lambda Logs:** `/aws/lambda/telegram-lambda-{env}`
   ```
   SEARCH "[TELEGRAM_LAMBDA] podcast_format"
   ```
   - [ ] Format logged correctly
   - [ ] No errors related to format

2. **Script Preprocessor Logs:** `/aws/lambda/script-preprocessor-{env}`
   ```
   SEARCH "[SCRIPT_PREP] podcast_format"
   ```
   - [ ] Format extracted from SQS message
   - [ ] Format passed to script generator
   - [ ] Format included in dynamic_config

3. **Audio Generation Logs:** `/aws/lambda/audio-generation-{env}`
   ```
   SEARCH "[AUDIO_GEN] podcast_format"
   ```
   - [ ] Format extracted from dynamic_config
   - [ ] Single-speaker routing works correctly
   - [ ] Audio generation successful

### SQS Queue Monitoring

Check these SQS queues:

1. **Script Generation Queue:**
   - [ ] Messages processed successfully
   - [ ] No messages in DLQ
   - [ ] Average processing time acceptable

2. **Audio Generation Queue:**
   - [ ] Messages processed successfully
   - [ ] No messages in DLQ
   - [ ] Average processing time acceptable
   - [ ] Deferred messages retry correctly

### Database Verification

```sql
-- Check podcast_format values
SELECT id, title, podcast_format, created_at
FROM podcast_configs
WHERE podcast_format = 'single-speaker'
LIMIT 10;

-- Check episodes with single-speaker format
SELECT e.id, e.title, e.status, p.podcast_format, e.created_at
FROM episodes e
JOIN podcasts pod ON e.podcast_id = pod.id
JOIN podcast_configs p ON pod.id = p.podcast_id
WHERE p.podcast_format = 'single-speaker'
ORDER BY e.created_at DESC
LIMIT 10;

-- Check episode metadata for voice information
SELECT id, title, metadata->>'podcast_format' as format,
       metadata->>'speaker1_voice' as voice,
       status
FROM episodes
WHERE metadata->>'podcast_format' = 'single-speaker'
LIMIT 10;
```

### End-to-End Test

**Test Single-Speaker Episode:**

1. Create test podcast:
   ```sql
   INSERT INTO podcast_configs (id, podcast_id, podcast_format, telegram_channel, speaker1_role, speaker1_gender, language)
   VALUES (gen_random_uuid(), (SELECT id FROM podcasts WHERE title = 'Test Single-Speaker'), 'single-speaker', 'test_channel', 'Narrator', 'male', 'he');
   ```

2. Trigger episode via Admin UI or API
3. Monitor CloudWatch Logs for all three Lambdas
4. Verify logs show format at each stage:
   - [ ] Telegram Lambda: `podcast_format: single-speaker`
   - [ ] Script Preprocessor: `podcast_format: single-speaker`
   - [ ] Audio Generation: `podcast_format: single-speaker`
5. Check episode status progresses: `pending` → `content_collected` → `script_ready` → `processing` → `completed`
6. Download audio file from S3
7. Play audio and verify:
   - [ ] Single consistent voice throughout
   - [ ] No speaker transitions
   - [ ] Audio quality acceptable
   - [ ] Duration matches expected length

**Test Multi-Speaker Regression:**

1. Create test podcast with `podcast_format = 'multi-speaker'`
2. Trigger episode generation
3. Verify:
   - [ ] Two distinct voices in audio
   - [ ] Natural conversation flow
   - [ ] No degradation from previous behavior

---

## Rollback Plan

If issues are detected post-deployment:

### Option 1: Quick Rollback (AWS Console)

1. Go to AWS Lambda console
2. For each affected Lambda:
   - Click on function name
   - Go to "Versions" tab
   - Select previous version
   - Click "Actions" → "Publish new version as $LATEST"

### Option 2: Redeploy Previous Version (CLI)

```bash
# Get previous version ARN
aws lambda list-versions-by-function --function-name telegram-lambda-prod

# Update alias to previous version
aws lambda update-alias \
  --function-name telegram-lambda-prod \
  --name prod \
  --function-version <previous-version>

# Repeat for other Lambdas
```

### Option 3: Code Revert

```bash
# Revert to previous commit
git revert HEAD

# Redeploy all Lambdas
cd Lambda/telegram-lambda && ./deploy.sh prod
cd ../script-preprocessor-lambda && ./deploy.sh prod
cd ../audio-generation-lambda && ./deploy.sh prod
```

---

## Troubleshooting

### Issue: Format not appearing in logs

**Symptom:** CloudWatch logs don't show `podcast_format` field

**Fix:**
1. Check SQS message body in AWS Console
2. Verify podcast_config in database has correct format
3. Verify Lambda environment variables
4. Redeploy Lambda with latest code

### Issue: Single-speaker episodes using two voices

**Symptom:** Audio has multiple voices when format is single-speaker

**Fix:**
1. Check CloudWatch logs for format detection
2. Verify `dynamic_config.podcast_format` in SQS message
3. Check audio generation logic in GooglePodcastGenerator
4. Verify speaker2_voice is null in message

### Issue: Messages stuck in queue

**Symptom:** SQS messages not being processed

**Fix:**
1. Check Lambda timeout settings
2. Check Lambda error logs in CloudWatch
3. Check DLQ for failed messages
4. Verify SQS trigger is enabled
5. Check Lambda concurrency limits

---

## Success Criteria

Deployment is considered successful when:

- [ ] All Lambdas deployed without errors
- [ ] CloudWatch logs show format tracking at all stages
- [ ] Test single-speaker episode generates successfully
- [ ] Test multi-speaker episode still works (regression passed)
- [ ] No error spikes in CloudWatch metrics
- [ ] No messages in Dead Letter Queues
- [ ] Database shows correct format values
- [ ] Audio quality is acceptable for both formats
- [ ] End-to-end test completes in expected time
- [ ] Production traffic shows no increased errors

---

## Contact

For deployment issues or questions:
- Check `/Lambda/docs/SQS_MESSAGE_SCHEMAS.md` for message format
- Review CloudWatch Logs for detailed error messages
- Consult `/ProjectDocs/Build_Notes/` for implementation details

---

## Version History

| Version | Date | Environment | Deployed By | Notes |
|---------|------|-------------|-------------|-------|
| 1.0 | 2025-10-28 | Dev | Pipeline Integration | Initial deployment with podcast_format support |

