# Podcast Integration - Phase 2: Episode Status Checker

## Task Objective
Create a server-side function that periodically checks the database to determine if a podcast episode was successfully created by the Lambda function, enabling follow-up actions when episodes are completed.

## Current State Assessment
When the Lambda function is triggered to create a podcast episode, an episode record is created in the database with a 'pending' status. Currently, there is no automated mechanism to check when the Lambda completes its work and update the episode status or perform any follow-up actions.

## Future State Goal
A robust server-side mechanism that periodically checks for pending episodes, determines their current status, updates the database accordingly, and triggers any necessary follow-up actions. This will enable automatic UI updates and notifications when episodes are completed.

## Implementation Plan

1. **Create Episode Checker Endpoint**
   - [x] Implement a server-side API route to check episode status
   - [x] Add logic to detect episodes that have been pending for too long and mark them as failed
   - [x] Add logic to identify completed episodes with inconsistent status records
   - [x] Implement database updates to set proper status and descriptions

2. **Create Cron Job Initiator**
   - [x] Create a main cron job endpoint that can trigger multiple background tasks
   - [x] Add security measures to prevent unauthorized access to cron endpoints
   - [x] Implement proper error handling and logging
   - [ ] Configure external scheduler to call the cron endpoint at regular intervals

3. **Follow-up Actions**
   - [x] Implement UI invalidation to refresh the admin interface when episodes complete
   - [ ] Add notification system to alert users when episodes are ready
   - [ ] Create metrics collection to track episode creation success rates

## Implementation Details

### Episode Checking Logic

The episode status checker performs the following operations:

1. **Timeout Detection**: Identifies episodes that have been in 'pending' status for more than 30 minutes and marks them as 'failed'
2. **Status Consistency Check**: Looks for episodes that have audio URLs populated but status is still 'pending', updating them to 'completed'
3. **Automated UI Updates**: Uses Next.js revalidatePath() to refresh relevant UI components when episode status changes

### Security Considerations

All cron endpoints are secured using a CRON_SECRET environment variable, requiring proper authentication via Bearer token. This prevents unauthorized access to these endpoints.

### Error Handling

The implementation includes comprehensive error handling to ensure:
- Individual episode failures don't prevent processing of other episodes
- All errors are properly logged for debugging
- The API returns detailed information about the results of each check

## Next Steps

To complete this feature, we need to:
1. Configure an external scheduler (e.g., GitHub Actions, Vercel Cron) to call the `/api/cron/start-jobs` endpoint at regular intervals
2. Implement a notification system to alert users when episodes are ready for consumption
3. Add metrics collection to track the success rate of episode creation 