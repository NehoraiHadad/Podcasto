# Build Notes: Google TTS Integration - UI Trigger

**Build Title:** Google TTS Integration
**Phase:** 1
**Task Group:** UI Trigger

## Task Objective

Add manual trigger capability to the admin dashboard for the new Google TTS audio generation system, allowing administrators to manually run the Google Audio Generator without relying on CRON scheduling.

## Current State Assessment

The project has a functional CRON runner system in the admin dashboard that supports:
- Episode Checker
- Podcast Scheduler  
- Full CRON Job
- Manual triggering with proper authentication and results display

The Google TTS endpoint `/api/episodes/generate-audio/route.ts` exists and supports POST method for SQS-triggered generation, but lacks GET method support for manual CRON triggering.

## Future State Goal

The admin dashboard will have a new "Google Audio Generator" option in the CRON runner that:
- Finds all pending episodes automatically
- Processes them using Google TTS instead of Podcastfy
- Shows detailed results with success/failure status for each episode
- Maintains the same authentication and error handling as other CRON jobs

## Implementation Plan

1. **Add new job type to constants:**
   - [x] Add `google-audio-generator` to `CronJobType` union type
   - [x] Add new option to `CRON_JOB_OPTIONS` array with Bot icon
   - [x] Create `GoogleAudioGeneratorDetailedResult` interface

2. **Create result display component:**
   - [x] Create `GoogleAudioGeneratorResultDetails` component
   - [x] Display processed/failed counts with badges
   - [x] Show individual episode results with success/failure indicators
   - [x] Include timestamps and error messages

3. **Add admin action:**
   - [x] Create `runGoogleAudioGenerator()` function in `admin-actions.ts`
   - [x] Use existing `callCronEndpoint()` helper for consistency
   - [x] Call `/api/episodes/generate-audio` endpoint

4. **Update CRON runner component:**
   - [x] Import new result interface and component
   - [x] Add case for `google-audio-generator` in `handleRunCron`
   - [x] Add result handling logic for Google Audio Generator
   - [x] Display results using new component

5. **Enhance API endpoint:**
   - [x] Add GET method support to `/api/episodes/generate-audio/route.ts`
   - [x] Add CRON secret authentication
   - [x] Find pending episodes automatically using `getEpisodesByStatus(['pending'])`
   - [x] Process each episode and return detailed results
   - [x] Refactor common logic into `generateAudioForEpisode()` function
   - [x] Return response in format compatible with result components

6. **Testing and validation:**
   - [ ] Test manual trigger from admin dashboard
   - [ ] Verify authentication works correctly
   - [ ] Check that pending episodes are found and processed
   - [ ] Validate result display shows correct information
   - [ ] Ensure error handling works for failed episodes

## Implementation Notes

- **Authentication**: Uses same CRON_SECRET approach as other endpoints
- **Episode Discovery**: Automatically finds episodes with `status = 'pending'`
- **Result Format**: Matches expected structure for admin dashboard display
- **Error Handling**: Individual episode failures don't stop the entire process
- **Status Updates**: Episodes are marked as 'failed' if generation fails

## Completed Tasks

✅ **Constants and Types**: Added `google-audio-generator` job type and result interfaces
✅ **UI Component**: Created `GoogleAudioGeneratorResultDetails` for displaying results
✅ **Admin Action**: Added `runGoogleAudioGenerator()` server action
✅ **CRON Runner**: Updated component to handle new job type
✅ **API Endpoint**: Enhanced with GET method and CRON authentication
✅ **Response Format**: Ensured compatibility with existing result display system

## Next Steps

Once testing is complete, this functionality will provide administrators with a convenient way to manually trigger Google TTS audio generation for pending episodes, replacing the dependency on Podcastfy Lambda while maintaining the same user experience.

## Debugging Notes

### SQL Error Fix (December 30, 2024)
**Issue**: PostgreSQL syntax error: `syntax error at or near "desc"`  
**Root Cause**: In `getEpisodesByStatus()` function, used `episodes.updated_at` column which doesn't exist  
**Fix**: Changed to `episodes.created_at` which exists in the schema  
**File**: `podcasto/src/lib/db/api/episodes.ts` line 92  

**Additional Changes**:
- Added detailed logging to track episode processing
- Enhanced error messages for better debugging
- Improved response format consistency

**Next Testing**: Need to verify the fix works and episodes are found correctly 

### Status Correction (December 30, 2024)
**Issue**: Google Audio Generator searched for episodes with `pending` status but found 0 results  
**Root Cause**: Misunderstood the workflow - Telegram Lambda updates episodes to `content_collected` status after gathering data  
**Fix**: Changed search from `['pending']` to `['content_collected']`  
**Files Updated**:
- `podcasto/src/app/api/episodes/generate-audio/route.ts` - Changed status filter
- `podcasto/src/components/admin/cron-runner-constants.tsx` - Updated description

**Workflow Understanding**:
1. **Episode Created** → status: `pending`
2. **Telegram Lambda** → collects content → status: `content_collected`  
3. **Google Audio Generator** → generates audio → status: `processing` → `completed`

**Next Testing**: Should now find episodes with `content_collected` status 

### S3 Path Correction (December 30, 2024)
**Issue**: Found episode with `content_collected` status but failed with "No Telegram data found"  
**Root Cause**: TelegramDataService searched for `telegram_data.json` but Telegram Lambda saves as `content.json`  
**Evidence**: Telegram Lambda S3 client saves files as `content.json` in `podcasts/{podcast_id}/{episode_id}/` path  
**Fix**: Changed primary S3 key from `telegram_data.json` to `content.json`  
**Files Updated**:
- `podcasto/src/lib/services/telegram-data-service.ts` - Updated constructS3Key() method
- Added `telegram_data.json` as fallback for old episodes

**File Naming Convention**:
- **New**: `podcasts/{podcast_id}/{episode_id}/content.json`
- **Old**: `podcasts/{podcast_id}/{episode_id}/telegram_data.json` (fallback)

**Next Testing**: Should now find and load Telegram data correctly 

### Invalid Gemini Model Name (December 30, 2024)
**Issue**: `models/gemini-2.5-flash is not found for API version v1beta`
**Root Cause**: Using model name `gemini-2.5-flash` which doesn't exist in Google's Gemini API
**Fix**: 
- Updated script generation model from `gemini-2.5-flash` to `gemini-2.0-flash`
- Updated metadata generation model from `gemini-2.5-flash` to `gemini-2.0-flash`
- Left TTS model as `gemini-2.5-flash-preview-tts` (correct name)
**Available Models**: 
- Text generation: `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-2.5-flash-preview-05-20`
- TTS: `gemini-2.5-flash-preview-tts`, `gemini-2.5-pro-preview-tts`

**Next Testing**: Need to verify the fix works and model names are correct 

### API Timeout Fix (December 30, 2024)
**Issue**: HeadersTimeoutError - API calls taking too long (>5 minutes)
**Root Cause**: Script too long (9454 characters) causing timeout in single API call
**Solution**: Implemented chunking strategy:
- Split script into smaller chunks (max 3000 chars per chunk)
- Process each chunk separately with 1s delay between calls
- Combine all audio chunks into final output
- Added detailed logging for chunk processing

**Technical Implementation**:
```typescript
// Split script into manageable chunks
const chunks = this.splitScriptIntoChunks(script, 3000);

// Process each chunk separately
for (let i = 0; i < chunks.length; i++) {
  // Generate audio for chunk
  // Add delay between chunks
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Combine all audio chunks
const combinedAudio = Buffer.concat(allAudioChunks);
```

## Technical Architecture
- **Authentication**: Uses same CRON_SECRET approach as other endpoints
- **Episode Discovery**: Automatically finds episodes with `status = 'content_collected'`
- **Error Handling**: Individual episode failures don't stop entire process
- **Status Updates**: Episodes marked as 'failed' if generation fails
- **Result Format**: Compatible with existing admin dashboard display system
- **Timeout Prevention**: Script chunking with rate limiting

## Next Steps
- [x] Test the chunking solution with real episode data
- [ ] Monitor performance and adjust chunk size if needed
- [ ] Consider adding progress indicators for long-running processes
- [ ] Document the new workflow in project context files

## Testing Notes
- Successfully processed episode with 19 segments and 9454 characters
- Script generation worked correctly
- Timeout issue resolved with chunking approach
- Need to test end-to-end audio generation