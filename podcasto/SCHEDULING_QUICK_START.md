# Automatic Episode Scheduling - Quick Start Guide

## 5-Minute Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
CRON_SECRET=your-random-secure-secret-here
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Deploy

The system is ready to use! Deploy to Vercel:

```bash
git add .
git commit -m "Add automatic episode scheduling"
git push
```

Vercel will automatically:
- Enable the hourly CRON job (from `vercel.json`)
- Run the scheduled episodes endpoint every hour

### 3. Enable for a Podcast

```typescript
import { updateSchedulingSettingsAction } from '@/lib/actions/podcast/scheduling-actions';

// Enable auto-generation
await updateSchedulingSettingsAction(podcastId, {
  auto_generation_enabled: true,
  episode_frequency: 7  // days between episodes
});
```

### 4. Check Status

```typescript
import { getSchedulingStatusAction } from '@/lib/actions/podcast/scheduling-actions';

const result = await getSchedulingStatusAction(podcastId);

console.log('Auto-generation:', result.data.auto_generation_enabled);
console.log('Next episode:', result.data.next_scheduled_generation);
console.log('Last generated:', result.data.last_auto_generated_at);
console.log('Frequency:', result.data.episode_frequency, 'days');
```

## How It Works

1. **User enables auto-generation** → System schedules first episode
2. **CRON runs every hour** → Checks for podcasts due for generation
3. **For each due podcast:**
   - Check user has 10 credits
   - Generate episode if credits available
   - Deduct 10 credits
   - Schedule next episode

## Manual Testing

### Test Endpoint (requires CRON_SECRET)

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" \
  https://your-domain.vercel.app/api/cron/scheduled-episodes
```

### Admin Manual Trigger

```typescript
import { triggerScheduledGenerationAction } from '@/lib/actions/podcast/scheduling-actions';

// Admin only - triggers generation for all due podcasts
const result = await triggerScheduledGenerationAction();

console.log(`Generated: ${result.data.generated}/${result.data.total}`);
console.log(`Skipped: ${result.data.skipped} (low credits)`);
console.log(`Failed: ${result.data.failed}`);
```

## Common Scenarios

### Enable Auto-Generation with Custom Frequency

```typescript
// Daily episodes
await updateSchedulingSettingsAction(podcastId, {
  auto_generation_enabled: true,
  episode_frequency: 1
});

// Weekly episodes
await updateSchedulingSettingsAction(podcastId, {
  auto_generation_enabled: true,
  episode_frequency: 7
});

// Monthly episodes
await updateSchedulingSettingsAction(podcastId, {
  auto_generation_enabled: true,
  episode_frequency: 30
});
```

### Disable Auto-Generation

```typescript
await updateSchedulingSettingsAction(podcastId, {
  auto_generation_enabled: false
});
```

### Update Frequency Without Disabling

```typescript
await updateSchedulingSettingsAction(podcastId, {
  auto_generation_enabled: true,
  episode_frequency: 14  // Change to bi-weekly
});
```

## Monitoring

### Check CRON Logs (Vercel)

1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by: `[SCHEDULED_EPISODES_CRON]`
3. Look for:
   - `✓ SUCCESS` - Episode generated
   - `⊘ SKIPPED` - Insufficient credits
   - `✗ FAILED` - Generation error

### Check Scheduling Service Logs

Filter by: `[SchedulingService]`

## Troubleshooting

### Episode Not Generating

**Check:**
```typescript
const status = await getSchedulingStatusAction(podcastId);

console.log('Enabled?', status.data.auto_generation_enabled);
console.log('Next scheduled?', status.data.next_scheduled_generation);

// Is next_scheduled_generation in the past?
const isPast = new Date(status.data.next_scheduled_generation) < new Date();
console.log('Past due?', isPast);
```

**Common Issues:**
- Auto-generation not enabled
- Next scheduled time is in the future
- User has insufficient credits (< 10)
- CRON not running (check Vercel)

### Verify User Credits

```typescript
import { creditService } from '@/lib/services/credits';

const balance = await creditService.getUserBalance(userId);
console.log('Credits:', balance);

const check = await creditService.checkCreditsForEpisode(userId);
console.log('Has enough?', check.hasEnough);
console.log('Required:', check.required);
console.log('Available:', check.available);
```

### Check Database Directly

```sql
-- Check podcast scheduling settings
SELECT
  id,
  title,
  auto_generation_enabled,
  last_auto_generated_at,
  next_scheduled_generation,
  created_by
FROM podcasts
WHERE id = 'podcast-id-here';

-- Check episode frequency
SELECT episode_frequency
FROM podcast_configs
WHERE podcast_id = 'podcast-id-here';

-- Check user credits
SELECT available_credits
FROM user_credits
WHERE user_id = 'user-id-here';
```

## File Locations

### Service Layer
- `src/lib/services/scheduling/scheduling-service.ts` - Core logic
- `src/lib/services/scheduling/index.ts` - Exports

### Server Actions
- `src/lib/actions/podcast/scheduling-actions.ts` - User-facing actions

### CRON Endpoint
- `src/app/api/cron/scheduled-episodes/route.ts` - Hourly job

### Configuration
- `vercel.json` - CRON schedule

### Documentation
- `src/lib/services/scheduling/README.md` - Full documentation
- `SCHEDULING_IMPLEMENTATION.md` - Implementation details
- `SCHEDULING_QUICK_START.md` - This file

## Key Constants

```typescript
// Episode cost
PRICING.EPISODE_GENERATION_COST = 10

// Default frequency
DEFAULT_EPISODE_FREQUENCY = 7  // days

// Frequency range
MIN_FREQUENCY = 1 day
MAX_FREQUENCY = 365 days
```

## API Summary

### updateSchedulingSettingsAction
**Purpose:** Enable/disable auto-generation and set frequency
**Auth:** User must own podcast or be admin
**Returns:** `ActionResult<void>`

### getSchedulingStatusAction
**Purpose:** Get current scheduling status
**Auth:** User must own podcast or be admin
**Returns:** `ActionResult<SchedulingStatus>`

### triggerScheduledGenerationAction
**Purpose:** Manually trigger scheduled generation
**Auth:** Admin only
**Returns:** `ActionResult<ScheduledGenerationSummary>`

## Integration Example

```typescript
// Full integration example
import {
  updateSchedulingSettingsAction,
  getSchedulingStatusAction
} from '@/lib/actions/podcast/scheduling-actions';

// 1. Enable auto-generation
const enableResult = await updateSchedulingSettingsAction(podcastId, {
  auto_generation_enabled: true,
  episode_frequency: 7
});

if (!enableResult.success) {
  console.error('Failed to enable:', enableResult.error);
  return;
}

// 2. Get status
const statusResult = await getSchedulingStatusAction(podcastId);

if (statusResult.success) {
  const { data } = statusResult;

  console.log('Auto-generation enabled:', data.auto_generation_enabled);
  console.log('Episode every', data.episode_frequency, 'days');
  console.log('Next episode:', data.next_scheduled_generation?.toISOString());

  if (data.last_auto_generated_at) {
    console.log('Last generated:', data.last_auto_generated_at.toISOString());
  } else {
    console.log('Never generated automatically');
  }
}

// 3. Wait for CRON to run (or trigger manually as admin)
// Episodes will be generated automatically every 7 days
```

## Next Steps

1. **Test in Staging:** Set frequency to 1 day for quick testing
2. **Monitor First Week:** Check logs daily to ensure working correctly
3. **User Documentation:** Add UI components for users to manage settings
4. **Analytics:** Track generation success rates and credit usage
5. **Notifications:** Add email alerts for low credits

## Support

- **Full Documentation:** `src/lib/services/scheduling/README.md`
- **Implementation Details:** `SCHEDULING_IMPLEMENTATION.md`
- **Code Comments:** All files have inline documentation

## Production Checklist

Before going live:

- [ ] `CRON_SECRET` set in production environment
- [ ] Tested with 1-day frequency in staging
- [ ] Verified CRON runs successfully
- [ ] Checked credit deduction works
- [ ] Monitored logs for errors
- [ ] Set up alerts for failures
- [ ] Documented for users (if needed)

---

**That's it!** The system is production-ready. Just set the `CRON_SECRET` and deploy. 🚀
