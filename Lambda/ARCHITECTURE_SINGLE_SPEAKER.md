# Single-Speaker Podcast Architecture

## Overview

This document describes the architectural implementation of single-speaker podcast support in the Podcasto audio generation pipeline.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SQS Message (Audio Generation Queue)            │
│  {                                                                    │
│    "episode_id": "...",                                              │
│    "podcast_id": "...",                                              │
│    "script_url": "s3://...",                                         │
│    "dynamic_config": {                                               │
│      "podcast_format": "single-speaker" | "multi-speaker",          │
│      "speaker1_voice": "Alnilam",                                    │
│      "speaker2_voice": null (single) | "Aoede" (multi),            │
│      "speaker1_role": "Narrator",                                    │
│      "speaker2_role": null (single) | "Guest" (multi),             │
│      ...                                                             │
│    }                                                                  │
│  }                                                                    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Audio Generation Handler (Lambda Entry)                │
│                                                                       │
│  1. Extract podcast_format from dynamic_config                       │
│  2. Validate voices present in config                                │
│  3. Process Hebrew niqqud if needed                                  │
│  4. Call _generate_audio() with podcast_format                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Google Podcast Generator                          │
│                                                                       │
│  Route based on podcast_format:                                      │
│  ┌───────────────────────────┐   ┌────────────────────────────┐     │
│  │   Single-Speaker Path     │   │   Multi-Speaker Path       │     │
│  │                           │   │                            │     │
│  │  • Validate speaker1_voice│   │  • Validate both voices    │     │
│  │  • Check script length    │   │  • Check script length     │     │
│  │  • Route to chunked       │   │  • Route to chunked        │     │
│  │    or single generation   │   │    or single generation    │     │
│  └───────────────────────────┘   └────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                    │                              │
                    ▼                              ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│   Single-Speaker Methods     │   │   Multi-Speaker Methods      │
│                              │   │                              │
│  Short Script:               │   │  Short Script:               │
│  • generate_single_speaker   │   │  • generate_single_audio     │
│    _audio()                  │   │    (existing)                │
│                              │   │                              │
│  Long Script:                │   │  Long Script:                │
│  • _generate_single_speaker  │   │  • _generate_chunked_audio   │
│    _chunked()                │   │    _parallel()               │
│  • Parallel chunk processing │   │    (existing)                │
│  • Same voice all chunks     │   │  • Two voices all chunks     │
└──────────────────────────────┘   └──────────────────────────────┘
                    │                              │
                    ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         TTS Client (Gemini API)                      │
│                                                                       │
│  Single-Speaker:                      Multi-Speaker:                 │
│  ┌────────────────────────┐           ┌────────────────────────┐    │
│  │ types.SpeechConfig(    │           │ types.SpeechConfig(    │    │
│  │   voice_config=        │           │   multi_speaker_voice  │    │
│  │     VoiceConfig(       │           │   _config=             │    │
│  │       prebuilt_voice   │           │     MultiSpeaker       │    │
│  │       _config=         │           │     VoiceConfig([      │    │
│  │         Prebuilt...    │           │       speaker1_config, │    │
│  │         (voice_name)   │           │       speaker2_config  │    │
│  │     )                  │           │     ])                 │    │
│  │   )                    │           │   )                    │    │
│  │ )                      │           │ )                      │    │
│  └────────────────────────┘           └────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Google Gemini 2.5 Flash TTS                       │
│                                                                       │
│  • Generates audio based on voice configuration                      │
│  • Single-speaker: One consistent voice                              │
│  • Multi-speaker: Two distinct voices with role prefixes            │
│  • Same TTS markup support for both formats                         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Audio Output                                 │
│                                                                       │
│  • WAV format audio file                                            │
│  • Uploaded to S3                                                    │
│  • Episode updated with audio_url and duration                       │
│  • Status set to 'completed'                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Decisions

### 1. Format Detection at Handler Level
**Decision:** Extract `podcast_format` from `dynamic_config` in the handler
**Rationale:**
- Single source of truth from Script Preprocessor
- Easy to log and debug
- Clear separation of concerns

### 2. Routing at Generator Level
**Decision:** Route to single-speaker or multi-speaker methods in `GooglePodcastGenerator`
**Rationale:**
- Centralized routing logic
- Easy to maintain and extend
- Clear code paths for each format

### 3. Separate TTS Client Methods
**Decision:** Create new `generate_single_speaker_audio()` instead of modifying existing method
**Rationale:**
- Avoid complex conditional logic
- Easier to test and validate
- Clear API for each format
- Reduces risk of regression

### 4. Voice Configuration Difference
**Decision:** Use `VoiceConfig` for single-speaker, `MultiSpeakerVoiceConfig` for multi-speaker
**Rationale:**
- Follows Google Gemini TTS API best practices
- Ensures voice consistency
- Clear distinction between formats
- Optimal TTS generation for each format

### 5. Backward Compatibility
**Decision:** Default `podcast_format` to 'multi-speaker' if not specified
**Rationale:**
- No breaking changes for existing podcasts
- Gradual migration path
- Safe fallback behavior

---

## Voice Consistency Strategy

### Problem
In parallel chunk processing, each chunk is generated independently. Without proper voice management, different chunks might use different voices, causing inconsistency.

### Solution: Pre-Selected Voices
```
Script Preprocessor (Phase 3.1)
    ↓
Selects voices deterministically based on episode_id
    ↓
Passes voices in dynamic_config
    ↓
Audio Handler ensures voices present
    ↓
All chunks use same pre-selected voices
    ↓
Voice consistency guaranteed
```

### Fallback Strategy
If voices missing from dynamic_config (e.g., SQS retry):
1. Check episode metadata in database
2. If found, use stored voices
3. If not found, regenerate deterministically using episode_id
4. Log warning for debugging

---

## Chunking Strategy

### When to Chunk
- Script length > 1500 characters
- Prevents timeout on long scripts
- Enables parallel processing

### Chunk Processing
```python
# Split into chunks
chunks = chunk_manager.split_script_into_chunks(script_content)

# Process in parallel (max 4 workers)
with ThreadPoolExecutor(max_workers=4) as executor:
    futures = {executor.submit(process_chunk, chunk): i
               for i, chunk in enumerate(chunks)}

# Wait for all chunks to complete
for future in as_completed(futures):
    result = future.result()

# Concatenate audio in correct order
final_audio = concatenate_wav_files(audio_chunks)
```

### Voice Consistency in Chunks
- Same `speaker1_voice` passed to all chunks
- Same `speaker2_voice` passed to all chunks (multi-speaker)
- Pre-selection prevents random voice selection per chunk

---

## Error Handling Architecture

### Error Types

#### 1. Deferrable Errors (Transient)
**Errors:**
- Timeout (>480s TTS call)
- Rate limit (429)
- Insufficient Lambda time remaining

**Handling:**
```python
raise DeferrableError(message)
    ↓
Episode status → 'script_ready'
    ↓
Message returns to SQS
    ↓
Retry automatically
```

#### 2. Retryable Errors (Transient)
**Errors:**
- Google 500 Internal Server Error
- Transient network issues

**Handling:**
```python
Retry up to 3 times per chunk
    ↓
If still failing → convert to DeferrableError
    ↓
Episode deferred for retry
```

#### 3. Fatal Errors (Non-Transient)
**Errors:**
- Invalid voice name
- Missing required configuration
- Validation failure (silent audio)

**Handling:**
```python
raise Exception(message)
    ↓
Episode status → 'failed'
    ↓
No retry, requires manual intervention
```

---

## Performance Characteristics

### Single-Speaker
**Short Script (< 1500 chars):**
- Processing time: ~60-90s
- No chunking needed
- Direct TTS generation

**Long Script (> 1500 chars):**
- Processing time: ~120-240s for 3000 chars
- Parallel chunking (4 workers)
- Faster than sequential

### Multi-Speaker
**No change from existing implementation:**
- Short script: ~60-90s
- Long script: ~120-240s for 3000 chars
- Parallel chunking (4 workers)

### Timeout Protection
- Per-chunk timeout: 480s (8 minutes)
- Lambda timeout: 900s (15 minutes)
- Buffer for retries and processing

---

## Data Flow

### Single-Speaker Episode
```
1. SQS Message arrives with podcast_format='single-speaker'
    ↓
2. Handler extracts format and validates speaker1_voice present
    ↓
3. Script processed (Hebrew niqqud if needed)
    ↓
4. Generator routes to single-speaker path
    ↓
5. TTS Client uses VoiceConfig with single voice
    ↓
6. Gemini generates audio with consistent voice
    ↓
7. Audio uploaded to S3
    ↓
8. Episode updated with audio_url, duration, status='completed'
    ↓
9. Callback sent to Next.js API for post-processing
```

### Multi-Speaker Episode
```
1. SQS Message arrives with podcast_format='multi-speaker' (or omitted)
    ↓
2. Handler extracts format and validates both voices present
    ↓
3. Script processed (Hebrew niqqud if needed)
    ↓
4. Generator routes to multi-speaker path (existing logic)
    ↓
5. TTS Client uses MultiSpeakerVoiceConfig with two voices
    ↓
6. Gemini generates audio with distinct speakers
    ↓
7. Audio uploaded to S3
    ↓
8. Episode updated with audio_url, duration, status='completed'
    ↓
9. Callback sent to Next.js API for post-processing
```

---

## Configuration Schema

### SQS Message Format
```json
{
  "episode_id": "string (required)",
  "podcast_id": "string (required)",
  "podcast_config_id": "string (required)",
  "script_url": "string (required, S3 URL)",
  "dynamic_config": {
    "podcast_format": "single-speaker | multi-speaker (default: multi-speaker)",
    "language": "string (e.g., 'he', 'en')",
    "speaker1_role": "string (required)",
    "speaker2_role": "string | null (null for single-speaker)",
    "speaker1_gender": "male | female",
    "speaker2_gender": "male | female | null (null for single-speaker)",
    "speaker1_voice": "string (required, e.g., 'Alnilam')",
    "speaker2_voice": "string | null (null for single-speaker)",
    "content_analysis": {
      "content_type": "news | technology | entertainment | finance | general",
      "role_description": "string",
      "confidence": "number (0.0-1.0)"
    }
  }
}
```

### Response Format
```json
{
  "status": "success | error | deferred",
  "episode_id": "string",
  "audio_url": "string (S3 URL)",
  "duration": "number (seconds)",
  "content_type": "string",
  "speaker2_role": "string | null",
  "role_description": "string",
  "confidence": "number",
  "has_niqqud": "boolean"
}
```

---

## Testing Strategy

### Unit Tests
- [ ] Handler extracts podcast_format correctly
- [ ] Generator routes to correct method
- [ ] TTS Client uses correct voice configuration
- [ ] Voice consistency maintained across chunks

### Integration Tests
- [ ] Single-speaker short script end-to-end
- [ ] Single-speaker long script with chunking
- [ ] Multi-speaker regression test
- [ ] Error handling (timeout, rate limit, 500 error)

### Performance Tests
- [ ] Parallel chunk processing faster than sequential
- [ ] No timeout on long scripts
- [ ] Memory usage acceptable

---

## Monitoring & Observability

### CloudWatch Metrics
- Episode generation duration
- Chunk processing time
- TTS API call duration
- Error rates by type

### CloudWatch Logs
Key log lines for debugging:
```
[AUDIO_GEN] podcast_format: {format}
[GOOGLE_TTS] Format: {format}
[GOOGLE_TTS] Using {format} generation
[TTS_CLIENT] Voice: {voice}
[TTS_CLIENT] Generated {bytes} bytes, duration: {duration}s
```

### Alerts
- High error rate (>5% in 5 minutes)
- Long processing time (>600s)
- High rate limit hit rate (>10% in 5 minutes)

---

## Future Enhancements

### Potential Improvements
1. **Dynamic voice selection per episode**
   - Allow user to select voice in UI
   - Store preference in podcast_config

2. **Voice preview**
   - Generate sample audio with different voices
   - Let user listen before finalizing

3. **Multi-language support**
   - Mix languages in single episode
   - Language detection per segment

4. **Advanced TTS controls**
   - Custom emphasis patterns
   - Pronunciation dictionaries
   - Speaking rate adjustments per speaker

5. **Voice cloning**
   - Train custom voices
   - Personal voice profiles

---

## Security Considerations

### API Key Management
- Gemini API key stored in AWS Secrets Manager
- Never logged or exposed
- Rotated regularly

### S3 Access
- Least privilege IAM roles
- Signed URLs for audio access
- Encryption at rest

### Rate Limiting
- Token bucket algorithm
- Per-Lambda instance rate limiting
- Graceful degradation on limit hit

---

## Deployment

### Requirements
- Python 3.11+
- AWS Lambda runtime
- Google Gemini API access
- S3 bucket for audio storage
- SQS queue for messages

### Environment Variables
```bash
GEMINI_API_KEY=<api-key>
SUPABASE_URL=<url>
SUPABASE_SERVICE_KEY=<key>
S3_BUCKET_NAME=<bucket>
AWS_REGION=<region>
TTS_REQUESTS_PER_MINUTE=9
```

### Deployment Steps
1. Update shared layer with new TTS client methods
2. Deploy shared layer
3. Update Lambda function code
4. Deploy Lambda function
5. Test with sample episodes
6. Monitor CloudWatch logs
7. Gradual rollout to production

---

**Architecture documentation complete. Ready for implementation and testing.**
