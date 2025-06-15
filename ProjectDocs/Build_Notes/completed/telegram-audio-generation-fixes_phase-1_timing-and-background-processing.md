# Build Notes: Telegram Audio Generation Fixes - Phase 1

## Task Objective
Fix two critical issues in the podcast generation pipeline on Vercel:
1. **Race Condition**: Telegram Lambda returns 202 but audio generation starts immediately before S3 data is available
2. **Background Processing Timeout**: Manual audio generation stops after background processing starts

## Current State Assessment
- Episode creation triggers Telegram Lambda which returns 202 immediately
- Audio generation API calls start before Telegram data is uploaded to S3
- Manual audio generation via GET endpoint starts background processing but doesn't complete
- Episodes get stuck in 'content_collected' status without completing audio generation

## Future State Goal
- Implement proper timing mechanisms to ensure S3 data is available before audio generation starts
- Fix background processing to complete successfully without timeout issues
- Ensure episodes progress through all statuses correctly: pending → content_collected → processing → completed

## Implementation Plan

### Step 1: Identify Root Causes ✅ **COMPLETED**
- [x] **Task 1.1**: Analyze race condition timing
  - [x] Confirmed: Audio generation API starts immediately after 202 response
  - [x] S3 upload may take additional seconds to complete
  - [x] No synchronization mechanism between Telegram Lambda completion and audio generation start

- [x] **Task 1.2**: Analyze background processing timeout  
  - [x] Identified: Vercel function timeout during manual GET requests
  - [x] Background processing doesn't return success status to client

### Step 2: Database Permission Issues ✅ **COMPLETED**
- [x] **Task 0.1**: Investigate database update failures
  - [x] Found RLS (Row Level Security) blocking Lambda functions from updating episodes table
  - [x] Lambda uses service role key without admin permissions
  
- [x] **Task 0.2**: Create RPC functions to bypass RLS  
  - [x] Verified existing RPC functions: update_episode_status, update_episode_audio_url
  - [x] Fixed mark_episode_failed RPC function to store errors in metadata (not non-existent error column)
  
- [x] **Task 0.3**: Test the fix
  - [x] Verified RPC function exists and has proper permissions
  - [x] Updated Telegram Lambda supabase_client.py to use RPC approach
  - [x] Fixed audio-generation-lambda supabase_client.py to use RPC functions as well
  - [x] Fixed mark_episode_failed RPC function to store errors in metadata column (not non-existent error column)
  - [x] Updated audio-generation-lambda to use mark_episode_failed RPC function
  - [x] Both lambdas now bypass RLS by using SECURITY DEFINER RPC functions
  
- [x] **Task 0.4**: Fix podcast configuration lookup in audio generation lambda
  - [x] Added get_podcast_config_by_id method to Supabase client
  - [x] Updated audio generation handler to use podcast_config_id from SQS message
  - [x] Added fallback to podcast_id lookup for backward compatibility

- [x] **Task 0.5**: Fix podcast_configs table RLS blocking Lambda access
  - [x] Created get_podcast_config_by_id RPC function with SECURITY DEFINER
  - [x] Created get_podcast_config_by_podcast_id RPC function with SECURITY DEFINER  
  - [x] Updated audio-generation-lambda supabase_client.py to use RPC functions for config lookup
  - [x] Both config lookup methods now bypass RLS restrictions

- [x] **Task 0.6**: Fix data structure mismatch in audio generation
  - [x] Identified issue in prepare_podcast_content function using wrong data structure
  - [x] Fixed function to read 'results' structure instead of 'messages' from Telegram data
  - [x] Enhanced content preparation with proper speaker roles and podcast configuration
  - [x] Added message limits and better content validation

- [x] **Task 0.7**: Fix import paths in audio generation lambda
  - [x] Fixed relative imports in GooglePodcastGenerator service
  - [x] Fixed relative imports in AudioGenerationHandler
  - [x] Fixed relative imports in TelegramDataClient
  - [x] Converted back to absolute imports for AWS Lambda compatibility
  - [x] AWS Lambda requires absolute imports, not relative imports

### Step 3: Implement SQS-Based Asynchronous Processing ⏳ **IN PROGRESS**
- [ ] **Task 3.1**: Modify episode creation to use SQS
  - [ ] Update episode creation API to send SQS message instead of direct Lambda invoke
  - [ ] Ensure episode is marked as 'pending' immediately
  - [ ] SQS message should contain all necessary data for processing

- [ ] **Task 3.2**: Modify Telegram Lambda for SQS compatibility
  - [ ] Ensure Telegram Lambda updates episode status to 'content_collected' after S3 upload
  - [ ] Send completion message to audio generation SQS queue only after S3 upload succeeds
  - [ ] Include all necessary metadata in SQS message

- [ ] **Task 3.3**: Modify Audio Generation Lambda for SQS
  - [ ] Update audio generation Lambda to process SQS messages
  - [ ] Implement proper retry logic with DLQ (Dead Letter Queue)
  - [ ] Ensure proper status updates: processing → completed/failed

### Step 4: Implement Proper Status Monitoring ⏳ **PENDING**
- [ ] **Task 4.1**: Add status polling endpoint
  - [ ] Create API endpoint for clients to check episode status
  - [ ] Return current status and progress information
  - [ ] Include estimated completion time if possible

- [ ] **Task 4.2**: Add error handling and notifications
  - [ ] Implement proper error reporting for failed episodes
  - [ ] Store detailed error messages in episode metadata
  - [ ] Consider adding webhook notifications for status changes

### Step 5: Testing and Validation ⏳ **PENDING**
- [ ] **Task 5.1**: Test complete workflow
  - [ ] Test episode creation → content collection → audio generation → completion
  - [ ] Verify all status transitions work correctly
  - [ ] Test error scenarios and recovery

- [ ] **Task 5.2**: Performance validation
  - [ ] Measure typical processing times at each stage
  - [ ] Ensure no timeouts under normal conditions
  - [ ] Validate SQS message handling under load

## Notes and Decisions

### Important RLS Database Fixes Applied:
1. **Episodes Table**: Lambda functions now use RPC functions (update_episode_status, update_episode_audio_url, mark_episode_failed) instead of direct table updates
2. **Podcast Configs Table**: Lambda functions now use RPC functions (get_podcast_config_by_id, get_podcast_config_by_podcast_id) instead of direct table selects
3. **All RPC Functions**: Use SECURITY DEFINER to run with admin privileges and bypass RLS restrictions

### Current Status:
- ✅ Database permission issues resolved for both episodes and podcast_configs tables
- ✅ Both Telegram and Audio Generation lambdas can now successfully read/write to database
- ⏳ Still need to implement proper SQS-based asynchronous processing flow 