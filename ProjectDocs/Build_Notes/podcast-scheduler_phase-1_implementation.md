# Podcast Scheduler - Phase 1: Automatic Episode Generation

## Task Objective
Implement an automated scheduler that periodically checks each podcast's configuration and generates new episodes based on the defined frequency (daily, weekly, etc.) without manual intervention.

## Current State Assessment
The system currently has two mechanisms for podcast episode generation:
1. Manual generation through the admin interface with a "Generate Episode Now" button
2. An AWS Lambda function (podcast-scheduler) that runs daily but is separate from the main application

The podcast creation process itself is working well with the necessary server actions and Lambda functions already in place.

## Future State Goal
A fully integrated scheduling system within the Next.js application that:
1. Runs daily via an external cron service (Cron-job.org) that's already in use
2. Checks each podcast's `episode_frequency` setting and last episode creation date
3. Automatically generates new episodes for podcasts that are due according to their schedule
4. Requires no manual intervention while allowing flexibility in scheduling for each podcast

## Implementation Plan

1. **Create Podcast Scheduler API Endpoint** 
   - [x] Create a new endpoint at `/api/cron/podcast-scheduler/route.ts`
   - [x] Implement proper authentication using CRON_SECRET
   - [x] Create logic to find podcasts that need new episodes
   - [x] Integrate with existing podcast generation server actions

2. **Implement Database Query Logic**
   - [x] Write SQL query to find latest episode dates for each podcast
   - [x] Compare with episode frequency to determine which podcasts need new episodes
   - [x] Handle edge cases (podcasts with no episodes yet, etc.)

3. **Configure External Cron Service**
   - [x] Set up a daily job in Cron-job.org
   - [x] Configure proper headers with CRON_SECRET for authentication
   - [x] Set up failure notifications and retry policy

4. **Testing and Validation**
   - [x] Test the endpoint manually to verify correct operation
   - [x] Create test podcasts with different frequencies
   - [x] Verify that podcasts are generated according to their schedules
   - [x] Check logs to ensure proper execution and error handling

5. **Monitoring and Maintenance**
   - [x] Add logging for each scheduled generation
   - [x] Set up alerts for persistent failures
   - [x] Create admin dashboard view for scheduled episodes

6. **Immediate Episode Status Checking**
   - [x] Modify episode-checker to accept a specific episodeId parameter
   - [x] Update podcast-scheduler to immediately call episode-checker for newly created episodes
   - [x] Add delay to allow Lambda functions to begin processing
   - [x] Provide detailed logging of the entire process

## SQL Design for Podcast Scheduling

The core of the scheduler uses this SQL query to determine which podcasts need new episodes:

```sql
WITH latest_episodes AS (
  SELECT 
    podcast_id,
    MAX(created_at) as latest_episode_date
  FROM episodes
  GROUP BY podcast_id
)

SELECT 
  p.id as podcast_id,
  p.title as podcast_title,
  pc.episode_frequency as frequency,
  COALESCE(le.latest_episode_date, '2000-01-01') as latest_episode_date
FROM podcasts p
LEFT JOIN podcast_configs pc ON p.id = pc.podcast_id
LEFT JOIN latest_episodes le ON p.id = le.podcast_id
WHERE 
  pc.episode_frequency IS NOT NULL AND 
  pc.episode_frequency > 0
```

The JavaScript code then calculates if a new episode is needed by:
- Taking the latest episode date
- Adding the episode frequency (in days) 
- Comparing with the current date
- Triggering generation if the next episode date is today or earlier

## Security Considerations

- The endpoint is secured with the same CRON_SECRET mechanism used by other cron endpoints
- All requests without a valid Authorization header are rejected
- Detailed error logs are produced but do not expose sensitive information

## Integration with Existing Systems

The scheduler leverages existing components:
- Uses the `generatePodcastEpisode` server action from `podcast/generate.ts`
- Follows the same security patterns as the `episode-checker` endpoint
- Path revalidation ensures the UI updates after new episodes are created

## Immediate Episode Status Checking

A key enhancement to the original design is the immediate episode status checking:

1. When a new episode is generated, the scheduler waits 2 seconds to allow the Lambda function to start
2. It then calls the episode-checker with the specific episodeId parameter
3. This checks if the episode already has an audio URL and updates the status if needed
4. It also triggers post-processing immediately rather than waiting for the next scheduled check

This approach solves the problem of having to wait for the next cron run (which could be a day away) for episode status updates. Episodes will be processed as soon as they're available, dramatically improving the user experience 