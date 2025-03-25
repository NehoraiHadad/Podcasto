# Podcast Integration - Phase 1: Asynchronous Lambda Integration

## Task Objective
Integrate podcastfy-lambda and telegram-lambda functions to work together asynchronously through SQS, enabling cost-effective podcast generation from Telegram content.

## Current State Assessment
Both podcastfy-lambda and telegram-lambda functions work independently. The database schema has been updated to support status tracking and data linking between source content and generated episodes.

## Future State Goal
An asynchronous workflow where telegram-lambda collects content, signals completion via SQS, then podcastfy-lambda is automatically triggered to generate the podcast. All generated content will be stored in S3 with a consistent folder structure linking source data and generated audio.

## Implementation Progress

1. **Database Schema Updates** ✅
   - [x] Added status tracking fields to the episodes table (pending, content_collected, generating_audio, completed, failed)
   - [x] Added metadata_url and source_data_ref fields for data linking
   - [x] Created SQL function check_podcasts_for_new_episodes for scheduling
   - [x] Added necessary indexes for performance optimization

2. **Create SQS Queue for Inter-Lambda Communication** ✅
   - [x] Set up a new SQS queue for podcast processing
   - [x] Configure appropriate retry policy and dead-letter queue
   - [x] Set up IAM permissions for Lambdas to access the queue

3. **Modify Telegram Lambda** ✅
   - [x] Update to use consistent S3 path structure: `podcasts/{podcast_id}/{timestamp}/`
   - [x] Add code to send SQS message upon successful content collection
   - [x] Include timestamp-based reference in metadata for linking

4. **Modify Podcastfy Lambda** ✅
   - [x] Configure as SQS event consumer to automatically process new messages
   - [x] Update to use consistent S3 path structure matching telegram-lambda
   - [x] Add status update logic to track progress

5. **Adjust Podcast Scheduler Role** ✅
   - [x] Update to only initiate the process asynchronously with InvocationType='Event'
   - [x] Create initial episode records with 'pending' status
   - [x] Add status checking functionality for admin UI

6. **Admin Interface Updates** ✅
   - [x] Add "Generate Episode Now" button to podcast actions menu
   - [x] Create server action for triggering immediate episode generation
   - [x] Implement API endpoint for invoking the Lambda function

7. **Status Update Integration** ✅
   - [x] Add database update functionality to podcastfy-lambda
   - [x] Update episode status to "completed" after successful processing
   - [x] Set audio_url field to point to the generated podcast location
   - [x] Handle error cases and update status to "failed" when appropriate

## Workflow Overview

```
┌──────────────────┐     ┌───────────────────┐     ┌───────────────┐     ┌───────────────────┐
│ Admin Interface  │     │ Podcast Scheduler │     │ S3 Storage    │     │ Supabase Database │
│ (or Scheduler)   │────>│ Lambda            │────>│               │────>│                   │
└──────────────────┘     └───────────┬───────┘     └───────────────┘     └───────────────────┘
                                     │
                                     │ Invoke (Event type)
                                     ▼
┌──────────────────┐     ┌───────────────────┐     ┌───────────────┐     ┌───────────────────┐
│ SQS Queue        │     │ Telegram Lambda   │────>│ S3 Storage    │────>│ Supabase Database │
│                  │<────│                   │     │ (Metadata)    │     │ (Status update)   │
└───────┬──────────┘     └───────────────────┘     └───────────────┘     └───────────────────┘
        │
        │ Trigger
        ▼
┌──────────────────┐     ┌───────────────────┐     ┌───────────────┐     ┌───────────────────┐
│ Podcastfy Lambda │────>│ S3 Storage        │────>│ Supabase DB   │────>│ Episode Available │
│                  │     │ (Audio file)      │     │ (Completed)   │     │ in Admin UI       │
└──────────────────┘     └───────────────────┘     └───────────────┘     └───────────────────┘
```

## Issue Identified

The flow was breaking at the final step of the process. We found that while the podcastfy-lambda successfully generated the podcast audio file and stored it in S3, it was not updating the Supabase database with the completed status and audio URL. This explained why episodes appeared to remain in "pending" state even though the audio had been generated.

## Solution Implemented

1. **Added Supabase Client to Podcastfy Lambda** ✅
   - Implemented a Supabase client in the podcastfy-lambda similar to the podcast-scheduler
   - Added environment variables for SUPABASE_URL and SUPABASE_KEY in the CloudFormation template

2. **Implemented Database Update Logic** ✅
   - Added code to update the episode status to "completed" after successful podcast generation
   - Implemented setting the audio_url field to the S3 URL of the generated podcast
   - Added metadata updates with generation information

3. **Added Error Handling** ✅
   - Implemented error handling to update the episode status to "failed" when errors occur
   - Added error details to the metadata for debugging purposes

4. **Implemented Status Transition Updates** ✅
   - Added status updates to "content_collected" after receiving SQS message
   - Added status updates to "generating_audio" before starting the audio generation
   - This allows for better tracking of where the process is in the pipeline

## Deployment Plan

1. **Deploy the Updated Lambda**
   - Deploy the podcastfy-lambda with the Supabase client integration
   - Ensure the SUPABASE_URL and SUPABASE_KEY environment variables are properly set

2. **Test the Complete Workflow**
   - Create a test podcast in the admin interface
   - Trigger generation through the "Generate Episode Now" button
   - Verify status updates occur at each step of the process
   - Confirm the episode becomes playable when complete

3. **Monitor the System**
   - Set up CloudWatch logs monitoring for any errors
   - Verify episode status updates in the admin UI

## Testing Strategy

1. **Unit Testing**
   - Test database update logic in isolation
   - Mock Supabase responses for testing

2. **Integration Testing**
   - Create a test podcast in the admin
   - Trigger generation through the "Generate Episode Now" button
   - Verify the episode status transitions through all stages
   - Confirm the audio file is accessible via the provided URL

3. **Monitoring for Production**
   - Add CloudWatch logs for database update operations
   - Create alerts for failed database updates 