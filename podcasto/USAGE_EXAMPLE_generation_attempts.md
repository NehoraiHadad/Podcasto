# Episode Generation Attempts API - Usage Examples

## Overview
The Episode Generation Attempts API provides functions for logging and querying all episode generation attempts (both successful and failed). This API is essential for monitoring, reporting, and troubleshooting the podcast generation workflow.

---

## 1. Logging a Generation Attempt

### Success Case
```typescript
import { logGenerationAttempt } from '@/lib/db/api/episode-generation-attempts';

// After successfully generating an episode
const result = await logGenerationAttempt({
  podcastId: 'podcast-uuid-123',
  episodeId: 'episode-uuid-456',
  triggeredBy: 'user-uuid-789', // null for cron jobs
  status: 'success',
  triggerSource: 'manual_user',
  contentStartDate: new Date('2025-10-17'),
  contentEndDate: new Date('2025-10-24'),
});

if (result.success) {
  console.log('Generation attempt logged:', result.data.id);
}
```

### Failure Case - Insufficient Credits
```typescript
const result = await logGenerationAttempt({
  podcastId: 'podcast-uuid-123',
  triggeredBy: 'user-uuid-789',
  status: 'failed_insufficient_credits',
  triggerSource: 'manual_user',
  failureReason: 'User has insufficient credits to generate episode',
  errorDetails: {
    error_type: 'INSUFFICIENT_CREDITS',
    credits_required: 50,
    credits_available: 20,
  },
});
```

### Failure Case - No Messages Found
```typescript
const result = await logGenerationAttempt({
  podcastId: 'podcast-uuid-123',
  triggeredBy: null, // Cron job
  status: 'failed_no_messages',
  triggerSource: 'cron',
  contentStartDate: new Date('2025-10-17'),
  contentEndDate: new Date('2025-10-24'),
  failureReason: 'No new messages found in Telegram channel for the specified date range',
  errorDetails: {
    error_type: 'NO_NEW_CONTENT',
    channel_name: 'TechNews',
    latest_message_date: '2025-10-15T10:30:00Z',
  },
});
```

### Failure Case - Processing Error
```typescript
const result = await logGenerationAttempt({
  podcastId: 'podcast-uuid-123',
  episodeId: 'episode-uuid-partial', // May have partial episode created
  triggeredBy: 'admin-uuid',
  status: 'failed_error',
  triggerSource: 'manual_admin',
  failureReason: 'TTS API timeout during audio generation',
  errorDetails: {
    error_type: 'TTS_TIMEOUT',
    error_message: 'Gemini TTS API request timed out after 60 seconds',
    stack_trace: 'Error: Timeout...\n  at generateAudio...',
  },
});
```

---

## 2. Viewing Attempt History for a Podcast

### Admin Dashboard - Podcast Attempt History
```typescript
import { getAttemptsByPodcast } from '@/lib/db/api/episode-generation-attempts';

// Show last 20 attempts for a specific podcast
const result = await getAttemptsByPodcast('podcast-uuid-123', 20);

if (result.success) {
  result.data.forEach(attempt => {
    console.log(`[${attempt.attempted_at}] ${attempt.status} - ${attempt.trigger_source}`);
    if (attempt.failure_reason) {
      console.log(`  Reason: ${attempt.failure_reason}`);
    }
  });
}
```

---

## 3. Daily Reporting

### Generate Daily Summary Report
```typescript
import { getDailySummary } from '@/lib/db/api/episode-generation-attempts';

// Get summary for today
const today = new Date();
const result = await getDailySummary(today);

if (result.success) {
  console.log('Daily Generation Summary:');
  result.data.forEach(item => {
    console.log(`${item.status} (${item.trigger_source}): ${item.count} attempts`);
  });

  // Example output:
  // success (cron): 45 attempts
  // success (manual_user): 12 attempts
  // failed_no_messages (cron): 8 attempts
  // failed_insufficient_credits (manual_user): 3 attempts
}
```

---

## 4. Monitoring - Identify Problematic Podcasts

### Find Podcasts with High Failure Rates
```typescript
import { getProblematicPodcasts } from '@/lib/db/api/episode-generation-attempts';

// Get podcasts with 80%+ failure rate in last 7 days (minimum 3 attempts)
const result = await getProblematicPodcasts(7, 3, 0.8);

if (result.success) {
  console.log('Problematic Podcasts:');
  result.data.forEach(podcast => {
    console.log(`${podcast.podcast_title}:`);
    console.log(`  Total Attempts: ${podcast.total_attempts}`);
    console.log(`  Failed: ${podcast.failed_attempts}`);
    console.log(`  Failure Rate: ${(podcast.failure_rate * 100).toFixed(1)}%`);
    console.log(`  Owner: ${podcast.created_by}`);
  });
}
```

### Custom Thresholds
```typescript
// More aggressive detection: last 14 days, minimum 5 attempts, 60% failure rate
const result = await getProblematicPodcasts(14, 5, 0.6);
```

---

## 5. Email Notifications Workflow

### Step 1: Get Failed Attempts Needing Notification
```typescript
import { getUnnotifiedFailures } from '@/lib/db/api/episode-generation-attempts';

// Retrieve up to 100 unnotified failures
const result = await getUnnotifiedFailures(100);

if (result.success) {
  for (const attempt of result.data) {
    // Send notification email to user
    await sendFailureNotificationEmail({
      userId: attempt.triggered_by!,
      attemptId: attempt.id,
      podcastId: attempt.podcast_id,
      failureReason: attempt.failure_reason,
      errorDetails: attempt.error_details,
    });
  }
}
```

### Step 2: Mark Notification as Sent
```typescript
import { markNotificationSent } from '@/lib/db/api/episode-generation-attempts';

// After successfully sending email
const result = await markNotificationSent('attempt-uuid-123');

if (result.success) {
  console.log('Notification marked as sent');
}
```

---

## 6. Using via Main API Export

```typescript
import { episodeGenerationAttemptsApi } from '@/lib/db/api';

// All functions available via namespace
const summary = await episodeGenerationAttemptsApi.getDailySummary(new Date());
const attempts = await episodeGenerationAttemptsApi.getAttemptsByPodcast('podcast-123');
```

---

## 7. Integration in Lambda Processor

### In Episode Generation Lambda
```typescript
import { logGenerationAttempt } from '@/lib/db/api/episode-generation-attempts';

async function processEpisode(message: SQSMessage) {
  const { podcast_id, episode_id } = JSON.parse(message.body);

  try {
    // ... episode processing logic ...

    // Log success
    await logGenerationAttempt({
      podcastId: podcast_id,
      episodeId: episode_id,
      status: 'success',
      triggerSource: 'cron',
      contentStartDate: startDate,
      contentEndDate: endDate,
    });

  } catch (error) {
    // Log failure
    await logGenerationAttempt({
      podcastId: podcast_id,
      status: 'failed_error',
      triggerSource: 'cron',
      failureReason: error.message,
      errorDetails: {
        error_type: error.constructor.name,
        error_message: error.message,
        stack_trace: error.stack,
      },
    });

    throw error; // Re-throw for SQS DLQ handling
  }
}
```

---

## Error Handling Pattern

All API functions follow the RORO pattern and return:
```typescript
{
  success: true,
  data: T
}
// OR
{
  success: false,
  error: string
}
```

Always check `success` before accessing `data`:
```typescript
const result = await logGenerationAttempt({ ... });

if (!result.success) {
  console.error('Failed to log attempt:', result.error);
  // Handle error gracefully - don't crash the app
  return;
}

// Safe to use result.data
console.log('Logged attempt:', result.data.id);
```

---

## Type Safety

All functions are fully typed. Import types as needed:
```typescript
import type {
  LogGenerationAttemptParams,
  GenerationAttemptRecord,
  DailySummaryRecord,
  ProblematicPodcastRecord,
} from '@/lib/db/api/episode-generation-attempts';
```
