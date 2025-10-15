# Processing Timeline UI Components

Comprehensive UI components for visualizing episode processing stages, tracking progress, and analyzing performance metrics.

## Components

### 1. ProcessingTimeline

**Location**: `src/components/admin/processing/processing-timeline.tsx`

Main timeline component that visualizes episode processing progress through all stages.

**Features:**
- Real-time status display (completed ✓, active 🔵, failed ❌, pending ○)
- Duration tracking for each stage
- Collapsible error details for failed stages
- Automatic data fetching with loading states
- Responsive design with mobile support
- Dark mode compatible

**Usage:**
```tsx
import { ProcessingTimeline } from '@/components/admin/processing';

<ProcessingTimeline episodeId="episode-uuid" />
```

**Props:**
```typescript
interface ProcessingTimelineProps {
  episodeId: string;     // UUID of the episode
  className?: string;    // Optional CSS classes
}
```

**Example Output:**
```
✓ Created (0.1s)
✓ Telegram Processing (2.3s)
✓ Content Collected (0.05s)
✓ Script Processing (5.1s)
✓ Script Ready (0.1s)
🔵 Audio Processing... (in progress)
○ Audio Completed
○ Published
```

---

### 2. StageBadge

**Location**: `src/components/admin/processing/stage-badge.tsx`

Compact badge component for displaying processing stages with color-coded status.

**Features:**
- Color-coded by stage type (green/success, blue/processing, red/error, gray/pending)
- Compact and default variants
- Uses stage labels from STAGE_CONFIGS
- Dark mode compatible

**Usage:**
```tsx
import { StageBadge } from '@/components/admin/processing';
import { ProcessingStage } from '@/types/processing';

<StageBadge
  stage={ProcessingStage.AUDIO_PROCESSING}
  variant="compact"
/>
```

**Props:**
```typescript
interface StageBadgeProps {
  stage: ProcessingStage;           // Stage enum value
  variant?: 'default' | 'compact';  // Badge size
  className?: string;                // Optional CSS classes
}
```

---

### 3. ProcessingStatsCard

**Location**: `src/components/admin/processing/processing-stats-card.tsx`

Analytics card displaying aggregated processing statistics across all episodes.

**Features:**
- Total episode count
- Success rate calculation
- Average duration by stage
- Top failure points identification
- Responsive grid layout
- Dark mode compatible

**Usage:**
```tsx
import { ProcessingStatsCard } from '@/components/admin/processing';
import { getProcessingStatistics } from '@/lib/actions/episode/tracking';

const result = await getProcessingStatistics();
if (result.success && result.data) {
  return <ProcessingStatsCard stats={result.data} />;
}
```

**Props:**
```typescript
interface ProcessingStatsCardProps {
  stats: {
    byStage: Record<string, { total: number; avgDuration: number }>;
    byStatus: Record<string, number>;
    totalLogs: number;
  };
  className?: string;
}
```

---

## Server Actions

### Location: `src/lib/actions/episode/tracking.ts`

#### getEpisodeProcessingLogs(episodeId: string)
Fetches all processing logs for a specific episode, ordered by timestamp.

**Returns:**
```typescript
{
  success: boolean;
  data?: ProcessingLogEntry[];
  error?: string;
}
```

#### getProcessingStatistics()
Retrieves aggregated statistics across all processing stages. **Requires admin permissions**.

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    byStage: Record<string, { total: number; avgDuration: number }>;
    byStatus: Record<string, number>;
    totalLogs: number;
  };
  error?: string;
}
```

#### getFailedEpisodes(limit?: number)
Gets recent episodes that failed processing with error details. **Requires admin permissions**.

**Returns:**
```typescript
{
  success: boolean;
  data?: FailedEpisode[];
  error?: string;
}
```

#### getStuckEpisodes(thresholdMinutes?: number)
Identifies episodes that have been processing longer than threshold. **Requires admin permissions**.

**Returns:**
```typescript
{
  success: boolean;
  data?: EpisodeInfo[];
  error?: string;
}
```

#### getEpisodesByStage(stage: ProcessingStage)
Lists all episodes currently in a specific processing stage. **Requires admin permissions**.

**Returns:**
```typescript
{
  success: boolean;
  data?: EpisodeInfo[];
  error?: string;
}
```

---

## Type Definitions

### Location: `src/types/processing/`

#### ProcessingStage (enum)
```typescript
enum ProcessingStage {
  CREATED = 'created',
  TELEGRAM_QUEUED = 'telegram_queued',
  TELEGRAM_PROCESSING = 'telegram_processing',
  TELEGRAM_COMPLETED = 'telegram_completed',
  TELEGRAM_FAILED = 'telegram_failed',
  SCRIPT_QUEUED = 'script_queued',
  SCRIPT_PROCESSING = 'script_processing',
  SCRIPT_COMPLETED = 'script_completed',
  SCRIPT_FAILED = 'script_failed',
  AUDIO_QUEUED = 'audio_queued',
  AUDIO_PROCESSING = 'audio_processing',
  AUDIO_COMPLETED = 'audio_completed',
  AUDIO_FAILED = 'audio_failed',
  POST_PROCESSING = 'post_processing',
  PUBLISHED = 'published',
  FAILED = 'failed'
}
```

#### StageStatus (enum)
```typescript
enum StageStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

#### ProcessingLogEntry (interface)
```typescript
interface ProcessingLogEntry {
  id: string;
  episode_id: string;
  stage: ProcessingStage;
  status: StageStatus;
  error_message?: string;
  error_details?: {
    error_type?: string;
    stack_trace?: string;
    context?: Record<string, unknown>;
    retry_count?: number;
  };
  metadata?: Record<string, unknown>;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}
```

---

## Integration Examples

### Example 1: Episode Details Page
**Location**: `src/app/admin/episodes/[id]/page.tsx`

```tsx
import { ProcessingTimeline } from '@/components/admin/processing';

// Inside your page component
<Card>
  <CardHeader>
    <CardTitle>Processing Timeline</CardTitle>
  </CardHeader>
  <CardContent>
    <ProcessingTimeline episodeId={episode.id} />
  </CardContent>
</Card>
```

### Example 2: Processing Analytics Dashboard
**Location**: `src/app/admin/processing/page.tsx`

```tsx
import {
  ProcessingStatsCard,
  StageBadge
} from '@/components/admin/processing';
import {
  getProcessingStatistics,
  getFailedEpisodes
} from '@/lib/actions/episode/tracking';

async function ProcessingAnalyticsContent() {
  const [statsResult, failedResult] = await Promise.all([
    getProcessingStatistics(),
    getFailedEpisodes(20)
  ]);

  return (
    <div className="space-y-6">
      {statsResult.success && statsResult.data && (
        <ProcessingStatsCard stats={statsResult.data} />
      )}

      {failedResult.success && failedResult.data && (
        <div className="space-y-4">
          {failedResult.data.map(({ log, episode }) => (
            <div key={log.id}>
              <StageBadge stage={log.stage} variant="compact" />
              <p>{episode.title}</p>
              <p>{log.error_message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Styling

All components use:
- **Tailwind CSS** for utility-based styling
- **shadcn/ui** components (Badge, Card, Separator, Collapsible, etc.)
- **lucide-react** icons (Check, Circle, AlertCircle, Loader2, etc.)
- **CSS variables** for theming and dark mode support

### Color Scheme:
- **Green**: Completed/Success states
- **Blue**: Processing/Active states
- **Red**: Failed/Error states
- **Gray**: Pending/Inactive states

---

## Dependencies

Required shadcn/ui components:
```bash
npx shadcn@latest add badge
npx shadcn@latest add card
npx shadcn@latest add separator
npx shadcn@latest add collapsible
npx shadcn@latest add skeleton
npx shadcn@latest add alert
npx shadcn@latest add button
```

---

## Performance Considerations

1. **Server Components**: ProcessingStatsCard and display components are Server Components by default
2. **Client Components**: ProcessingTimeline uses `"use client"` for interactive features (collapsing error details)
3. **Data Fetching**: All data loading happens server-side with proper error handling
4. **Loading States**: Skeleton loaders provide immediate feedback during data fetch
5. **Error Boundaries**: Graceful error handling with user-friendly messages

---

## Accessibility

- **ARIA labels**: All interactive elements have proper labels
- **Keyboard navigation**: Collapsible sections accessible via keyboard
- **Color contrast**: All text meets WCAG AA standards
- **Screen reader support**: Semantic HTML and proper ARIA roles

---

## Testing

To test the components:

1. **View Timeline**: Navigate to `/admin/episodes/{episode-id}` to see the processing timeline
2. **View Analytics**: Navigate to `/admin/processing` to see aggregated statistics
3. **Test Error States**: Components handle missing data and API errors gracefully
4. **Test Dark Mode**: Toggle dark mode to verify styling

---

## Future Enhancements

Potential improvements:
- Real-time updates via WebSocket or polling
- Export statistics to CSV/PDF
- Custom date range filtering
- Stage-specific drill-down views
- Performance trend charts
- Retry failed stages from UI
- Email alerts for stuck episodes

---

## Troubleshooting

### Timeline shows "No processing logs available"
- Episode may not have processing logs yet (newly created)
- Check database for `episode_processing_logs` table entries

### Stats card shows 0% success rate
- No episodes have completed processing yet
- Database may need seeding with test data

### Type errors during build
- Ensure all type imports are from `@/types/processing`
- Verify server action return types match component expectations

---

## Files Created

1. `/src/components/admin/processing/processing-timeline.tsx` (149 lines)
2. `/src/components/admin/processing/stage-badge.tsx` (40 lines)
3. `/src/components/admin/processing/processing-stats-card.tsx` (126 lines)
4. `/src/components/admin/processing/index.ts` (12 lines)
5. `/src/app/admin/processing/page.tsx` (130 lines)
6. Updated: `/src/app/admin/episodes/[id]/page.tsx` (added ProcessingTimeline)
7. Updated: `/src/lib/actions/episode/tracking.ts` (fixed type serialization)

**Total**: 3 new components, 1 index file, 1 analytics page, 2 updated files

---

## Maintainers

This component system was built following the Podcasto project conventions:
- Functional components with React Server Components
- TypeScript with strong typing
- Named exports
- Files under 150 lines
- Shadcn/ui for UI primitives
- Tailwind CSS for styling
