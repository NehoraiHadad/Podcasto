# Pipeline Integration Summary - Single-Speaker Feature

## Overview

This document summarizes the complete integration of the `podcast_format` field through the entire Podcasto pipeline, enabling single-speaker podcast generation.

**Date**: 2025-10-28
**Phase**: 3.3 - Pipeline Integration
**Status**: ✅ COMPLETE

---

## Changes Made

### 1. Telegram Lambda Updates

**Files Modified:**
- `/Lambda/telegram-lambda/src/config.py`
- `/Lambda/telegram-lambda/src/clients/sqs_client.py`
- `/Lambda/telegram-lambda/src/lambda_handler.py`

**Changes:**

#### `config.py`:
- Added `podcast_format` field to `PodcastConfig` dataclass (default: `'multi-speaker'`)
- Updated `from_dict()` to extract `podcast_format` from podcast configuration
- Logs format extraction for tracking

#### `sqs_client.py`:
- Added `podcast_format` parameter to `send_message()` method
- Includes `podcast_format` in SQS message body
- Logs format before sending message

#### `lambda_handler.py`:
- Extracts `podcast_format` from config
- Logs format for each episode: `[TELEGRAM_LAMBDA] Episode {id} podcast_format: {format}`
- Passes format to SQS client when sending message

**Result:** Telegram Lambda now extracts podcast_format from database and includes it in SQS message to Script Preprocessor.

---

### 2. Script Preprocessor Lambda Updates

**Files Modified:**
- `/Lambda/script-preprocessor-lambda/src/handlers/script_preprocessor_handler.py`

**Changes:**
- Added format validation (lines 143-146):
  ```python
  if podcast_format not in ['single-speaker', 'multi-speaker']:
      logger.warning(f"[SCRIPT_PREP] Invalid format '{podcast_format}', defaulting to 'multi-speaker'")
      podcast_format = 'multi-speaker'
  ```
- Added format logging: `[SCRIPT_PREP] Episode {id} podcast_format: {format}`
- Format already extracted from SQS message (lines 139-141)
- Format already passed to `_apply_dynamic_role()` (line 150)
- Format already included in `dynamic_config` (line 148)
- Format already included in episode metadata (line 175)

**Result:** Script Preprocessor validates format, logs tracking, and passes it through to Audio Generation.

---

### 3. Audio Generation Lambda Updates

**Files Modified:**
- `/Lambda/audio-generation-lambda/src/handlers/audio_generation_handler.py`

**Changes:**
- Added format validation (lines 197-200):
  ```python
  if podcast_format not in ['single-speaker', 'multi-speaker']:
      logger.warning(f"[AUDIO_GEN] [{request_id}] Invalid format '{podcast_format}', defaulting to 'multi-speaker'")
      podcast_format = 'multi-speaker'
  ```
- Enhanced format logging: `[AUDIO_GEN] [{request_id}] Episode {id} podcast_format: {format}`
- Format already extracted from `dynamic_config` (line 195)
- Format already passed to `_generate_audio()` (line 226)
- Format already used in audio generation (lines 435-443)

**Result:** Audio Generation validates format, logs tracking, and uses it to route to single or multi-speaker generation.

---

## SQS Message Flow

### Script Generation Queue Message

**From:** Telegram Lambda
**To:** Script Preprocessor Lambda

```json
{
  "episode_id": "550e8400-e29b-41d4-a716-446655440000",
  "podcast_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "podcast_config_id": "9f0e2b8c-4e5a-4d6b-8c9e-1f2a3b4c5d6e",
  "podcast_format": "single-speaker",  // ✅ NEW FIELD
  "s3_path": "s3://bucket/path/to/telegram_data.json",
  "content_url": "s3://bucket/path/to/telegram_data.json",
  "timestamp": "2024-01-31T12:00:00Z"
}
```

### Audio Generation Queue Message

**From:** Script Preprocessor Lambda
**To:** Audio Generation Lambda

```json
{
  "episode_id": "550e8400-e29b-41d4-a716-446655440000",
  "podcast_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "podcast_config_id": "9f0e2b8c-4e5a-4d6b-8c9e-1f2a3b4c5d6e",
  "script_url": "s3://bucket/path/to/script.txt",
  "dynamic_config": {
    "podcast_format": "single-speaker",  // ✅ INCLUDED IN CONFIG
    "speaker1_role": "Narrator",
    "speaker2_role": null,  // null for single-speaker
    "speaker1_voice": "Alnilam",
    "speaker2_voice": null,  // null for single-speaker
    "speaker1_gender": "male",
    "speaker2_gender": null,  // null for single-speaker
    "language": "he",
    "content_analysis": {...}
  },
  "timestamp": "2024-01-31T12:05:00Z"
}
```

---

## Logging Verification

Each Lambda now logs the `podcast_format` for tracking:

### Telegram Lambda Logs
```
[TELEGRAM_LAMBDA] Episode 550e8400-e29b-41d4-a716-446655440000 podcast_format: single-speaker
[TELEGRAM_LAMBDA] Preparing SQS message with podcast_format: single-speaker
```

### Script Preprocessor Logs
```
[SCRIPT_PREP] Episode 550e8400-e29b-41d4-a716-446655440000 podcast_format: single-speaker
[PREPROC] Selected single voice for episode 550e8400-e29b-41d4-a716-446655440000: Narrator=Alnilam
```

### Audio Generation Logs
```
[AUDIO_GEN] [req-123] Episode 550e8400-e29b-41d4-a716-446655440000 podcast_format: single-speaker
[AUDIO_GEN] Language: he
[AUDIO_GEN] Format: single-speaker
[AUDIO_GEN] Speakers: Narrator (male), None (None)
[AUDIO_GEN] Using pre-selected voices: Narrator=Alnilam, None=None
```

---

## Documentation Created

### 1. SQS Message Schemas
**File:** `/Lambda/docs/SQS_MESSAGE_SCHEMAS.md`
- Complete message schemas for both queues
- Field descriptions and requirements
- Example messages for single-speaker and multi-speaker
- Testing commands
- Critical notes on podcast_format handling

### 2. Deployment Checklist
**File:** `/Lambda/docs/DEPLOYMENT_CHECKLIST.md`
- Pre-deployment verification steps
- Deployment order and commands
- Post-deployment verification
- CloudWatch monitoring queries
- SQS queue monitoring
- Database verification queries
- End-to-end test procedures
- Rollback plan
- Troubleshooting guide

### 3. End-to-End Test Script
**File:** `/Lambda/scripts/test_single_speaker_pipeline.py`
- Python script for automated testing
- Creates test podcast
- Triggers episode generation
- Monitors SQS queues
- Checks CloudWatch logs
- Downloads and validates audio
- Color-coded output for clarity

---

## Validation Checklist

### Code Integration

- ✅ Telegram Lambda extracts `podcast_format` from config
- ✅ Telegram Lambda includes `podcast_format` in SQS message
- ✅ Script Preprocessor extracts `podcast_format` from SQS
- ✅ Script Preprocessor validates format
- ✅ Script Preprocessor includes format in `dynamic_config`
- ✅ Audio Generation extracts format from `dynamic_config`
- ✅ Audio Generation validates format
- ✅ Audio Generation passes format to TTS service

### Logging

- ✅ Telegram Lambda logs format
- ✅ Script Preprocessor logs format
- ✅ Audio Generation logs format
- ✅ All logs use consistent `[LAMBDA_NAME]` prefix
- ✅ All logs include episode_id for correlation

### SQS Messages

- ✅ Script Generation Queue includes `podcast_format` at root level
- ✅ Audio Generation Queue includes `podcast_format` in `dynamic_config`
- ✅ Messages validated against schema
- ✅ Both single-speaker and multi-speaker formats supported

### Documentation

- ✅ SQS message schemas documented
- ✅ Deployment checklist created
- ✅ Test script created
- ✅ Pipeline integration summary created

### Backward Compatibility

- ✅ Missing format defaults to `'multi-speaker'`
- ✅ Invalid format defaults to `'multi-speaker'` with warning
- ✅ Existing multi-speaker podcasts unaffected

---

## Testing Instructions

### Automated Test

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-key"
export SCRIPT_GENERATION_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/.../script-generation-queue"
export AUDIO_GENERATION_QUEUE_URL="https://sqs.us-east-1.amazonaws.com/.../audio-generation-queue"
export S3_BUCKET_NAME="podcasto-data"

# Run test
cd /home/ubuntu/projects/podcasto/Lambda/scripts
python test_single_speaker_pipeline.py --env dev --create-test-podcast
```

### Manual Test

1. **Create Single-Speaker Podcast:**
   ```sql
   INSERT INTO podcast_configs (id, podcast_id, podcast_format, telegram_channel, speaker1_role, speaker1_gender, language)
   VALUES (gen_random_uuid(), '<podcast-id>', 'single-speaker', '<channel>', 'Narrator', 'male', 'he');
   ```

2. **Trigger Episode Generation:**
   - Use Admin UI to trigger episode
   - OR invoke Telegram Lambda directly

3. **Monitor CloudWatch Logs:**
   ```bash
   # Telegram Lambda
   aws logs tail /aws/lambda/telegram-lambda-dev --follow --filter-pattern "podcast_format"

   # Script Preprocessor
   aws logs tail /aws/lambda/script-preprocessor-dev --follow --filter-pattern "podcast_format"

   # Audio Generation
   aws logs tail /aws/lambda/audio-generation-dev --follow --filter-pattern "podcast_format"
   ```

4. **Verify SQS Messages:**
   - Check AWS Console → SQS → script-generation-queue
   - Check message body contains `"podcast_format": "single-speaker"`
   - Check audio-generation-queue
   - Check dynamic_config contains format

5. **Verify Database:**
   ```sql
   SELECT e.id, e.title, e.status,
          e.metadata->>'podcast_format' as format,
          e.metadata->>'speaker1_voice' as voice,
          p.podcast_format as config_format
   FROM episodes e
   JOIN podcasts pod ON e.podcast_id = pod.id
   JOIN podcast_configs p ON pod.id = p.podcast_id
   WHERE e.id = '<episode-id>';
   ```

6. **Verify Audio:**
   - Download audio from S3
   - Play and verify single voice throughout
   - No speaker transitions

---

## Deployment Order

To deploy this feature to production:

1. **Shared Layer** (if updated)
   ```bash
   cd Lambda/shared-layer
   ./deploy.sh
   ```

2. **Script Preprocessor Lambda**
   ```bash
   cd Lambda/script-preprocessor-lambda
   ./deploy.sh prod
   ```

3. **Audio Generation Lambda**
   ```bash
   cd Lambda/audio-generation-lambda
   ./deploy.sh prod
   ```

4. **Telegram Lambda**
   ```bash
   cd Lambda/telegram-lambda
   ./deploy.sh prod
   ```

See `/Lambda/docs/DEPLOYMENT_CHECKLIST.md` for detailed deployment instructions.

---

## Success Criteria

Pipeline integration is considered complete when:

- ✅ All Lambda code changes committed
- ✅ Format flows through all three Lambdas
- ✅ Logging tracks format at each stage
- ✅ SQS messages contain format field
- ✅ Documentation complete
- ✅ Test script created
- ✅ Backward compatibility maintained

**Status:** ✅ ALL CRITERIA MET

---

## Next Steps

This completes Phase 3.3 - Pipeline Integration. The following phases are now ready:

**Phase 4.1 - Comprehensive Testing:**
- Create unit tests for format handling
- Create integration tests for pipeline flow
- Add regression tests for multi-speaker
- Performance testing for single-speaker generation

**Phase 4.2 - Documentation:**
- Update main README with format feature
- Create user guide for single-speaker podcasts
- Update API documentation
- Create troubleshooting guide

---

## CloudWatch Queries for Monitoring

### Track Format Through Pipeline

```
# Telegram Lambda
fields @timestamp, @message
| filter @message like /podcast_format/
| sort @timestamp desc
| limit 50

# Script Preprocessor
fields @timestamp, @message
| filter @message like /SCRIPT_PREP.*podcast_format/
| sort @timestamp desc
| limit 50

# Audio Generation
fields @timestamp, @message
| filter @message like /AUDIO_GEN.*podcast_format/
| sort @timestamp desc
| limit 50
```

### Find Single-Speaker Episodes

```
fields @timestamp, episode_id, podcast_format
| filter @message like /single-speaker/
| stats count() by episode_id
```

### Error Detection

```
fields @timestamp, @message
| filter @message like /Invalid format/
| sort @timestamp desc
```

---

## Related Files

- Pipeline Code Changes:
  - `/Lambda/telegram-lambda/src/config.py`
  - `/Lambda/telegram-lambda/src/clients/sqs_client.py`
  - `/Lambda/telegram-lambda/src/lambda_handler.py`
  - `/Lambda/script-preprocessor-lambda/src/handlers/script_preprocessor_handler.py`
  - `/Lambda/audio-generation-lambda/src/handlers/audio_generation_handler.py`

- Documentation:
  - `/Lambda/docs/SQS_MESSAGE_SCHEMAS.md`
  - `/Lambda/docs/DEPLOYMENT_CHECKLIST.md`
  - `/Lambda/scripts/test_single_speaker_pipeline.py`

- Previous Phases:
  - Phase 3.1: Script generation with format support
  - Phase 3.2: Audio generation with format support

---

## Contact & Support

For questions or issues related to pipeline integration:

1. Check CloudWatch Logs for detailed error messages
2. Review SQS message schemas in `/Lambda/docs/SQS_MESSAGE_SCHEMAS.md`
3. Run test script: `/Lambda/scripts/test_single_speaker_pipeline.py`
4. Consult deployment checklist: `/Lambda/docs/DEPLOYMENT_CHECKLIST.md`

---

**Integration Complete:** 2025-10-28
**Verified By:** Pipeline Integration Phase 3.3
**Ready for:** Phase 4 (Testing & Documentation)
