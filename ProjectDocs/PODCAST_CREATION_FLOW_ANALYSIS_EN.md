# Podcast Creation Flow Analysis - Podcasto

## Overview

The Podcasto system uses a distributed architecture with 3 main services:
1. **Next.js (Vercel)** - User interface and application server
2. **Telegram Lambda (AWS)** - Content collection from Telegram
3. **Audio Generation Lambda (AWS)** - Audio generation using Google Gemini TTS

---

## Full Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           1. Start the process                      │
└─────────────────────────────────────────────────────────────────────┘

Admin UI (specific podcast page)
  ↓
GenerateEpisodeButton Component
  │ src/components/admin/generate-episode-button.tsx:18
  ↓
generatePodcastEpisode() Server Action
  │ src/lib/actions/podcast/generate.ts:22
  │
  ├─→ Environment checks (TELEGRAM_LAMBDA_NAME, SQS_QUEUE_URL)
  ├─→ Fetch podcast_config from Supabase
  ├─→ Create a new episode with status 'pending'
  │   └─→ episodesApi.createEpisode()
  │       src/lib/actions/podcast/generate.ts:148
  └─→ Invoke Telegram Lambda
      └─→ LambdaClient.invoke()
          src/lib/actions/podcast/generate.ts:213

┌─────────────────────────────────────────────────────────────────────┐
│                      2. Telegram Lambda                              │
└─────────────────────────────────────────────────────────────────────┘

AWS Lambda: telegram-lambda
  │ Lambda/telegram-lambda/src/lambda_handler.py:19
  ↓
ChannelProcessor.process()
  │ src/channel_processor.py
  │
  ├─→ Connect to Telegram (Telethon)
  ├─→ Collect messages from channel (by telegram_hours)
  ├─→ Process media (images, files)
  ├─→ Upload to S3
  │   └─→ s3://{bucket}/podcasts/{podcast_id}/{timestamp}/telegram_data.json
  │
  ├─→ Update episode status → 'content_collected'
  │   └─→ supabase_client.update_episode_status()
  │       Lambda/telegram-lambda/src/lambda_handler.py:74
  │
  └─→ Send message to SQS
      └─→ sqs_client.send_message()
          Lambda/telegram-lambda/src/lambda_handler.py:89
          payload: {
            episode_id, podcast_id, podcast_config_id,
            s3_path, timestamp
          }

┌─────────────────────────────────────────────────────────────────────┐
│                   3. Audio Generation Lambda                         │
└─────────────────────────────────────────────────────────────────────┘

AWS Lambda: audio-generation-lambda (triggered by SQS)
  │ Lambda/audio-generation-lambda/src/handlers/audio_generation_handler.py:25
  ↓
AudioGenerationHandler.process_event()
  │
  ├─→ Check: is episode in 'content_collected' status?
  │   └─→ should_process_for_audio()
  │       audio_generation_handler.py:96
  │
  ├─→ Update status → 'processing'
  │
  ├─→ Fetch data:
  │   ├─→ Episode from Supabase
  │   ├─→ PodcastConfig from Supabase
  │   └─→ TelegramData from S3
  │       └─→ telegram_client.get_telegram_data()
  │           with retry logic (3 attempts)
  │
  ├─→ Content processing:
  │   ├─→ TelegramContentExtractor.extract_clean_content()
  │   │   Filters messages, cleans formatting
  │   │
  │   ├─→ ContentAnalyzer.analyze_content()
  │   │   Identify content category (news, technology, sports...)
  │   │   Create a dynamic speaker role (e.g., "Sports Reporter")
  │   │   audio_generation_handler.py:160
  │   │
  │   └─→ Apply dynamic role to config
  │       audio_generation_handler.py:169
  │
  ├─→ Create conversation script:
  │   └─→ GeminiScriptGenerator.generate_script()
  │       Uses the Gemini API
  │       Generates a dialog between 2 speakers
  │       audio_generation_handler.py:243
  │
  ├─→ Hebrew processing (if required):
  │   └─→ HebrewNiqqudProcessor.process_script_for_tts()
  │       Adds niqqud to Hebrew text to improve pronunciation
  │       audio_generation_handler.py:305
  │
  ├─→ Generate audio:
  │   └─→ GooglePodcastGenerator.generate_podcast_audio()
  │       Uses Google Gemini 2.5 Flash TTS
  │       Different voices for each speaker (male/female)
  │       Returns WAV bytes + duration
  │       audio_generation_handler.py:252
  │
  ├─→ Upload to S3:
  │   ├─→ Audio: s3://{bucket}/podcasts/{podcast_id}/{episode_id}/audio.wav
  │   └─→ Transcripts: transcript.txt + transcript_niqqud.txt (for Hebrew)
  │       audio_generation_handler.py:346
  │
  ├─→ Update Episode in Supabase:
  │   └─→ status → 'completed'
  │       audio_url, duration
  │       audio_generation_handler.py:291
  │
  └─→ Send callback to Next.js API
      └─→ POST /api/episodes/{id}/completed
          with Authorization: Bearer {LAMBDA_CALLBACK_SECRET}
          audio_generation_handler.py:380

┌─────────────────────────────────────────────────────────────────────┐
│                    4. Post-Processing (Next.js)                      │
└─────────────────────────────────────────────────────────────────────┘

API Route: /api/episodes/[id]/completed
  │ src/app/api/episodes/[id]/completed/route.ts:10
  ↓
  ├─→ Validate Lambda callback (LAMBDA_CALLBACK_SECRET)
  ├─→ Check ENABLE_POST_PROCESSING
  │
  └─→ PostProcessingService.processCompletedEpisode()
      │
      ├─→ generateEpisodeTitleAndDescription()
      │   Uses Google Gemini to analyze the script
      │   Creates tailored title and description
      │   src/lib/actions/episode/generation-actions.ts
      │
      └─→ generateEpisodeImage()
          Uses OpenAI DALL-E
          Creates a cover image for the episode
          src/lib/actions/episode/image-actions.ts

┌─────────────────────────────────────────────────────────────────────┐
│                        5. Additional Processes                        │
└─────────────────────────────────────────────────────────────────────┘

Cron Job: Podcast Scheduler
  │ src/app/api/cron/podcast-scheduler/route.ts
  │ Triggered automatically (Vercel Cron)
  │
  ├─→ findPodcastsNeedingEpisodes()
  │   Checks by episode_frequency (default: 7 days)
  │
  └─→ generateEpisodesForPodcasts()
      Runs the full process for each podcast

Episode Checker (Cron)
  │ src/app/api/cron/episode-checker/route.ts
  │
  └─→ Finds episodes in 'completed' without title/image
      Triggers post-processing
```

---

## Key Files by Stage

### 1. UI Layer (Admin)
- `src/components/admin/generate-episode-button.tsx` - Start creation button
- `src/app/admin/podcasts/[id]/page.tsx` - Podcast management page
- `src/components/admin/episode-actions-menu.tsx` - Actions menu for episode

### 2. Server Actions (Next.js)
- `src/lib/actions/podcast/generate.ts:22` - `generatePodcastEpisode()`
- `src/lib/actions/episode/audio-actions.ts:122` - `regenerateEpisodeAudio()`
- `src/lib/actions/episode/generation-actions.ts` - `generateEpisodeTitleAndDescription()`

### 3. API Routes
- `src/app/api/episodes/[id]/completed/route.ts` - Lambda callback endpoint
- `src/app/api/cron/podcast-scheduler/route.ts` - Automatic scheduling

### 4. Database Layer
> ℹ️ The database API now uses directory-based modules with `index.ts` re-exporting the supported queries and mutations. Use these entry points instead of any legacy `*.ts.backup` files when interacting with the database layer.
- `src/lib/db/api/episodes/index.ts` - Episode CRUD operations
- `src/lib/db/api/podcast-configs.ts` - Configuration
- `src/lib/db/schema/episodes.ts` - Drizzle schema

### 5. Lambda Functions
**Telegram Lambda:**
- `Lambda/telegram-lambda/src/lambda_handler.py:19` - Entry point
- `Lambda/telegram-lambda/src/channel_processor.py` - Channel processing
- `Lambda/telegram-lambda/src/clients/sqs_client.py` - Send to SQS

**Audio Lambda:**
- `Lambda/audio-generation-lambda/src/handlers/audio_generation_handler.py:25` - Entry point
- `Lambda/audio-generation-lambda/src/services/google_podcast_generator.py` - TTS
- `Lambda/audio-generation-lambda/src/services/gemini_script_generator.py` - Script generation
- `Lambda/audio-generation-lambda/src/services/content_analyzer.py` - Content analysis

---

## Episode States (Status Flow)

```
pending
  ↓ (Telegram Lambda)
content_collected
  ↓ (Audio Lambda)
processing
  ↓ (Audio Lambda - success)
completed
  ↓ (Post-processing)
completed (with title, description, cover_image)

  OR

processing
  ↓ (Audio Lambda - error)
failed
```

---

## Potential Issues and Bottlenecks 🚨

### 1. regenerateEpisodeAudio() issue - TODO not implemented
**Location:** `src/lib/actions/episode/audio-actions.ts:122`

**The issue:**
```typescript
// TODO: In a real implementation, this would trigger an async job
// to regenerate the audio file. For now, we'll just update the status
// and pretend it's processing.
```

The function only changes the status to 'processing' but does not actually re-trigger the Lambda!

**Impact:**
- Admin clicks "Regenerate Audio" → status changes to processing but nothing happens
- Episode gets stuck in 'processing' forever

**Required fix:**
Add a call to the Telegram Lambda exactly like in `generatePodcastEpisode()`:
```typescript
// Need to add:
const { LambdaClient, InvokeCommand } = await import('@aws-sdk/client-lambda');
// and re-invoke the Lambda
```

---

### 2. Race Condition: S3 Data Availability
**Location:** `Lambda/audio-generation-lambda/src/clients/telegram_data_client.py`

**The issue:**
- Telegram Lambda uploads data to S3
- Immediately after, it sends a message to SQS
- Audio Lambda attempts to read from S3

**Failure scenario:**
```
1. Telegram Lambda: writes to S3 (S3 eventual consistency!)
2. Telegram Lambda: sends SQS message
3. Audio Lambda: receives SQS message immediately
4. Audio Lambda: tries to read from S3 → file not yet available!
5. Audio Lambda: retries 3 times... if still fails → FAILED
```

**Existing solution:**
There is retry logic with backoff, but it's not ideal.

**Recommended solution:**
- Add S3 Event Notification → SQS
- Instead of Telegram Lambda sending to SQS, S3 will send automatically when the file is ready
- Or: add a 2–3 second delay before sending SQS

---

### 3. Callback Failure = Silent Failure
**Location:** `Lambda/audio-generation-lambda/src/handlers/audio_generation_handler.py:380`

**The issue:**
```python
except Exception as e:
    logger.warning(f"Failed to send completion callback: {str(e)}")
    # Don't fail the entire process if callback fails - episode is still completed
```

If the call to `/api/episodes/{id}/completed` fails:
- Audio is saved in S3 ✓
- Episode is marked completed ✓
- But there is no title, description, cover_image ✗

**Failure scenario:**
1. Lambda finishes successfully
2. Callback fails (network timeout, API down, wrong secret)
3. Episode remains with default title: "Episode 05/10/2025"
4. No image

**Existing solution:**
There is an `episode-checker` cron that finds such episodes and fixes them.

**Problem with the solution:**
Cron runs on a schedule (every X minutes), not immediately.

**Recommended solution:**
- Add a Dead Letter Queue (DLQ) for the callback
- Or: Lambda writes to DynamoDB/SQS upon completion, and Next.js reads from there

---

### 4. Timeout Risk: Lambda 15 minutes
**Location:** Audio Generation Lambda timeout setting

**The issue:**
The process includes:
1. Fetching data from S3 (can be large!)
2. Calling Gemini for content analysis
3. Calling Gemini for script generation (can be long)
4. Hebrew niqqud processing (if required)
5. Calling Google TTS (longest step!)
6. Uploading to S3

**Risk:**
A long episode (30+ minutes of audio) may take > 15 minutes to generate.

**Recommended solution:**
- Split into 2 Lambdas:
  - Lambda 1: Script generation (lightweight, fast)
  - Lambda 2: Audio generation (heavy, long)
  - Or use Step Functions for orchestration

---

### 5. Environment Variables: too many points of failure
**Multiple locations:**

**Next.js requires:**
- `TELEGRAM_LAMBDA_NAME`
- `SQS_QUEUE_URL` (not used directly but checked)
- `AUDIO_GENERATION_QUEUE_URL`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `LAMBDA_CALLBACK_SECRET`
- `CRON_SECRET`
- `ENABLE_POST_PROCESSING`

**Lambdas require:**
- `GEMINI_API_KEY` (from AWS Secrets Manager)
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `API_BASE_URL` (to call back to Next.js)
- `LAMBDA_CALLBACK_SECRET`

**Problem:**
Missing any one → the process fails non-transparently.

**Solution:**
- Add a health check endpoint that validates all env vars
- Add validation at the beginning of each Lambda/Server Action

---

### 6. SQS Message Format: no schema validation
**Location:** `Lambda/telegram-lambda/src/clients/sqs_client.py`

**The issue:**
SQS message is sent with a free-form payload, no schema validation.

If Telegram Lambda sends:
```json
{
  "episode_id": "123",
  "podcast_id": "456",
  // missing podcast_config_id!
}
```

Audio Lambda will try to read `podcast_config_id`, won't find it, and fall back.

**Recommended solution:**
- Define a Pydantic model for SQS messages
- Validate in Telegram Lambda before sending
- Validate in Audio Lambda after receiving

---

### 7. Database: nullable audio_url but not always checked
**Location:** Multiple - UI components

**The issue:**
`episodes.audio_url` is nullable in the table, but some components do not check it:

✓ Correctly checked:
- `src/components/admin/episode-actions-menu.tsx:137` - `episode.audio_url ? ... : ...`

✗ Not checked everywhere:
There are places using `episode.audio_url` directly.

**Solution:**
Global search for `episode.audio_url` and ensure there is a guard everywhere.

---

### 8. Content Analysis: Gemini API call can fail
**Location:** `Lambda/audio-generation-lambda/src/services/content_analyzer.py`

**The issue:**
Calling Gemini for content analysis may hit:
- Rate limiting
- API errors
- Network issues

If it fails → what happens to the dynamic speaker role?

There appears to be a fallback, but we should ensure it works.

---

### 9. Hebrew Niqqud: dependency on an external service
**Location:** `Lambda/audio-generation-lambda/src/services/hebrew_niqqud.py`

**The issue:**
If the service is unavailable or fails:
```python
except Exception as e:
    logger.error(f"Error processing Hebrew script: {str(e)}")
    logger.info(f"Falling back to original script")
    return script, None
```

This is good, there is a fallback. But:
- Pronunciation quality will be worse
- There is no admin alert that this happened

**Recommended solution:**
- Save metadata on the episode: `niqqud_processing_status: 'success' | 'failed' | 'skipped'`
- Display in admin if a failure occurred

---

### 10. Post-Processing: no retry mechanism
**Location:** `src/app/api/episodes/[id]/completed/route.ts:78`

**The issue:**
If `generateEpisodeTitleAndDescription()` or `generateEpisodeImage()` fails:
- The function returns an error
- No retry is attempted

**Existing solution:**
The `episode-checker` cron will fix it later.

**Problem:**
Not immediate, and the episode may remain partial for a while.

---

## Recommendations for Improvement

### Critical 🔴
1. Fix `regenerateEpisodeAudio()` - this is a severe bug!
2. Add validation for env vars - at the start of every service
3. Add schema validation for SQS messages

### Important 🟡
4. Improve handling of S3 eventual consistency - S3 events or delay
5. Add monitoring and alerts for callback failures
6. Add timeout protection for the Lambda - split into two stages if needed

### Nice to have 🟢
7. Add health check endpoints for all services
8. Save more detailed metadata on failures (niqqud, content analysis, etc.)
9. Add retry logic for post-processing
10. Add a dashboard to track the entire process in real-time

---

## Summary

The process works well in most cases, but there are weak points that can cause silent failures or stuck episodes.

**Most severe issue:** `regenerateEpisodeAudio()` does not work at all - must be fixed immediately!

**Second most severe issue:** Callback failures that result in episodes without title/image - better monitoring is needed.

The remaining issues are manageable edge cases but should be improved over time.


