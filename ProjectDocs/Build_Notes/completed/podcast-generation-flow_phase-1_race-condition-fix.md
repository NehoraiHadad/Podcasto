# Podcast Generation Flow - Phase 1: Race Condition Fix

## Task Objective
Fix the race condition in the podcast generation flow where the audio generation API was being called before the Telegram Lambda finished uploading content to S3, causing "NoSuchKey" errors.

## Current State Assessment
The current podcast generation flow has a race condition:
1. Admin panel triggers Telegram Lambda
2. Telegram Lambda processes content and uploads to S3
3. Telegram Lambda immediately calls audio generation API
4. Audio generation API tries to read from S3 before upload completes
5. Results in "NoSuchKey" error and failed episode generation

## Future State Goal
Establish a proper asynchronous flow:
1. Admin panel triggers Telegram Lambda
2. Telegram Lambda processes content and uploads to S3
3. Telegram Lambda updates episode status to `content_collected`
4. Telegram Lambda sends message to SQS queue
5. Audio generation Lambda receives SQS message and processes audio
6. Audio generation Lambda only processes episodes with `content_collected` status

## Implementation Plan

### Step 1: Remove Race Condition from Telegram Lambda
- [x] Remove immediate API call to audio generation endpoint from `lambda_handler.py`
- [x] Keep only SQS message sending for asynchronous processing
- [x] Update logging to reflect the new flow

### Step 2: Add Supabase Integration to Telegram Lambda
- [x] Create `SupabaseClient` in `src/clients/supabase_client.py`
- [x] Add `supabase>=1.0.0` to `requirements.txt`
- [x] Fix environment variable name (`SUPABASE_KEY` vs `SUPABASE_SERVICE_KEY`)
- [x] Add Supabase client import to `lambda_handler.py`
- [x] Update episode status to `content_collected` after S3 upload

### Step 3: Verify Audio Generation Lambda Flow
- [x] Confirm audio generation lambda processes SQS messages correctly
- [x] Verify it only processes episodes with `content_collected` status
- [x] Ensure proper error handling and status updates

### Step 4: Testing and Validation
- [x] Deploy updated Telegram Lambda
- [x] Configure Lambda environment variables
- [ ] Test complete flow from admin panel
- [ ] Verify SQS message flow and audio generation
- [ ] Monitor logs for proper status transitions

## Implementation Status: ✅ READY FOR TESTING

### Environment Configuration Complete
All required environment variables have been successfully configured in the Lambda:
- ✅ SUPABASE_URL and SUPABASE_KEY for database operations
- ✅ TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION for Telegram integration  
- ✅ S3_BUCKET_NAME and SQS_QUEUE_URL for content storage and message passing
- ✅ API_ENDPOINT for communication with main application
- ⚠️ INTERNAL_API_KEY still missing (non-critical for initial testing)

### Next Steps
1. Test podcast generation from admin panel
2. Monitor CloudWatch logs for both Lambda functions
3. Verify episode status transitions: pending → content_collected → processing → completed
4. Validate that no more "NoSuchKey" errors occur

## Implementation Notes

### Race Condition Root Cause
The issue was in `Lambda/telegram-lambda/src/lambda_handler.py` lines 60-79 where an immediate HTTP request was made to the audio generation API while the S3 upload was still in progress, causing a race condition.

### Solution Approach
- Removed the immediate API call and made the flow purely asynchronous via SQS
- Added proper episode status management (`content_collected` status)
- Ensured audio generation lambda only processes ready episodes

### Key Files Modified
1. **Lambda/telegram-lambda/src/lambda_handler.py** - Removed race condition, added Supabase integration
2. **Lambda/telegram-lambda/src/clients/supabase_client.py** - Created new Supabase client
3. **Lambda/telegram-lambda/requirements.txt** - Added supabase>=1.0.0 dependency
4. **Lambda/telegram-lambda/samconfig.toml** - Updated with all required parameters

### Deployment Details
- Stack: `podcasto-telegram-collector-v2`
- Function: `podcasto-telegram-collector-v2-TelegramCollector-cIr2m4PMqK5i`
- Runtime: Python 3.12
- Environment: All variables configured successfully
- Status: **READY FOR TESTING**

## Testing Checklist
- [ ] Generate podcast from admin panel
- [ ] Verify episode status changes to `content_collected` 
- [ ] Confirm SQS message is sent correctly
- [ ] Check that audio generation lambda processes the message
- [ ] Validate final episode has audio_url and status `completed` 