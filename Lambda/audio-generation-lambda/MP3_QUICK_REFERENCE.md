# MP3 Compression Quick Reference

## Quick Deploy (Dev)

```bash
# 1. Deploy shared layer with pydub
cd /home/ubuntu/projects/podcasto/Lambda/shared-layer
./build.sh && ./deploy.sh dev

# 2. Update layer version in template.yaml (check output from step 1)
# Edit: Lambda/audio-generation-lambda/template.yaml
# Change: layer:podcasto-shared-layer-dev:16 → layer:podcasto-shared-layer-dev:17

# 3. Apply database migration
cd /home/ubuntu/projects/podcasto/podcasto
npx drizzle-kit push

# 4. Deploy Lambda
cd /home/ubuntu/projects/podcasto/Lambda/audio-generation-lambda
./deploy.sh dev

# 5. Monitor deployment
sam logs -n podcasto-audio-generation-dev --stack-name podcasto-audio-generation-dev --tail
```

## Quick Test

```bash
# 1. Trigger episode via admin panel (or API)
# 2. Watch CloudWatch logs for:
#    - "[AUDIO_CONVERTER] MP3 conversion successful"
#    - "87.2% reduction" or similar

# 3. Check S3
aws s3 ls s3://podcasto-podcasts/podcasts/YOUR_PODCAST_ID/YOUR_EPISODE_ID/audio/
# Should see: podcast.mp3 (not podcast.wav)

# 4. Check database
psql $DATABASE_URL -c "SELECT id, audio_format FROM episodes WHERE created_at > NOW() - INTERVAL '1 hour';"
# Should see: audio_format = 'mp3'
```

## Quick Rollback

```bash
# Option 1: Environment variable (instant, no redeploy)
aws lambda update-function-configuration \
  --function-name podcasto-audio-generation-dev \
  --environment Variables={ENVIRONMENT=dev,AUDIO_FORMAT=wav,SQS_QUEUE_URL=...,S3_BUCKET_NAME=...,SUPABASE_URL=...,SUPABASE_SERVICE_KEY=...,GEMINI_API_KEY=...,API_BASE_URL=...,LAMBDA_CALLBACK_SECRET=...,LOG_LEVEL=INFO}

# Option 2: Git revert (requires redeploy)
git revert HEAD
cd Lambda/audio-generation-lambda && ./deploy.sh dev
```

## Common Issues

### "ffmpeg not found"

```bash
# Verify FFmpeg layer in template.yaml
grep -A 2 "Layers:" Lambda/audio-generation-lambda/template.yaml
# Should see: arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4
```

### "pydub module not found"

```bash
# Check shared layer version
aws lambda get-function --function-name podcasto-audio-generation-dev \
  | jq '.Configuration.Layers[].Arn'
# Should include: layer:podcasto-shared-layer-dev:17 (or higher)
```

### "MP3 conversion failed"

```bash
# Check CloudWatch logs for error details
aws logs filter-log-events \
  --log-group-name /aws/lambda/podcasto-audio-generation-dev \
  --filter-pattern "MP3 conversion failed" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

### Audio plays but distorted

```python
# Increase bitrate in audio_generation_handler.py line 248
converter = AudioConverter(bitrate="192k")  # Higher quality
```

## Key File Locations

```
Lambda/
├── shared-layer/
│   └── python/
│       ├── requirements.txt                    # Added: pydub==0.25.1
│       └── shared/
│           ├── clients/s3_client.py           # Modified: upload_audio()
│           └── services/audio_converter.py    # New: WAV→MP3 converter
│
└── audio-generation-lambda/
    ├── template.yaml                          # Modified: Added FFmpeg layer
    ├── src/handlers/
    │   └── audio_generation_handler.py        # Modified: Added MP3 conversion
    ├── FFMPEG_LAYER_SETUP.md                  # New: FFmpeg setup guide
    ├── MP3_DEPLOYMENT_GUIDE.md                # New: Full deployment guide
    ├── MP3_IMPLEMENTATION_SUMMARY.md          # New: Implementation summary
    └── MP3_QUICK_REFERENCE.md                 # This file

podcasto/
├── src/lib/db/schema/episodes.ts              # Modified: Added audio_format column
└── drizzle/0008_long_killraven.sql            # New: Database migration
```

## Configuration

### Bitrate Options

```python
# In audio_generation_handler.py line 248
AudioConverter(bitrate="96k")   # Low: 3-4 MB per 30 min
AudioConverter(bitrate="128k")  # Standard: 5-6 MB (RECOMMENDED)
AudioConverter(bitrate="192k")  # High: 8-9 MB
```

### Disable MP3 (Rollback)

```yaml
# In template.yaml, add environment variable:
Environment:
  Variables:
    AUDIO_FORMAT: wav  # Forces WAV, bypasses MP3
```

## Monitoring Commands

```bash
# Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=podcasto-audio-generation-dev \
  --start-time $(date -u -d '1 hour ago' --iso-8601=seconds) \
  --end-time $(date -u --iso-8601=seconds) \
  --period 300 \
  --statistics Average

# S3 storage size
aws s3 ls s3://podcasto-podcasts/podcasts/ --recursive --summarize \
  | grep "Total Size"

# Recent conversions
aws logs filter-log-events \
  --log-group-name /aws/lambda/podcasto-audio-generation-dev \
  --filter-pattern "MP3 conversion successful" \
  --max-items 10
```

## Cost Tracking

```sql
-- Average file sizes (last 24 hours)
SELECT
  audio_format,
  COUNT(*) as episodes,
  AVG(duration) as avg_duration_seconds
FROM episodes
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY audio_format;

-- Storage savings estimate
WITH file_sizes AS (
  SELECT
    CASE audio_format
      WHEN 'wav' THEN duration * 172  -- ~172 KB/s for WAV
      WHEN 'mp3' THEN duration * 16   -- ~16 KB/s for 128k MP3
    END / 1024.0 as size_mb
  FROM episodes
  WHERE created_at > NOW() - INTERVAL '30 days'
)
SELECT
  SUM(size_mb) as total_mb,
  SUM(size_mb) * 0.023 as monthly_storage_cost_usd
FROM file_sizes;
```

## Production Checklist

- [ ] Dev deployment successful
- [ ] Test episode generated with MP3
- [ ] Audio playback verified
- [ ] File size reduction confirmed (80-90%)
- [ ] CloudWatch logs clean (no errors)
- [ ] Database migration applied
- [ ] Backward compatibility tested (old WAV episodes play)
- [ ] Lambda duration acceptable
- [ ] Update layer version in prod template.yaml
- [ ] Deploy shared layer to prod
- [ ] Deploy Lambda to prod
- [ ] Apply migration to prod database
- [ ] Monitor prod for 24-48 hours

## Support

**Documentation:**
- Full deployment: `MP3_DEPLOYMENT_GUIDE.md`
- FFmpeg setup: `FFMPEG_LAYER_SETUP.md`
- Implementation details: `MP3_IMPLEMENTATION_SUMMARY.md`

**Logs:**
```bash
# Live tail (dev)
sam logs -n podcasto-audio-generation-dev --stack-name podcasto-audio-generation-dev --tail

# Live tail (prod)
sam logs -n podcasto-audio-generation-prod --stack-name podcasto-audio-generation-prod --tail
```

**CloudWatch Insights Query:**
```
fields @timestamp, @message
| filter @message like /MP3 conversion/
| sort @timestamp desc
| limit 20
```
