# Lambda Timeout Protection - Implementation Summary

## Overview

Implementation of timeout protection and smart retry logic to prevent episodes from getting stuck in "processing" status when Gemini TTS API hangs or times out.

**Date**: 2025-10-27
**Issue**: Episode 48bac616 stuck in processing
**Root Cause**: Gemini TTS API hung for 14+ minutes (normal: 60-86 seconds)
**Deployment**: Automatic via GitHub Actions on commit/push

---

## Changes Summary

### 1. TTS Client Updates (`shared-layer/python/shared/services/tts_client.py`)

✅ **Added**:
- `DeferrableError` exception class for transient errors
- `TTS_CALL_TIMEOUT_SECONDS = 480` (8 minutes - allows for legitimate slow responses)
- `_call_gemini_with_timeout()` method with concurrent.futures protection
- Smart error handling for 500 vs 429 errors
- Reduced retries from 3 to 2 attempts (max_retries: 2→1)
- Proactive timeout detection: Requires 10 minutes remaining before starting processing

✅ **Error Handling Logic**:
- **Timeout (480s/8min)**: Raise `DeferrableError` → Defer to script_ready
- **429 Rate Limit**: Convert to `DeferrableError` → Defer (no immediate retry)
- **500 Internal Error**: 1 immediate retry → Then defer if still fails
- **Other Errors**: Propagate immediately (no retry)
- **Insufficient Time**: If <10 minutes remaining at start, defer immediately

### 2. Audio Handler Updates (`audio-generation-lambda/src/handlers/audio_generation_handler.py`)

✅ **Added**:
- Import `DeferrableError` from `shared.services.tts_client`
- Separate exception handler for `DeferrableError`
- Return episode to `script_ready` status (not `failed`)
- ReportBatchItemFailures pattern for partial SQS batch success

### 3. SAM Template Updates (`audio-generation-lambda/template.yaml`)

✅ **Added**:
```yaml
FunctionResponseTypes:
  - ReportBatchItemFailures
```

---

## Deployment

### Automatic Deployment

Code changes are deployed automatically via GitHub Actions on commit/push to master branch.

### Post-Deployment: Configure SQS (One-time setup)

After the Lambda is deployed, configure the SQS queue settings using AWS CLI:

#### 1. Set Visibility Timeout (6x Lambda timeout)

```bash
# Dev environment
aws sqs set-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/638520701769/audio-generation-queue-dev \
  --attributes VisibilityTimeout=5400 \
  --region us-east-1

# Prod environment
aws sqs set-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/638520701769/audio-generation-queue \
  --attributes VisibilityTimeout=5400 \
  --region us-east-1
```

#### 2. Create Dead Letter Queue (if doesn't exist)

```bash
# Dev
aws sqs create-queue \
  --queue-name audio-generation-queue-dlq-dev \
  --attributes MessageRetentionPeriod=1209600 \
  --region us-east-1

# Prod
aws sqs create-queue \
  --queue-name audio-generation-queue-dlq \
  --attributes MessageRetentionPeriod=1209600 \
  --region us-east-1
```

#### 3. Configure Redrive Policy (maxReceiveCount=3)

```bash
# Get DLQ ARN first
DLQ_ARN=$(aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/638520701769/audio-generation-queue-dlq-dev \
  --attribute-names QueueArn \
  --region us-east-1 \
  --query 'Attributes.QueueArn' \
  --output text)

# Set redrive policy
aws sqs set-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/638520701769/audio-generation-queue-dev \
  --attributes RedrivePolicy="{\"deadLetterTargetArn\":\"$DLQ_ARN\",\"maxReceiveCount\":3}" \
  --region us-east-1
```

---

## Verification

### Check SQS Configuration

```bash
# Verify visibility timeout
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/638520701769/audio-generation-queue-dev \
  --attribute-names VisibilityTimeout \
  --query 'Attributes.VisibilityTimeout' \
  --output text
# Expected: 5400

# Verify redrive policy
aws sqs get-queue-attributes \
  --queue-url https://sqs.us-east-1.amazonaws.com/638520701769/audio-generation-queue-dev \
  --attribute-names RedrivePolicy \
  --query 'Attributes.RedrivePolicy' \
  --output text
# Expected: {"deadLetterTargetArn":"arn:aws:sqs:us-east-1:638520701769:audio-generation-queue-dlq-dev","maxReceiveCount":3}
```

### 3. Test Episode Generation

Generate a new episode and monitor:

```bash
# Watch CloudWatch logs
aws logs tail /aws/lambda/podcasto-audio-generation-dev --follow

# Check episode status in Supabase
# Episodes should show 'script_ready' if deferred, not 'failed'

# Check processing logs for deferrals
# Look for: "deferred": true
```

---

## Monitoring

### CloudWatch Logs to Watch For

**Success**:
```
[TTS_CLIENT] ✅ Chunk 1 completed successfully: 78.5s
[AUDIO_GEN] Successfully generated audio for episode <id>
```

**Timeout Protection Triggered** (>8 minutes):
```
[TTS_CLIENT] Gemini API call timed out after 480s
[TTS_CLIENT] Background thread may still be running (Python limitation)
[TTS_CLIENT] Chunk 1 needs deferral: Gemini TTS API hung for >480s
[AUDIO_GEN] DeferrableError: Gemini TTS API hung for >480s
[AUDIO_GEN] Returning episode <id> to script_ready for retry
```

**Slow but OK** (5-7 minutes):
```
[TTS_CLIENT] ✅ Chunk 1 completed successfully: 420.5s
```

**Rate Limit (429)**:
```
[TTS_CLIENT] Rate limit (429) - Google suggests 60s delay
[AUDIO_GEN] Episode <id> deferred - will return to SQS for retry
```

**500 Error with Retry**:
```
[TTS_CLIENT] Google internal error (500) - transient error
[TTS_CLIENT] 500 error - will retry chunk 1 (attempt 2/2)
# If still fails:
[TTS_CLIENT] 500 error persists after retries - converting to DeferrableError
```

### Database Monitoring

**Check Deferred Episodes**:
```sql
SELECT
  episode_id,
  stage,
  status,
  error_message,
  error_details,
  started_at,
  completed_at
FROM episode_processing_logs
WHERE stage = 'audio_processing'
  AND status = 'failed'
  AND error_details::jsonb->>'deferred' = 'true'
ORDER BY started_at DESC
LIMIT 10;
```

**Check Episodes Returned to script_ready**:
```sql
SELECT
  id,
  title,
  status,
  updated_at,
  error_message
FROM episodes
WHERE status = 'script_ready'
  AND error_message LIKE 'Deferred:%'
ORDER BY updated_at DESC
LIMIT 10;
```

---

## Performance Impact

### Before This Update

- **Retry attempts**: 4 (wasted time on unrecoverable errors)
- **Timeout protection**: None (Lambda killed after 15 minutes)
- **Error handling**: All errors treated the same
- **Episode outcome**: Stuck in "processing" or marked as "failed"

### After This Update

- **Retry attempts**: 2 (only for transient 500 errors)
- **Timeout protection**: 480s per chunk (8 minutes - allows slow but valid responses)
- **Error handling**: Smart (429/timeout deferred, 500 retried once)
- **Episode outcome**: Returns to "script_ready" for automatic retry
- **Proactive checks**: Won't start if <10 minutes remaining

### Expected Improvements

- ✅ No more stuck episodes
- ✅ Allows legitimate slow responses (5-7 minutes)
- ✅ Faster failure detection for real hangs (>8 minutes)
- ✅ Reduced API quota waste (fewer retry attempts)
- ✅ Automatic episode recovery (script_ready retry)
- ✅ Better visibility (CloudWatch logs show DeferrableError)

---

## Related Documentation

- [Timeout Strategy (Hebrew)](./TIMEOUT_STRATEGY.md) - Detailed explanation of timeout implementation
- AWS Lambda Best Practices: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- SQS Visibility Timeout: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html
- ReportBatchItemFailures: https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#services-sqs-batchfailurereporting
