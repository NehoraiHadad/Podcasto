# MP3 Compression Deployment Guide

## Overview

This guide walks through deploying the MP3 compression feature to the audio generation Lambda. The feature converts WAV files to MP3 format, reducing storage and bandwidth costs by 80-90% while maintaining good audio quality.

## Prerequisites

- [x] AWS CLI configured with appropriate credentials
- [x] Python 3.12 environment for local testing
- [x] Access to Supabase database for migration
- [x] FFmpeg available (for local testing)

## Deployment Steps

### Step 1: Update Lambda Shared Layer

The shared layer now includes `pydub` for audio conversion.

```bash
cd /home/ubuntu/projects/podcasto/Lambda/shared-layer

# Build the layer
./build.sh

# Deploy to dev environment
./deploy.sh dev

# Note the new layer version number (e.g., layer:podcasto-shared-layer-dev:17)
```

**Update template.yaml** with the new layer version:
```yaml
Layers:
  - !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:podcasto-shared-layer-${Environment}:17'
```

### Step 2: Add FFmpeg Lambda Layer

Follow instructions in `FFMPEG_LAYER_SETUP.md` to add FFmpeg layer.

**Recommended: Use public layer**
```yaml
AudioGenerationFunction:
  Properties:
    Layers:
      - arn:aws:lambda:us-east-1:145266761615:layer:ffmpeg:4  # Public FFmpeg layer
      - !Sub 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:podcasto-shared-layer-${Environment}:17'
```

### Step 3: Database Migration

Apply the migration to add `audio_format` column:

```bash
cd /home/ubuntu/projects/podcasto/podcasto

# Review the migration
cat drizzle/0008_long_killraven.sql

# Apply migration to Supabase
npx drizzle-kit push
```

**Expected output:**
```
✓ Added column "audio_format" to "episodes" table
✓ Backfilled existing episodes with format detection
```

**Verify migration:**
```sql
-- In Supabase SQL Editor
SELECT audio_format, COUNT(*)
FROM episodes
GROUP BY audio_format;
```

### Step 4: Deploy Lambda Function

```bash
cd /home/ubuntu/projects/podcasto/Lambda/audio-generation-lambda

# Deploy to dev environment
./deploy.sh dev

# Monitor deployment
sam logs -n podcasto-audio-generation-dev --stack-name podcasto-audio-generation-dev --tail
```

### Step 5: Verification Testing

#### Test 1: Trigger Episode Generation

```bash
# Trigger a test episode (via Next.js admin panel or API)
curl -X POST https://your-app.vercel.app/api/admin/episodes/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"podcast_id": "test-podcast-id"}'
```

#### Test 2: Monitor CloudWatch Logs

Look for these log entries indicating successful MP3 conversion:

```
[AUDIO_CONVERTER] Initialized with bitrate: 128k
[AUDIO_CONVERTER] Loading WAV audio data...
[AUDIO_CONVERTER] Loaded WAV audio: duration=1823.4s, size=52.31MB
[AUDIO_CONVERTER] Converting to MP3 with bitrate 128k...
[AUDIO_CONVERTER] MP3 conversion successful: size=5.23MB (90.0% reduction)
[S3] Uploading audio to s3://podcasto-podcasts/podcasts/.../podcast.mp3
```

#### Test 3: Verify S3 Upload

```bash
# Check S3 for MP3 file
aws s3 ls s3://podcasto-podcasts/podcasts/YOUR_PODCAST_ID/YOUR_EPISODE_ID/audio/

# Expected: podcast.mp3 (not podcast.wav)
```

#### Test 4: Verify Database

```sql
-- Check episode was created with MP3 format
SELECT id, title, audio_format, audio_url, duration
FROM episodes
WHERE id = 'YOUR_EPISODE_ID';

-- Expected: audio_format = 'mp3'
```

#### Test 5: Test Audio Playback

1. Navigate to episode page in Next.js app
2. Click play on audio player
3. Verify audio plays correctly
4. Check Network tab: verify MP3 is being served (audio/mpeg)

### Step 6: Performance Monitoring

Monitor these metrics for 24-48 hours:

**Lambda Metrics:**
- Duration: Should increase by ~5-10 seconds (MP3 encoding)
- Memory usage: No significant change
- Error rate: Should remain at 0%

**S3 Metrics:**
- Storage: Should decrease for new episodes (5-10 MB vs 50-100 MB)
- GET requests: No change
- Data transfer: Should decrease (smaller file sizes)

**CloudWatch Logs:**
```bash
# Monitor for conversion errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/podcasto-audio-generation-dev \
  --filter-pattern "MP3 conversion failed"
```

## Rollback Plan

If issues occur:

### Option 1: Environment Variable Rollback (Quickest)

```bash
# In AWS Console or CLI
aws lambda update-function-configuration \
  --function-name podcasto-audio-generation-dev \
  --environment Variables={AUDIO_FORMAT=wav,...}
```

This will bypass MP3 conversion and upload WAV directly.

### Option 2: Code Rollback (Full Revert)

```bash
# Revert Lambda code to previous version
git revert <commit-hash>

# Redeploy
./deploy.sh dev
```

### Option 3: Database Rollback (if needed)

```sql
-- Remove audio_format column (only if necessary)
ALTER TABLE episodes DROP COLUMN audio_format;
```

## Testing Checklist

Before deploying to production:

- [ ] Dev environment deployment successful
- [ ] Test episode generates MP3 file (not WAV)
- [ ] Audio playback works correctly
- [ ] File size reduced by 80-90%
- [ ] CloudWatch logs show no conversion errors
- [ ] Database `audio_format` column populated correctly
- [ ] S3 metadata contains compression statistics
- [ ] Backward compatibility: old WAV episodes still play
- [ ] Lambda duration within acceptable limits (<900s)
- [ ] No increase in Lambda errors

## Production Deployment

Once testing passes in dev:

```bash
# Deploy shared layer to prod
cd /home/ubuntu/projects/podcasto/Lambda/shared-layer
./deploy.sh prod

# Update template.yaml with prod layer version

# Deploy Lambda to prod
cd /home/ubuntu/projects/podcasto/Lambda/audio-generation-lambda
./deploy.sh prod

# Apply database migration to production Supabase
cd /home/ubuntu/projects/podcasto/podcasto
npx drizzle-kit push --config=drizzle.config.prod.ts
```

## Cost Savings Estimation

**Storage Savings:**
- Before: 100 MB per episode × 100 episodes/month = 10 GB/month
- After: 10 MB per episode × 100 episodes/month = 1 GB/month
- **Savings: 9 GB/month × $0.023/GB = $0.21/month**

**Bandwidth Savings (assuming 100 plays/episode):**
- Before: 100 MB × 100 plays = 10 GB transfer
- After: 10 MB × 100 plays = 1 GB transfer
- **Savings: 9 GB × $0.09/GB = $0.81/month**

**Total Savings: ~$1/month per 100 episodes**

At scale (1000 episodes/month × 1000 plays each):
- Storage: ~$20/month
- Bandwidth: ~$810/month
- **Total Savings: ~$830/month**

## Troubleshooting

### Error: "pydub module not found"

**Cause:** Shared layer not deployed or incorrect version

**Solution:**
1. Verify layer version in template.yaml matches deployed layer
2. Redeploy shared layer: `./deploy.sh dev`
3. Update template.yaml with new version
4. Redeploy Lambda

### Error: "ffmpeg not found"

**Cause:** FFmpeg layer not attached

**Solution:** See `FFMPEG_LAYER_SETUP.md`

### Error: "MP3 conversion failed: unexpected error"

**Cause:** Corrupted WAV data or unsupported format

**Solution:**
1. Check CloudWatch logs for detailed error
2. Verify Gemini TTS output is valid WAV
3. Fallback mechanism will upload WAV instead

### Audio plays but sounds distorted

**Cause:** Bitrate too low or encoding issue

**Solution:**
1. Increase bitrate in handler: `AudioConverter(bitrate="192k")`
2. Test with different bitrate settings
3. Verify original WAV quality

## Maintenance

**Monthly Review:**
- Check S3 storage usage trends
- Review CloudWatch logs for conversion errors
- Monitor Lambda duration trends
- Verify cost savings align with estimates

**Quarterly Tasks:**
- Update FFmpeg layer to latest version
- Review and optimize bitrate settings
- Consider upgrading to VBR (Variable Bitrate) encoding
