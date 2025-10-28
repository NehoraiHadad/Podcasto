# Phase 3.2 Testing Checklist

## Pre-Deployment Validation

### Code Quality ✅
- [x] Handler syntax check passed
- [x] Generator syntax check passed
- [x] TTS Client syntax check passed
- [x] All imports verified
- [x] Type hints correct

### Backward Compatibility ✅
- [x] `podcast_format` defaults to 'multi-speaker'
- [x] Multi-speaker code path unchanged
- [x] Response format identical for both formats
- [x] No breaking changes to existing logic

---

## Test Scenarios

### 1. Single-Speaker Short Script (< 1500 chars)
**Test Case:** Single-speaker podcast with short script
**Expected Behavior:**
- Routes to `generate_single_speaker_audio()`
- Uses `VoiceConfig` (not `MultiSpeakerVoiceConfig`)
- Single voice throughout
- Audio generated successfully
- Duration calculated correctly

**Test Command:**
```python
# SQS message format
{
    "episode_id": "test-single-short-123",
    "podcast_id": "podcast-123",
    "podcast_config_id": "config-123",
    "script_url": "s3://bucket/script.txt",
    "dynamic_config": {
        "podcast_format": "single-speaker",
        "language": "he",
        "speaker1_role": "Narrator",
        "speaker2_role": None,
        "speaker1_gender": "male",
        "speaker2_gender": None,
        "speaker1_voice": "Alnilam",
        "speaker2_voice": None,
        "content_analysis": {
            "content_type": "news"
        }
    }
}
```

**Validation:**
- [ ] Audio file generated in S3
- [ ] Episode status = 'completed'
- [ ] Duration > 0
- [ ] audio_url returned
- [ ] Voice consistency verified
- [ ] CloudWatch logs show "single-speaker generation"

---

### 2. Single-Speaker Long Script (> 1500 chars)
**Test Case:** Single-speaker podcast with long script requiring chunking
**Expected Behavior:**
- Routes to `_generate_single_speaker_chunked()`
- Chunks processed in parallel
- Same voice across all chunks
- All chunks successful
- Audio concatenated correctly

**Test Command:**
```python
# SQS message with script_url pointing to long script (>3000 chars)
{
    "episode_id": "test-single-long-456",
    "podcast_id": "podcast-123",
    "podcast_config_id": "config-123",
    "script_url": "s3://bucket/long-script.txt",
    "dynamic_config": {
        "podcast_format": "single-speaker",
        "language": "en",
        "speaker1_role": "Host",
        "speaker2_role": None,
        "speaker1_gender": "female",
        "speaker2_gender": None,
        "speaker1_voice": "Leda",
        "speaker2_voice": None,
        "content_analysis": {
            "content_type": "technology"
        }
    }
}
```

**Validation:**
- [ ] Audio file generated in S3
- [ ] Episode status = 'completed'
- [ ] Multiple chunks processed (check logs)
- [ ] No failed chunks
- [ ] Voice consistency across chunks
- [ ] CloudWatch logs show "Split single-speaker content into N chunks"

---

### 3. Multi-Speaker Regression Test
**Test Case:** Multi-speaker podcast (existing format)
**Expected Behavior:**
- Routes to existing multi-speaker logic
- Uses `MultiSpeakerVoiceConfig`
- Two distinct voices
- No regression in quality

**Test Command:**
```python
# SQS message format
{
    "episode_id": "test-multi-789",
    "podcast_id": "podcast-123",
    "podcast_config_id": "config-123",
    "script_url": "s3://bucket/script.txt",
    "dynamic_config": {
        "podcast_format": "multi-speaker",  # or omit for default
        "language": "he",
        "speaker1_role": "Host",
        "speaker2_role": "Guest",
        "speaker1_gender": "male",
        "speaker2_gender": "female",
        "speaker1_voice": "Alnilam",
        "speaker2_voice": "Aoede",
        "content_analysis": {
            "content_type": "general"
        }
    }
}
```

**Validation:**
- [ ] Audio file generated in S3
- [ ] Episode status = 'completed'
- [ ] Two distinct voices audible
- [ ] Duration > 0
- [ ] No regression in audio quality
- [ ] CloudWatch logs show "multi-speaker generation"

---

### 4. Voice Consistency Test (Chunked Single-Speaker)
**Test Case:** Verify voice doesn't change mid-episode
**Expected Behavior:**
- Same voice in chunk 1, chunk 2, chunk 3, etc.
- No voice variations or switches

**Validation:**
- [ ] Listen to entire episode
- [ ] Voice consistent throughout
- [ ] No unexpected voice changes
- [ ] Quality consistent across chunks

---

### 5. Error Handling Test (Timeout)
**Test Case:** Simulate timeout scenario
**Expected Behavior:**
- DeferrableError raised
- Episode status = 'script_ready' (not 'failed')
- Message returns to SQS for retry

**Validation:**
- [ ] Episode not marked as 'failed'
- [ ] Episode status = 'script_ready'
- [ ] CloudWatch logs show "DeferrableError"
- [ ] SQS message returned to queue

---

### 6. Error Handling Test (Rate Limit 429)
**Test Case:** Hit rate limit
**Expected Behavior:**
- DeferrableError raised
- Episode deferred with retry delay
- Episode status = 'script_ready'

**Validation:**
- [ ] Episode not marked as 'failed'
- [ ] CloudWatch logs show "Rate limit (429)"
- [ ] Episode deferred for retry

---

### 7. Hebrew Content Test (Single-Speaker)
**Test Case:** Single-speaker Hebrew podcast
**Expected Behavior:**
- Niqqud processing applied
- Proper Hebrew pronunciation
- Voice consistent

**Test Command:**
```python
{
    "episode_id": "test-hebrew-single-999",
    "podcast_id": "podcast-123",
    "podcast_config_id": "config-123",
    "script_url": "s3://bucket/hebrew-script.txt",
    "dynamic_config": {
        "podcast_format": "single-speaker",
        "language": "he",
        "speaker1_role": "מספר",
        "speaker2_role": None,
        "speaker1_gender": "male",
        "speaker2_gender": None,
        "speaker1_voice": "Alnilam",
        "speaker2_voice": None,
        "content_analysis": {
            "content_type": "news"
        }
    }
}
```

**Validation:**
- [ ] Audio generated successfully
- [ ] Hebrew pronunciation correct
- [ ] Niqqud applied (check transcript in S3)
- [ ] Voice consistency maintained

---

### 8. TTS Markup Test
**Test Case:** Verify TTS markup is respected
**Script with markup:**
```
Speaker 1: This is important [emphasis]very important[/emphasis] information.
[pause]
We need to consider [excited]all the possibilities[/excited] here.
```

**Validation:**
- [ ] Emphasis applied correctly
- [ ] Pauses respected
- [ ] Excitement conveyed
- [ ] Markup processed for both single and multi-speaker

---

## Integration Tests

### 9. End-to-End Single-Speaker Flow
**Test Case:** Full pipeline from trigger to completion
**Steps:**
1. Trigger episode generation (single-speaker format)
2. Telegram Lambda fetches content
3. Script Preprocessor generates script with single-speaker config
4. Audio Lambda generates single-speaker audio
5. Episode marked as completed
6. Email notification sent

**Validation:**
- [ ] Episode generated successfully
- [ ] Audio playable
- [ ] Email received
- [ ] Database updated correctly

---

### 10. End-to-End Multi-Speaker Flow (Regression)
**Test Case:** Ensure multi-speaker still works
**Steps:**
1. Trigger episode generation (multi-speaker format)
2. Full pipeline completes
3. Episode playable

**Validation:**
- [ ] No regression in multi-speaker format
- [ ] Two distinct voices audible
- [ ] Episode playable
- [ ] Email received

---

## Performance Tests

### 11. Parallel Chunk Processing
**Test Case:** Long script (>4500 chars) with 3+ chunks
**Expected Behavior:**
- Chunks processed in parallel
- Total time < sequential processing time
- All chunks successful

**Validation:**
- [ ] CloudWatch logs show parallel processing
- [ ] Duration reasonable for content length
- [ ] All chunks successful

---

## Deployment Validation

### Post-Deployment Checks
- [ ] Lambda deployed successfully
- [ ] Environment variables correct
- [ ] CloudWatch logs accessible
- [ ] SQS queue configured correctly
- [ ] IAM permissions correct
- [ ] S3 bucket accessible

### Smoke Tests
- [ ] Generate single-speaker test episode
- [ ] Generate multi-speaker test episode
- [ ] Verify both complete successfully
- [ ] Listen to audio quality

---

## CloudWatch Log Validation

### Required Log Lines (Single-Speaker)
```
[AUDIO_GEN] podcast_format: single-speaker
[GOOGLE_TTS] Format: single-speaker
[GOOGLE_TTS] Using single-speaker generation
[TTS_CLIENT] ===== Single-Speaker Audio Generation =====
[TTS_CLIENT] Calling Gemini 2.5 pro TTS API (single-speaker)...
[TTS_CLIENT] Generated X bytes of single-speaker audio, duration: Xs
```

### Required Log Lines (Multi-Speaker)
```
[AUDIO_GEN] podcast_format: multi-speaker
[GOOGLE_TTS] Format: multi-speaker
[GOOGLE_TTS] Using multi-speaker generation
[TTS_CLIENT] ===== Voice Selection Debug =====
[TTS_CLIENT] Generated X bytes of audio, duration: Xs
```

---

## Known Issues / Edge Cases

### Edge Case 1: Missing podcast_format
**Behavior:** Should default to 'multi-speaker'
**Test:** Send message without podcast_format field
**Expected:** Routes to multi-speaker logic

### Edge Case 2: Invalid podcast_format value
**Behavior:** Should default to multi-speaker or raise error
**Test:** Send `podcast_format: "invalid"`
**Expected:** Graceful handling

### Edge Case 3: Single-speaker with speaker2_voice present
**Behavior:** Should ignore speaker2_voice
**Test:** Send single-speaker with speaker2_voice
**Expected:** Uses only speaker1_voice

---

## Success Criteria

✅ All test cases pass
✅ No regression in multi-speaker format
✅ Voice consistency maintained
✅ Error handling works correctly
✅ Performance acceptable
✅ CloudWatch logs correct
✅ Audio quality high for both formats

---

**Status:** Ready for testing
**Next Step:** Deploy to development environment and run test suite
