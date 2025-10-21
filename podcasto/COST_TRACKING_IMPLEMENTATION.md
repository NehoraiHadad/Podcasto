# Cost Tracking System Implementation Guide

## Overview

This document describes the cost tracking database schema designed for Podcasto. The system tracks all cost-generating operations across the platform, including AI API calls, Lambda executions, storage operations, email sending, and more.

## Database Schema

### 1. cost_tracking_events

**Purpose**: Raw event log for all cost-generating operations

**Key Features**:
- Tracks individual operations (API calls, Lambda executions, etc.)
- Stores flexible metadata for service-specific details
- Enables detailed cost analysis and debugging
- Links to episodes and podcasts (nullable for system-level operations)

**Usage Pattern**:
```typescript
import { db } from '@/lib/db';
import { costTrackingEvents } from '@/lib/db/schema';

// Log a Gemini TTS API call
await db.insert(costTrackingEvents).values({
  episode_id: episodeId,
  podcast_id: podcastId,
  event_type: 'ai_api_call',
  service: 'gemini_tts',
  quantity: 5000, // 5000 characters
  unit: 'tokens',
  unit_cost_usd: '0.0001',
  total_cost_usd: '0.50',
  metadata: {
    model: 'gemini-2.5-flash-tts',
    input_tokens: 5000,
    duration_ms: 1200,
    region: 'us-east-1'
  }
});
```

### 2. episode_costs

**Purpose**: Aggregated costs per episode

**Key Features**:
- One record per episode
- Breaks down costs by service category
- Tracks usage metrics (tokens, emails, storage, etc.)
- Provides quick access to episode-level cost data

**Usage Pattern**:
```typescript
import { db } from '@/lib/db';
import { episodeCosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Get episode cost breakdown
const episodeCost = await db.query.episodeCosts.findFirst({
  where: eq(episodeCosts.episode_id, episodeId),
  with: {
    episode: true,
    podcast: true
  }
});

console.log(`Total cost: $${episodeCost.total_cost_usd}`);
console.log(`AI TTS cost: $${episodeCost.ai_tts_cost_usd}`);
```

**Aggregation Strategy**:
- Update after each cost event is logged
- Or use a batch aggregation job that runs periodically
- Calculate `total_cost_usd` as sum of all category costs

### 3. daily_cost_summary

**Purpose**: Daily cost aggregations across all episodes

**Key Features**:
- One record per day
- Aggregates costs by category
- Tracks the most expensive episode of the day
- Provides daily analytics

**Usage Pattern**:
```typescript
import { db } from '@/lib/db';
import { dailyCostSummary } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// Get cost summary for a specific date
const summary = await db.query.dailyCostSummary.findFirst({
  where: eq(dailyCostSummary.date, '2025-10-21')
});

// Get last 30 days of cost data
const last30Days = await db.select()
  .from(dailyCostSummary)
  .orderBy(desc(dailyCostSummary.date))
  .limit(30);
```

**Update Strategy**:
- Run a daily aggregation cron job (e.g., at midnight UTC)
- Aggregate from `episode_costs` for the previous day
- Update `avg_cost_per_episode_usd` and identify `most_expensive_episode_id`

### 4. monthly_cost_summary

**Purpose**: Monthly cost aggregations with podcast-level breakdowns

**Key Features**:
- One record per month (year + month)
- Aggregates costs by category
- Stores podcast-level cost breakdown in JSONB
- Tracks active podcasts and total episodes

**Usage Pattern**:
```typescript
import { db } from '@/lib/db';
import { monthlyCostSummary } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// Get monthly summary
const summary = await db.query.monthlyCostSummary.findFirst({
  where: and(
    eq(monthlyCostSummary.year, 2025),
    eq(monthlyCostSummary.month, 10)
  )
});

// Access podcast-level breakdown
summary.podcast_costs?.forEach(pc => {
  console.log(`Podcast ${pc.podcast_id}: ${pc.episode_count} episodes, $${pc.total_cost_usd}`);
});
```

**Update Strategy**:
- Run a monthly aggregation job (e.g., on the 1st of each month)
- Aggregate from `daily_cost_summary` or `episode_costs`
- Build `podcast_costs` array by grouping episode costs by podcast

### 5. cost_pricing_config

**Purpose**: Dynamic pricing configuration for all services

**Key Features**:
- Stores unit costs for different services
- Supports regional pricing (nullable region for global services)
- Maintains pricing history with `effective_from`/`effective_to`
- Enables accurate historical cost calculations

**Usage Pattern**:
```typescript
import { db } from '@/lib/db';
import { costPricingConfig } from '@/lib/db/schema';
import { and, eq, gte, or, isNull } from 'drizzle-orm';

// Get current pricing for a service
async function getCurrentPricing(service: string, region?: string) {
  const now = new Date();

  return await db.query.costPricingConfig.findFirst({
    where: and(
      eq(costPricingConfig.service, service),
      region ? eq(costPricingConfig.region, region) : isNull(costPricingConfig.region),
      gte(costPricingConfig.effective_from, now),
      or(
        isNull(costPricingConfig.effective_to),
        gte(costPricingConfig.effective_to, now)
      )
    )
  });
}

// Example: Get Gemini TTS pricing
const ttsPrice = await getCurrentPricing('gemini_tts');
console.log(`Cost per ${ttsPrice.unit}: $${ttsPrice.unit_cost_usd}`);
```

**Initial Pricing Data** (Example):
```sql
-- Gemini Text API (per 1K tokens)
INSERT INTO cost_pricing_config (service, unit_cost_usd, unit, effective_from, notes)
VALUES ('gemini_text', 0.0001, 'tokens', NOW(), 'Gemini 2.5 Flash - input tokens');

-- Gemini TTS (per character)
INSERT INTO cost_pricing_config (service, unit_cost_usd, unit, effective_from, notes)
VALUES ('gemini_tts', 0.000016, 'tokens', NOW(), 'Gemini 2.5 Flash TTS');

-- S3 PUT requests
INSERT INTO cost_pricing_config (service, region, unit_cost_usd, unit, effective_from, notes)
VALUES ('s3_put', 'us-east-1', 0.005, 'requests', NOW(), 'S3 PUT/COPY/POST per 1K requests');

-- SES Emails
INSERT INTO cost_pricing_config (service, region, unit_cost_usd, unit, effective_from, notes)
VALUES ('ses', 'us-east-1', 0.10, 'emails', NOW(), 'SES per 1K emails');
```

## Database Migration

The migration file has been generated: `drizzle/0006_medical_dakota_north.sql`

**To apply the migration**:

```bash
cd podcasto
npx drizzle-kit push
```

**Important**: Review the migration SQL before applying to production.

## Implementation Recommendations

### 1. Cost Tracking Service

Create a service to centralize cost tracking logic:

**File**: `src/lib/services/cost-tracking-service.ts`

```typescript
import { db } from '@/lib/db';
import { costTrackingEvents, episodeCosts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { CreateCostEventParams } from '@/types/cost-tracking';

export class CostTrackingService {
  /**
   * Log a cost event and update episode costs
   */
  static async logCostEvent(params: CreateCostEventParams) {
    const totalCost = params.quantity * params.unit_cost_usd;

    // Insert cost event
    await db.insert(costTrackingEvents).values({
      ...params,
      total_cost_usd: totalCost.toString(),
      timestamp: new Date()
    });

    // Update episode costs if episode_id is provided
    if (params.episode_id) {
      await this.updateEpisodeCosts(params.episode_id);
    }
  }

  /**
   * Aggregate and update episode costs from events
   */
  static async updateEpisodeCosts(episodeId: string) {
    // Implementation: aggregate costs from cost_tracking_events
    // and upsert into episode_costs table
  }
}
```

### 2. Integration Points

**Lambda Functions** (audio-generation-lambda):
- Log cost events after each Gemini API call
- Track Lambda execution time and calculate costs
- Log S3 upload operations

**Next.js API Routes**:
- Log SES email sends
- Track SQS message sends
- Log S3 operations from Next.js

### 3. Aggregation Jobs

Create cron jobs to aggregate costs:

**Daily Aggregation** (`src/app/api/cron/aggregate-daily-costs/route.ts`):
```typescript
export async function GET(request: Request) {
  // Verify cron secret
  // Aggregate yesterday's costs into daily_cost_summary
  // Update episode_costs from cost_tracking_events
}
```

**Monthly Aggregation** (`src/app/api/cron/aggregate-monthly-costs/route.ts`):
```typescript
export async function GET(request: Request) {
  // Verify cron secret
  // Aggregate last month's costs into monthly_cost_summary
  // Build podcast_costs breakdown
}
```

**Vercel Cron Configuration** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/aggregate-daily-costs",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/aggregate-monthly-costs",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

### 4. Admin Dashboard

Create an admin page to view cost analytics:

**File**: `src/app/admin/costs/page.tsx`

Features:
- Daily cost trends (chart)
- Monthly cost breakdowns
- Most expensive episodes
- Cost per podcast analysis
- Export cost data to CSV

## Security Considerations

1. **Access Control**: Restrict cost tracking data to admin users only
2. **Input Validation**: Validate all numeric inputs to prevent injection
3. **API Protection**: Protect aggregation cron routes with secret tokens
4. **Data Privacy**: Ensure cost data doesn't leak in client-side bundles

## Performance Considerations

1. **Indexes**: All necessary indexes are defined in the schema
2. **Batch Inserts**: Use batch inserts for cost events when possible
3. **Aggregation**: Run aggregations during off-peak hours
4. **Archival**: Consider archiving old `cost_tracking_events` after aggregation

## Testing Strategy

1. **Unit Tests**: Test cost calculation logic
2. **Integration Tests**: Test cost event logging and aggregation
3. **Data Validation**: Verify cost totals match expected values
4. **Edge Cases**: Test null episode_id/podcast_id scenarios

## Next Steps

1. ✅ Apply database migration
2. Create `CostTrackingService` in `src/lib/services/`
3. Integrate cost logging into Lambda functions
4. Create aggregation cron jobs
5. Build admin dashboard for cost analytics
6. Seed initial pricing configuration
7. Add cost tracking to existing operations
8. Create monitoring alerts for cost anomalies

## File References

### Schema Files Created
- `/home/ubuntu/projects/podcasto/podcasto/src/lib/db/schema/cost-tracking-events.ts`
- `/home/ubuntu/projects/podcasto/podcasto/src/lib/db/schema/episode-costs.ts`
- `/home/ubuntu/projects/podcasto/podcasto/src/lib/db/schema/daily-cost-summary.ts`
- `/home/ubuntu/projects/podcasto/podcasto/src/lib/db/schema/monthly-cost-summary.ts`
- `/home/ubuntu/projects/podcasto/podcasto/src/lib/db/schema/cost-pricing-config.ts`

### Supporting Files
- `/home/ubuntu/projects/podcasto/podcasto/src/types/cost-tracking.ts` - TypeScript type definitions
- `/home/ubuntu/projects/podcasto/podcasto/drizzle/0006_medical_dakota_north.sql` - Database migration

### Updated Files
- `/home/ubuntu/projects/podcasto/podcasto/src/lib/db/schema/index.ts` - Schema exports
- `/home/ubuntu/projects/podcasto/podcasto/src/lib/db/schema/relations.ts` - Drizzle relationships
