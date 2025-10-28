# Single-Speaker Podcast Feature - Comprehensive Test Plan

**Feature**: Single-Speaker Podcast Format Support
**Status**: Phase 4.1 - Testing
**Date**: 2025-10-28
**Version**: 1.0

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Frontend Testing](#frontend-testing)
3. [Backend Testing](#backend-testing)
4. [Lambda Function Testing](#lambda-function-testing)
5. [End-to-End Integration Testing](#end-to-end-integration-testing)
6. [Regression Testing](#regression-testing)
7. [Test Results Documentation](#test-results-documentation)

---

## Test Environment Setup

### Prerequisites

- [ ] Access to Admin UI (`/admin/podcasts`)
- [ ] Database access (Supabase)
- [ ] AWS Console access (Lambda, SQS, CloudWatch)
- [ ] Test Telegram channel with recent messages
- [ ] Audio playback capability for validation

### Database Verification

Run the following query to verify schema changes:

```sql
-- Verify podcast_format column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'podcast_configs'
  AND column_name = 'podcast_format';
-- Expected: podcast_format | text | 'multi-speaker'

-- Verify speaker2_role is nullable
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'podcast_configs'
  AND column_name = 'speaker2_role';
-- Expected: speaker2_role | YES
```

### Lambda Deployment Verification

```bash
# Check Lambda function versions
aws lambda list-functions --query 'Functions[?contains(FunctionName, `script-preprocessor`) || contains(FunctionName, `audio-generation`)].{Name:FunctionName,Version:Version,Updated:LastModified}'

# Verify environment variables
aws lambda get-function-configuration --function-name script-preprocessor-lambda-dev --query 'Environment.Variables'
aws lambda get-function-configuration --function-name audio-generation-lambda-dev --query 'Environment.Variables'
```

---

## Frontend Testing

### Test Case 1: Create Single-Speaker Podcast (New Podcast)

**Objective**: Verify UI allows single-speaker podcast creation from scratch

**Steps**:
1. Navigate to `/admin/podcasts/create`
2. Fill in base podcast information:
   - Base Title: "Test Single-Speaker Podcast"
   - Base Description: "Testing single-speaker functionality"
3. Add a language variant (e.g., English)
4. Fill in "Basic Info" tab:
   - Content Source: Telegram
   - Telegram Channel: `<test-channel>`
   - Telegram Hours: 24
   - Creator: "Tester"
   - Podcast Name: "Test Single Speaker"
   - Language: English
5. Navigate to "Style & Roles" tab
6. **Select "Single-Speaker (Monologue)" format**
7. Verify:
   - [ ] Speaker 2 Role field is **hidden**
   - [ ] Only "Speaker Role" field is visible
8. Fill Speaker Role: "Host"
9. Select Conversation Style: "Engaging"
10. Select Creativity Level: 0.5
11. Select at least one Mixing Technique
12. Click "Create Podcast"

**Expected Result**:
- ✅ Podcast created successfully
- ✅ `podcast_format = 'single-speaker'` in database
- ✅ `speaker2_role IS NULL` in database
- ✅ Success toast notification shown
- ✅ Redirected to podcasts list

**Validation Query**:
```sql
SELECT id, podcast_name, podcast_format, speaker1_role, speaker2_role
FROM podcast_configs
WHERE podcast_name = 'Test Single Speaker';
-- Expected: podcast_format='single-speaker', speaker2_role=NULL
```

---

### Test Case 2: Create Multi-Speaker Podcast (Validation Check)

**Objective**: Verify validation enforces speaker2 for multi-speaker format

**Steps**:
1. Navigate to `/admin/podcasts/create`
2. Follow steps from Test Case 1 until "Style & Roles" tab
3. **Select "Multi-Speaker (Dialogue)" format**
4. Verify:
   - [ ] Speaker 1 Role field is visible
   - [ ] Speaker 2 Role field is visible (with required indicator)
5. Fill Speaker 1 Role: "Host"
6. **Leave Speaker 2 Role empty**
7. Try to submit form

**Expected Result**:
- ❌ Form submission blocked
- ✅ Error message displayed: "Speaker 2 role is required for multi-speaker podcasts"
- ✅ Error appears on Speaker 2 Role field
- ✅ Form stays on same page

---

### Test Case 3: Edit Existing Podcast - Switch to Single-Speaker

**Objective**: Verify format switching from multi-speaker to single-speaker

**Steps**:
1. Navigate to `/admin/podcasts`
2. Select an existing **multi-speaker** podcast
3. Click "Edit"
4. Navigate to "Style & Roles" tab
5. Note current values:
   - Current Format: Multi-Speaker
   - Speaker 1 Role: `<value>`
   - Speaker 2 Role: `<value>`
6. **Change format to "Single-Speaker"**
7. Verify:
   - [ ] Speaker 2 Role field disappears
   - [ ] Speaker 1 Role field remains (now labeled "Speaker Role")
8. Click "Save Changes"

**Expected Result**:
- ✅ Update successful
- ✅ `podcast_format = 'single-speaker'` in database
- ✅ `speaker2_role` set to NULL in database
- ✅ Success notification shown

**Validation Query**:
```sql
SELECT id, podcast_name, podcast_format, speaker1_role, speaker2_role
FROM podcast_configs
WHERE id = '<podcast-config-id>';
-- Expected: podcast_format='single-speaker', speaker2_role=NULL
```

---

### Test Case 4: Edit Existing Podcast - Switch to Multi-Speaker

**Objective**: Verify format switching from single-speaker to multi-speaker requires speaker2

**Steps**:
1. Edit a **single-speaker** podcast (from Test Case 3 or create new)
2. Navigate to "Style & Roles" tab
3. **Change format to "Multi-Speaker"**
4. Verify:
   - [ ] Speaker 2 Role field appears (required)
5. **Try to save without filling Speaker 2 Role**

**Expected Result**:
- ❌ Form submission blocked
- ✅ Validation error: "Speaker 2 role is required for multi-speaker podcasts"

**Steps (continued)**:
6. Fill Speaker 2 Role: "Expert"
7. Click "Save Changes"

**Expected Result**:
- ✅ Update successful
- ✅ `podcast_format = 'multi-speaker'` in database
- ✅ `speaker2_role = 'Expert'` in database

---

### Test Case 5: UI Responsiveness - Format Toggle

**Objective**: Verify smooth UI transitions when toggling format

**Steps**:
1. Open create/edit podcast form
2. Navigate to "Style & Roles" tab
3. Toggle between formats rapidly:
   - Single-Speaker → Multi-Speaker (5 times)
   - Multi-Speaker → Single-Speaker (5 times)
4. Observe:
   - [ ] Speaker 2 field shows/hides smoothly
   - [ ] No JavaScript errors in console
   - [ ] Field values persist correctly
   - [ ] Labels update correctly ("Speaker Role" vs "Speaker 1 Role")

**Expected Result**:
- ✅ No UI glitches or lag
- ✅ No console errors
- ✅ Clean transitions

---

## Backend Testing

### Test Case 6: Server Action Validation - Single-Speaker

**Objective**: Test backend validation for single-speaker podcasts

**Test Method**: Database query or API testing tool

**Scenario A - Valid Single-Speaker**:
```typescript
// Server action input
{
  podcastFormat: 'single-speaker',
  speaker1Role: 'narrator',
  speaker2Role: undefined,
  // ... other required fields
}
```

**Expected Result**:
- ✅ Action succeeds
- ✅ Database record created with `speaker2_role = NULL`

---

**Scenario B - Invalid Multi-Speaker (Missing Speaker2)**:
```typescript
// Server action input
{
  podcastFormat: 'multi-speaker',
  speaker1Role: 'host',
  speaker2Role: undefined,
  // ... other required fields
}
```

**Expected Result**:
- ❌ Action fails
- ✅ Error returned: `{ success: false, error: "Speaker 2 role is required for multi-speaker podcasts" }`

---

### Test Case 7: Episode Generation - Config Retrieval

**Objective**: Verify podcast_format is included when triggering episode generation

**Steps**:
1. Use Supabase query or server action to trigger episode for single-speaker podcast
2. Monitor CloudWatch logs for trigger Lambda
3. Check SQS message sent to script-generation-queue

**Expected Log Output**:
```
[LAMBDA_TRIGGER] Sending message to Script Generation Queue for episode <episode-id>
[LAMBDA_TRIGGER] Podcast format: single-speaker
[LAMBDA_TRIGGER] Speaker roles: Speaker1=narrator, Speaker2=null
```

**Expected SQS Message Structure**:
```json
{
  "episode_id": "uuid",
  "podcast_id": "uuid",
  "podcast_config_id": "uuid",
  "script_url": "s3://...",
  "dynamic_config": {
    "podcast_format": "single-speaker",
    "speaker1_role": "narrator",
    "speaker2_role": null,
    "speaker1_gender": "male",
    "language": "en"
  }
}
```

**Validation**:
- [ ] `podcast_format` field present in message
- [ ] `speaker2_role` is null for single-speaker
- [ ] All required fields present

---

## Lambda Function Testing

### Test Case 8: Script Generator - Single-Speaker Script

**Objective**: Verify script generator creates monologue format for single-speaker

**Setup**:
1. Identify or create a single-speaker podcast
2. Trigger episode generation manually via admin UI or API
3. Monitor script-preprocessor Lambda CloudWatch logs

**Expected Log Entries**:
```
[GEMINI_SCRIPT] Starting single-speaker script generation
[GEMINI_SCRIPT] Format: single-speaker
[GEMINI_SCRIPT] Speaker gender: male
[GEMINI_SCRIPT] Using single-speaker monologue template
[GEMINI_SCRIPT] Generated script: <char-count> characters
```

**Script Content Verification**:
1. Download generated script from S3 (check episode S3 path)
2. Verify script structure:
   - [ ] Only one speaker role used throughout
   - [ ] No dialogue format (no "Speaker1:", "Speaker2:")
   - [ ] Monologue structure with direct address to audience
   - [ ] TTS markup present ([pause], [emphasis], etc.)

**Sample Expected Script Format**:
```
Hello everyone, welcome to today's episode. [pause]

Today we're diving into some fascinating developments in the tech world. [excited]

Let me start with the biggest story... [emphasis on "biggest"]
```

---

### Test Case 9: Script Generator - Multi-Speaker Regression

**Objective**: Ensure multi-speaker scripts still generate correctly (backward compatibility)

**Setup**:
1. Use an existing multi-speaker podcast
2. Trigger episode generation
3. Monitor script-preprocessor Lambda logs

**Expected Log Entries**:
```
[GEMINI_SCRIPT] Starting multi-speaker script generation
[GEMINI_SCRIPT] Format: multi-speaker
[GEMINI_SCRIPT] Speaker genders: Speaker1=male, Speaker2=female
[GEMINI_SCRIPT] Using dialogue format template
```

**Script Content Verification**:
- [ ] Two distinct speakers in script
- [ ] Dialogue format present
- [ ] Natural conversation flow
- [ ] Both speaker roles used

---

### Test Case 10: Audio Generator - Single-Speaker Voice

**Objective**: Verify audio generator uses single voice for single-speaker podcasts

**Setup**:
1. Wait for script generation to complete from Test Case 8
2. Monitor audio-generation Lambda CloudWatch logs
3. Check SQS message processing

**Expected Log Entries**:
```
[AUDIO_GENERATION] Processing episode <episode-id>
[AUDIO_GENERATION] Podcast format: single-speaker
[AUDIO_GENERATION] Using single voice: <voice-id>
[AUDIO_GENERATION] Generating audio with consistent voice
[AUDIO_GENERATION] Audio generation completed: <duration>s
```

**Audio File Verification**:
1. Download generated audio from S3
2. Listen to entire episode
3. Verify:
   - [ ] **Single voice throughout entire episode**
   - [ ] No voice changes mid-episode
   - [ ] Consistent tone and pitch
   - [ ] Clear pronunciation
   - [ ] Natural pacing

---

### Test Case 11: Audio Generator - Voice Selection Logic

**Objective**: Verify correct voice selection based on speaker gender and format

**Test Scenarios**:

| Format | Speaker1 Gender | Speaker2 Gender | Expected Voices |
|--------|----------------|----------------|-----------------|
| single-speaker | male | - | 1 male voice |
| single-speaker | female | - | 1 female voice |
| multi-speaker | male | female | 1 male + 1 female |
| multi-speaker | female | male | 1 female + 1 male |

**Validation Method**:
- Check CloudWatch logs for voice selection
- Listen to generated audio
- Confirm voice characteristics match expected gender

---

### Test Case 12: Error Handling - Missing Format Field

**Objective**: Verify graceful fallback when podcast_format is missing

**Setup**:
1. Simulate old SQS message without `podcast_format` field
2. Process through audio generator

**Expected Behavior**:
- ✅ Lambda defaults to 'multi-speaker'
- ✅ Warning logged: "podcast_format not provided, defaulting to multi-speaker"
- ✅ Episode processes successfully (no crash)

---

## End-to-End Integration Testing

### Test Case 13: Complete Episode Generation - Single-Speaker

**Objective**: Full end-to-end test from UI to audio file

**Steps**:
1. Create new single-speaker podcast (Test Case 1)
2. Navigate to podcast detail page in admin
3. Click "Generate Episode"
4. Monitor progress:
   - [ ] Episode status: pending
   - [ ] Episode status: processing
   - [ ] Episode status: completed (wait up to 10 minutes)
5. Check episode details page
6. Play generated audio

**Expected Results**:
- ✅ Episode status progresses correctly
- ✅ No errors in processing
- ✅ Audio file generated successfully
- ✅ Audio URL accessible
- ✅ Duration calculated correctly
- ✅ **Single voice throughout**
- ✅ Audio quality acceptable
- ✅ Content matches Telegram source

**Detailed Validation**:
```sql
-- Check episode record
SELECT id, title, status, audio_url, duration,
       created_at, updated_at
FROM episodes
WHERE id = '<episode-id>';

-- Check processing logs
SELECT stage, status, started_at, completed_at,
       error_message, metadata
FROM episode_processing_logs
WHERE episode_id = '<episode-id>'
ORDER BY started_at;
-- Expected stages: telegram, script, audio, image (all completed)
```

---

### Test Case 14: Complete Episode Generation - Multi-Speaker

**Objective**: Verify multi-speaker episodes still work (regression)

**Steps**:
1. Select existing multi-speaker podcast
2. Generate episode
3. Wait for completion
4. Verify audio has two distinct voices

**Expected Results**:
- ✅ Episode completes successfully
- ✅ Two distinct voices in dialogue
- ✅ Natural conversation flow
- ✅ Quality comparable to before feature implementation

---

### Test Case 15: Bulk Episode Generation

**Objective**: Test multiple episodes across different formats

**Setup**:
1. Create 3 podcasts:
   - Podcast A: single-speaker (male)
   - Podcast B: single-speaker (female)
   - Podcast C: multi-speaker (male + female)
2. Generate episodes for all three simultaneously

**Expected Results**:
- ✅ All episodes process correctly
- ✅ No cross-contamination of voice settings
- ✅ Each episode uses correct format/voices
- ✅ All complete without errors

**Validation**:
```sql
-- Check all episodes completed
SELECT p.podcast_name, pc.podcast_format, e.status, e.audio_url
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.id IN ('<episode-a>', '<episode-b>', '<episode-c>');
-- Expected: All status='completed', all have audio_url
```

---

### Test Case 16: Episode Regeneration

**Objective**: Test regenerating audio for existing episode

**Steps**:
1. Select completed single-speaker episode
2. Click "Regenerate Audio" from actions menu
3. Confirm regeneration
4. Wait for completion
5. Verify new audio file

**Expected Results**:
- ✅ New audio generated
- ✅ Still uses single voice
- ✅ Voice may differ from original (voice selection is episode-specific)
- ✅ Audio quality maintained
- ✅ Duration may vary slightly

---

## Regression Testing

### Test Case 17: Existing Multi-Speaker Podcasts

**Objective**: Ensure existing podcasts work without modification

**Steps**:
1. Query for oldest multi-speaker podcasts:
   ```sql
   SELECT id, podcast_name, podcast_format, speaker1_role, speaker2_role
   FROM podcast_configs
   WHERE podcast_format = 'multi-speaker'
   ORDER BY created_at
   LIMIT 5;
   ```
2. For each podcast:
   - View in admin UI
   - Verify all fields display correctly
   - Generate new episode
   - Verify episode completes successfully

**Expected Results**:
- ✅ All existing podcasts load correctly
- ✅ Format field shows "Multi-Speaker"
- ✅ Both speaker roles visible
- ✅ Episode generation works as before

---

### Test Case 18: Database Migration Verification

**Objective**: Verify all existing records have podcast_format set

**Validation Query**:
```sql
-- Check for NULL podcast_format (should be 0)
SELECT COUNT(*) as null_format_count
FROM podcast_configs
WHERE podcast_format IS NULL;
-- Expected: 0

-- Check format distribution
SELECT podcast_format, COUNT(*) as count
FROM podcast_configs
GROUP BY podcast_format;
-- Expected: Majority 'multi-speaker', some 'single-speaker'

-- Verify data consistency
SELECT COUNT(*) as inconsistent_count
FROM podcast_configs
WHERE podcast_format = 'multi-speaker'
  AND speaker2_role IS NULL;
-- Expected: 0 (multi-speaker must have speaker2_role)

SELECT COUNT(*) as inconsistent_count
FROM podcast_configs
WHERE podcast_format = 'single-speaker'
  AND speaker2_role IS NOT NULL;
-- Expected: 0 (single-speaker should not have speaker2_role)
```

---

### Test Case 19: User-Created Podcasts

**Objective**: Test non-admin user podcast creation flow

**Steps**:
1. Log in as regular user (not admin)
2. Navigate to `/podcasts/create`
3. Create podcast with default settings
4. Verify podcast created with correct defaults

**Expected Results**:
- ✅ User form defaults to multi-speaker (backward compatible)
- ✅ Both speaker roles set correctly
- ✅ Podcast functional

**Note**: Regular users may not have format selector - verify this is intentional

---

## Test Results Documentation

### Test Execution Log

Record results for each test case:

| Test Case | Date | Tester | Status | Notes |
|-----------|------|--------|--------|-------|
| TC-1: Create Single-Speaker | | | ⏳ Pending | |
| TC-2: Validation Check | | | ⏳ Pending | |
| TC-3: Edit to Single-Speaker | | | ⏳ Pending | |
| TC-4: Edit to Multi-Speaker | | | ⏳ Pending | |
| TC-5: UI Responsiveness | | | ⏳ Pending | |
| TC-6: Server Action Validation | | | ⏳ Pending | |
| TC-7: Episode Config Retrieval | | | ⏳ Pending | |
| TC-8: Script Gen Single-Speaker | | | ⏳ Pending | |
| TC-9: Script Gen Multi-Speaker | | | ⏳ Pending | |
| TC-10: Audio Gen Single Voice | | | ⏳ Pending | |
| TC-11: Voice Selection Logic | | | ⏳ Pending | |
| TC-12: Error Handling | | | ⏳ Pending | |
| TC-13: E2E Single-Speaker | | | ⏳ Pending | |
| TC-14: E2E Multi-Speaker | | | ⏳ Pending | |
| TC-15: Bulk Generation | | | ⏳ Pending | |
| TC-16: Episode Regeneration | | | ⏳ Pending | |
| TC-17: Existing Podcasts | | | ⏳ Pending | |
| TC-18: Migration Verification | | | ⏳ Pending | |
| TC-19: User Podcast Creation | | | ⏳ Pending | |

**Status Legend**:
- ⏳ Pending
- 🔄 In Progress
- ✅ Passed
- ❌ Failed
- ⚠️ Passed with Issues

---

### Bug Report Template

When a test fails, document using this template:

```markdown
## Bug Report: [Short Description]

**Test Case**: TC-X
**Severity**: Critical / High / Medium / Low
**Date Found**: YYYY-MM-DD
**Tester**: [Name]

### Description
[Detailed description of the issue]

### Steps to Reproduce
1. Step 1
2. Step 2
3. ...

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Evidence
- Screenshots: [Attach if applicable]
- Logs: [CloudWatch log excerpts]
- Database state: [Query results]

### Environment
- Environment: dev/prod
- Browser: [if UI issue]
- Lambda version: [if Lambda issue]

### Suggested Fix
[If known]
```

---

## Appendix: Quick Reference Commands

### Database Queries

```sql
-- Check podcast format distribution
SELECT podcast_format, COUNT(*) FROM podcast_configs GROUP BY podcast_format;

-- Find single-speaker podcasts
SELECT id, podcast_name, speaker1_role FROM podcast_configs WHERE podcast_format = 'single-speaker';

-- Check episode processing status
SELECT e.id, p.podcast_name, pc.podcast_format, e.status, e.audio_url
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.created_at > NOW() - INTERVAL '24 hours'
ORDER BY e.created_at DESC;
```

### AWS CLI Commands

```bash
# Check recent Lambda invocations
aws lambda list-functions --query 'Functions[?contains(FunctionName, `script`) || contains(FunctionName, `audio`)].FunctionName'

# View recent CloudWatch logs
aws logs tail /aws/lambda/script-preprocessor-lambda-dev --follow --filter-pattern "podcast_format"

# Check SQS queue messages
aws sqs get-queue-attributes --queue-url <queue-url> --attribute-names All
```

### Test Data Cleanup

```sql
-- Remove test podcasts (CAUTION: Use only in dev)
DELETE FROM podcast_configs WHERE podcast_name LIKE 'Test %';
DELETE FROM episodes WHERE title LIKE 'Test %';
```

---

## Sign-Off

**QA Lead**: ___________________________  Date: __________

**Lead Developer**: ___________________  Date: __________

**Product Owner**: ____________________  Date: __________

---

**End of Test Plan**
