# Phase 3.1 Validation Guide

## Quick Validation Checklist

Use this guide to validate that the Script Preprocessor Lambda correctly handles single-speaker script generation.

---

## 1. Code Validation

### Syntax Check:
```bash
cd /home/ubuntu/projects/podcasto/Lambda/script-preprocessor-lambda
python3 -m py_compile src/handlers/script_preprocessor_handler.py
python3 -m py_compile src/services/gemini_script_generator.py
```

**Expected Result:** No syntax errors

---

## 2. Method Existence Check

### Verify All Methods Exist:
```bash
grep -n "def.*speaker.*script" src/services/gemini_script_generator.py
```

**Expected Output:**
```
94:    def _generate_single_speaker_script(
154:    def _generate_multi_speaker_script(
```

### Verify Prompt Builders Exist:
```bash
grep -n "def.*prompt" src/services/gemini_script_generator.py
```

**Expected Output:**
```
221:    def _build_script_prompt(
641:    def _build_single_speaker_prompt(
1074:    def _format_clean_content_for_prompt(
```

---

## 3. Integration Points Validation

### Check Handler Extracts podcast_format:
```bash
grep -A 3 "podcast_format" src/handlers/script_preprocessor_handler.py | head -20
```

**Expected:** Should show extraction from `dynamic_config` or message

### Check Handler Passes podcast_format:
```bash
grep "generate_script" src/handlers/script_preprocessor_handler.py
```

**Expected:** Should show `podcast_format` parameter in call

### Check Routing Logic:
```bash
grep -A 5 "if podcast_format" src/services/gemini_script_generator.py
```

**Expected:** Should show routing to single-speaker or multi-speaker method

---

## 4. Test Message Structures

### Single-Speaker Test Message (Input to Script Preprocessor):

```json
{
  "episode_id": "test-episode-001",
  "podcast_id": "test-podcast-001",
  "podcast_config_id": "test-config-001",
  "s3_path": "podcasts/test-podcast-001/telegram/test-episode-001/telegram_data.json",
  "dynamic_config": {
    "podcast_format": "single-speaker",
    "speaker1_role": "Host",
    "speaker2_role": null,
    "speaker1_gender": "male",
    "language": "he"
  }
}
```

### Expected Output Message (To Audio Generation Lambda):

```json
{
  "episode_id": "test-episode-001",
  "podcast_id": "test-podcast-001",
  "podcast_config_id": "test-config-001",
  "script_url": "s3://bucket/podcasts/test-podcast-001/episodes/test-episode-001/script_20250128_120000.txt",
  "dynamic_config": {
    "podcast_format": "single-speaker",
    "speaker1_role": "Host",
    "speaker2_role": null,
    "speaker1_voice": "Alnilam",
    "speaker2_voice": null,
    "speaker1_gender": "male",
    "speaker2_gender": null,
    "language": "he",
    "content_analysis": { ... },
    "topic_analysis": { ... }
  }
}
```

**Key Validations:**
- ✅ `podcast_format` preserved
- ✅ `speaker2_role` is `null`
- ✅ `speaker2_voice` is `null`
- ✅ `speaker1_voice` selected
- ✅ `script_url` points to generated script

---

## 5. Script Format Validation

### Single-Speaker Script Format:

```
Host: [excited] Opening line that grabs attention...
Host: [pause] Now, let me explain why this is important...
Host: [thoughtful] When you think about it, what's really happening is...
Host: [emphasis]Key point[/emphasis] that drives the message home.
Host: [curious] You might be wondering, what does this mean for you?
```

**Validation Criteria:**
- ✅ All lines start with same role identifier (e.g., "Host:")
- ✅ No second speaker present
- ✅ TTS markup used: `[excited]`, `[pause]`, `[emphasis]text[/emphasis]`
- ✅ No personal names in content
- ✅ No placeholders: `[name]`, `___`, etc.

### Multi-Speaker Script Format (Should Remain Unchanged):

```
Host: [excited] Wait, so you're telling me this actually happened?
Expert: [amused] I know, right? When I first heard about it...
Host: [curious] Okay, so walk me through this...
Expert: [thoughtful] Well, it's a bit more complex than that...
```

**Validation Criteria:**
- ✅ Two different role identifiers (e.g., "Host:", "Expert:")
- ✅ Back-and-forth conversation structure
- ✅ TTS markup present
- ✅ No personal names

---

## 6. Adaptive Instructions Validation

### Test Content Metrics:

**High Content (Compression Required):**
```python
content_metrics = {
    'category': 'high',
    'strategy': 'compression',
    'target_ratio': 0.7,
    'message_count': 50,
    'total_chars': 15000,
    'target_script_chars': 10500
}
```

**Expected Prompt Contains:**
```
⚠️ CONTENT VOLUME ALERT: HIGH (50 messages, 15000 characters)
**🎯 COMPRESSION STRATEGY REQUIRED:**
1. Coverage Mode: SELECTIVE
   - Focus ONLY on main topics (5-7 key topics maximum)
```

**Low Content (Expansion Allowed):**
```python
content_metrics = {
    'category': 'low',
    'strategy': 'expansion',
    'target_ratio': 1.3,
    'message_count': 5,
    'total_chars': 2000,
    'target_script_chars': 2600
}
```

**Expected Prompt Contains:**
```
📝 CONTENT VOLUME: LOW (5 messages, 2000 characters)
**🎯 EXPANSION STRATEGY - STAY GROUNDED:**
1. Coverage Mode: COMPREHENSIVE
   - Cover ALL topics from the source material
```

---

## 7. Voice Selection Validation

### Single-Speaker Voice Selection:

```python
# Handler calls with podcast_format='single-speaker'
speaker1_voice, _ = voice_manager.get_distinct_voices_for_speakers(
    language='he',
    speaker1_gender='male',
    speaker2_gender='male',  # dummy
    speaker1_role='Host',
    speaker2_role='Unused',  # dummy
    episode_id='test-001',
    randomize_speaker2=False
)
```

**Expected:**
- `speaker1_voice` = "Alnilam" (for Hebrew male)
- `speaker2_voice` = ignored (not stored)
- `dynamic_config['speaker2_voice']` = `None`

### Multi-Speaker Voice Selection (Unchanged):

```python
speaker1_voice, speaker2_voice = voice_manager.get_distinct_voices_for_speakers(
    language='he',
    speaker1_gender='male',
    speaker2_gender='female',
    speaker1_role='Host',
    speaker2_role='Expert',
    episode_id='test-001',
    randomize_speaker2=True
)
```

**Expected:**
- `speaker1_voice` = "Alnilam" (Hebrew male)
- `speaker2_voice` = "Aoede" (Hebrew female)
- Both stored in `dynamic_config`

---

## 8. Logging Validation

### Expected Log Messages:

**Single-Speaker:**
```
[GEMINI_SCRIPT] Starting single-speaker script generation
[GEMINI_SCRIPT] Format: single-speaker
[GEMINI_SCRIPT] Speaker gender: male
[PREPROC] Selected single voice for episode test-001: Host=Alnilam
```

**Multi-Speaker:**
```
[GEMINI_SCRIPT] Starting multi-speaker script generation
[GEMINI_SCRIPT] Format: multi-speaker
[GEMINI_SCRIPT] Speaker genders: Speaker1=male, Speaker2=female
[PREPROC] Selected voices for episode test-001: Host=Alnilam, Expert=Aoede
```

---

## 9. Error Handling Validation

### Test Cases:

**1. Missing podcast_format:**
```python
# Message without podcast_format field
message = {
    "episode_id": "test-001",
    "podcast_id": "podcast-001"
}
```
**Expected:** Defaults to "multi-speaker" (backward compatible)

**2. Invalid podcast_format:**
```python
message = {
    "episode_id": "test-001",
    "podcast_format": "invalid-value"
}
```
**Expected:** Defaults to "multi-speaker"

**3. Script generation failure:**
```python
# Gemini API error
```
**Expected:** Exception raised with clear error message, logged with episode_id

---

## 10. Backward Compatibility Validation

### Multi-Speaker Podcasts Should Work Unchanged:

**Test:**
1. Send message with `podcast_format = "multi-speaker"`
2. Verify script generated with two speakers
3. Verify both voices selected
4. Verify script format unchanged

**Test:**
1. Send message WITHOUT `podcast_format` field
2. Verify defaults to "multi-speaker"
3. Verify script generated with two speakers
4. Verify backward compatible with existing podcasts

---

## 11. Database Validation

### Episode Metadata Should Include:

```python
episode_metadata = {
    "speaker1_voice": "Alnilam",
    "speaker2_voice": None,  # or "Aoede" for multi-speaker
    "speaker1_role": "Host",
    "speaker2_role": None,  # or "Expert" for multi-speaker
    "speaker1_gender": "male",
    "speaker2_gender": None,  # or "female" for multi-speaker
    "language": "he",
    "podcast_format": "single-speaker"  # or "multi-speaker"
}
```

**Validation:**
```sql
SELECT metadata FROM episodes WHERE id = 'test-episode-001';
```

**Expected JSON:**
- `podcast_format` field present
- `speaker2_*` fields are `null` for single-speaker
- `speaker2_*` fields populated for multi-speaker

---

## 12. End-to-End Flow Validation

### Single-Speaker Flow:

1. **Input:** SQS message with `podcast_format = "single-speaker"`
2. **Handler:** Extracts format, passes to `_apply_dynamic_role()`
3. **Voice Selection:** Selects only speaker1 voice
4. **Script Generation:** Routes to `_generate_single_speaker_script()`
5. **Prompt Building:** Uses `_build_single_speaker_prompt()`
6. **Script Output:** Monologue format with one speaker
7. **S3 Upload:** Script uploaded to S3
8. **Database Update:** Episode metadata includes format
9. **SQS Output:** Message sent to Audio Lambda with format

**Validation Points:**
- ✅ Format preserved throughout flow
- ✅ No speaker2 voice selected
- ✅ Script has monologue structure
- ✅ Metadata correct in database
- ✅ Audio Lambda receives correct format

### Multi-Speaker Flow (Should Be Unchanged):

1. **Input:** SQS message with `podcast_format = "multi-speaker"` (or missing)
2. **Handler:** Extracts format (or defaults)
3. **Voice Selection:** Selects both speaker voices
4. **Script Generation:** Routes to `_generate_multi_speaker_script()`
5. **Prompt Building:** Uses `_build_script_prompt()`
6. **Script Output:** Dialogue format with two speakers
7. **S3 Upload:** Script uploaded to S3
8. **Database Update:** Episode metadata includes format
9. **SQS Output:** Message sent to Audio Lambda with format

**Validation Points:**
- ✅ Format preserved (or defaulted)
- ✅ Both voices selected
- ✅ Script has dialogue structure
- ✅ Metadata correct in database
- ✅ Audio Lambda receives correct format

---

## 13. Manual Testing Procedure

### Setup:
1. Deploy updated Script Preprocessor Lambda
2. Ensure test Telegram data exists in S3
3. Have test podcast configurations in database

### Test 1: Single-Speaker Hebrew Podcast
```json
{
  "episode_id": "test-single-he-001",
  "podcast_id": "test-podcast-he",
  "dynamic_config": {
    "podcast_format": "single-speaker",
    "language": "he"
  }
}
```

**Verify:**
- Script generated in Hebrew
- Only one speaker (מנחה)
- Monologue format
- TTS markup present
- No personal names

### Test 2: Single-Speaker English Podcast
```json
{
  "episode_id": "test-single-en-001",
  "podcast_id": "test-podcast-en",
  "dynamic_config": {
    "podcast_format": "single-speaker",
    "language": "en"
  }
}
```

**Verify:**
- Script generated in English
- Only one speaker (Host)
- Monologue format
- TTS markup present
- No personal names

### Test 3: Multi-Speaker Podcast (Regression Test)
```json
{
  "episode_id": "test-multi-001",
  "podcast_id": "test-podcast-multi",
  "dynamic_config": {
    "podcast_format": "multi-speaker",
    "language": "he"
  }
}
```

**Verify:**
- Script generated with two speakers
- Dialogue format (back-and-forth)
- Both voices selected
- TTS markup present
- No regression from previous behavior

### Test 4: Default Format (No Format Specified)
```json
{
  "episode_id": "test-default-001",
  "podcast_id": "test-podcast-default"
}
```

**Verify:**
- Defaults to multi-speaker
- Script generated with two speakers
- Backward compatible

---

## 14. Performance Validation

### Metrics to Check:

1. **Script Generation Time:**
   - Single-speaker: Should be ~same as multi-speaker (within 10%)
   - Multi-speaker: Should be unchanged

2. **Lambda Execution Time:**
   - Single-speaker: May be slightly faster (one less voice selection)
   - Multi-speaker: Should be unchanged

3. **Script Length:**
   - Single-speaker: Comparable to multi-speaker for same content
   - Adaptive instructions should control length appropriately

4. **Memory Usage:**
   - Should be unchanged (prompt sizes similar)

---

## 15. Quality Validation

### Script Quality Checklist:

**Single-Speaker:**
- [ ] Natural monologue flow (not forced dialogue)
- [ ] Direct address to audience ("you", rhetorical questions)
- [ ] Appropriate TTS markup for solo delivery
- [ ] No speaker names in content
- [ ] Clear structure (hook, intro, main, closing)
- [ ] Engaging and conversational tone
- [ ] Hebrew or English language correctness
- [ ] Adaptive content strategy applied correctly

**Multi-Speaker:**
- [ ] Natural dialogue flow maintained
- [ ] Both speakers have distinct roles
- [ ] Appropriate TTS markup for conversation
- [ ] No speaker names in content
- [ ] Back-and-forth dynamic present
- [ ] No regression from previous quality

---

## 16. Deployment Validation

### Pre-Deployment Checklist:
- [ ] All syntax checks pass
- [ ] All methods exist and callable
- [ ] Unit tests pass (if available)
- [ ] Integration tests pass (if available)
- [ ] Manual testing completed
- [ ] Backward compatibility verified

### Post-Deployment Checklist:
- [ ] Lambda deployed successfully
- [ ] CloudWatch logs show correct format detection
- [ ] Test single-speaker episode generates successfully
- [ ] Test multi-speaker episode generates successfully
- [ ] SQS messages to Audio Lambda include `podcast_format`
- [ ] Database metadata includes `podcast_format`
- [ ] No errors in CloudWatch logs

---

## 17. Rollback Plan

### If Issues Are Detected:

1. **Identify Issue:**
   - Check CloudWatch logs for errors
   - Verify SQS messages structure
   - Check database episode metadata

2. **Immediate Actions:**
   - Roll back Lambda deployment to previous version
   - Verify multi-speaker podcasts still work
   - Investigate root cause

3. **Root Cause Analysis:**
   - Review error logs
   - Check integration points
   - Test locally if possible

4. **Fix and Redeploy:**
   - Fix identified issues
   - Re-run validation tests
   - Deploy updated version

---

## Summary

**Phase 3.1 Validation Complete When:**
- ✅ All syntax checks pass
- ✅ All methods exist
- ✅ Integration points validated
- ✅ Test messages structured correctly
- ✅ Script formats correct
- ✅ Adaptive instructions working
- ✅ Voice selection correct
- ✅ Logging present
- ✅ Error handling works
- ✅ Backward compatibility maintained
- ✅ End-to-end flow validated
- ✅ Manual tests pass
- ✅ Performance acceptable
- ✅ Quality standards met
- ✅ Deployment successful

**Ready for Phase 3.2: Audio Generation Lambda**

---

## Quick Validation Commands

```bash
# 1. Syntax check
cd /home/ubuntu/projects/podcasto/Lambda/script-preprocessor-lambda
python3 -m py_compile src/handlers/script_preprocessor_handler.py
python3 -m py_compile src/services/gemini_script_generator.py

# 2. Method existence
grep "def.*speaker.*script" src/services/gemini_script_generator.py
grep "def.*prompt" src/services/gemini_script_generator.py

# 3. Integration points
grep "podcast_format" src/handlers/script_preprocessor_handler.py
grep "podcast_format" src/services/gemini_script_generator.py

# 4. Routing logic
grep -A 5 "if podcast_format" src/services/gemini_script_generator.py

# All checks pass? ✅ Ready for Phase 3.2!
```
