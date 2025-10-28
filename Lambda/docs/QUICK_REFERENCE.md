# Quick Reference - Single-Speaker Pipeline Integration

## Quick Links

- **Message Schemas**: [SQS_MESSAGE_SCHEMAS.md](./SQS_MESSAGE_SCHEMAS.md)
- **Deployment**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Testing**: [../scripts/test_single_speaker_pipeline.py](../scripts/test_single_speaker_pipeline.py)
- **Full Summary**: [PIPELINE_INTEGRATION_SUMMARY.md](./PIPELINE_INTEGRATION_SUMMARY.md)

## Files Modified

### Telegram Lambda
```
Lambda/telegram-lambda/src/
  ├── config.py                 # Added podcast_format field
  ├── clients/sqs_client.py     # Added format to SQS message
  └── lambda_handler.py         # Added format logging
```

### Script Preprocessor Lambda
```
Lambda/script-preprocessor-lambda/src/
  └── handlers/script_preprocessor_handler.py  # Added validation & logging
```

### Audio Generation Lambda
```
Lambda/audio-generation-lambda/src/
  └── handlers/audio_generation_handler.py     # Added validation & logging
```

## What Changed

### 1. Telegram Lambda
- ✅ Extracts `podcast_format` from podcast config
- ✅ Includes `podcast_format` in SQS message
- ✅ Logs format: `[TELEGRAM_LAMBDA] podcast_format: {format}`

### 2. Script Preprocessor
- ✅ Validates `podcast_format` from SQS message
- ✅ Includes format in `dynamic_config`
- ✅ Logs format: `[SCRIPT_PREP] podcast_format: {format}`

### 3. Audio Generation
- ✅ Validates `podcast_format` from dynamic_config
- ✅ Routes to single or multi-speaker generation
- ✅ Logs format: `[AUDIO_GEN] podcast_format: {format}`

## SQS Message Schemas

### Script Generation Queue
```json
{
  "podcast_format": "single-speaker",  // ← NEW
  "episode_id": "...",
  "podcast_id": "...",
  "s3_path": "..."
}
```

### Audio Generation Queue
```json
{
  "dynamic_config": {
    "podcast_format": "single-speaker",  // ← NEW
    "speaker1_voice": "Alnilam",
    "speaker2_voice": null,  // null for single-speaker
    ...
  }
}
```

## CloudWatch Log Queries

```
# Telegram Lambda
fields @message | filter @message like /podcast_format/

# Script Preprocessor
fields @message | filter @message like /SCRIPT_PREP.*podcast_format/

# Audio Generation
fields @message | filter @message like /AUDIO_GEN.*podcast_format/
```

## Database Queries

```sql
-- Check podcast_format in configs
SELECT podcast_format, COUNT(*)
FROM podcast_configs
GROUP BY podcast_format;

-- Check episode metadata
SELECT id, metadata->>'podcast_format' as format
FROM episodes
WHERE metadata->>'podcast_format' IS NOT NULL
LIMIT 10;
```

## Testing Commands

```bash
# Verify code changes
/tmp/verify_integration.sh

# Run end-to-end test
cd Lambda/scripts
python test_single_speaker_pipeline.py --env dev --create-test-podcast

# Validate database
psql -f Lambda/scripts/validate_database.sql
```

## Deployment Commands

```bash
# Deploy in order
cd Lambda/shared-layer && ./deploy.sh
cd ../script-preprocessor-lambda && ./deploy.sh dev
cd ../audio-generation-lambda && ./deploy.sh dev
cd ../telegram-lambda && ./deploy.sh dev
```

## Validation Checklist

- [ ] All Lambda code changes committed
- [ ] Format logged at each stage
- [ ] SQS messages include format
- [ ] Documentation complete
- [ ] Test script runs successfully
- [ ] Database queries show correct format
- [ ] CloudWatch logs show format tracking

## Common Issues

| Issue | Solution |
|-------|----------|
| Format not in logs | Check SQS message body, verify config extraction |
| Two voices in single-speaker | Check dynamic_config.podcast_format in message |
| Messages stuck in queue | Check Lambda timeout, verify SQS trigger |
| Format validation errors | Check format is 'single-speaker' or 'multi-speaker' |

## Support

For issues:
1. Check CloudWatch Logs
2. Review SQS message schemas
3. Run validation script
4. Consult deployment checklist
