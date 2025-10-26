# Date Utilities

Central date/time handling for Podcasto. Ensures consistency across Next.js frontend/backend and AWS Lambda functions.

## Core Principle

**"Store UTC, Display Local, Process UTC"**

- **Database**: Always UTC (PostgreSQL `timestamp with timezone`)
- **Server Processing**: Always UTC (Next.js Server Actions, Lambda)
- **Client Display**: User's timezone
- **User Input**: Convert to UTC before saving

---

## Usage Examples

### Server-Side (Server Components, Server Actions, API Routes)

```typescript
import { nowUTC, createDateRangeUTC, formatInTimezoneServer } from '@/lib/utils/date/server';

// Get current time in UTC
const now = nowUTC();

// Create date range for database query
const { startUTC, endUTC } = createDateRangeUTC(
  userSelectedStartDate,  // e.g., "2024-01-15"
  userSelectedEndDate,    // e.g., "2024-01-20"
  'Asia/Jerusalem'        // User's timezone
);

// Query database (dates are now in UTC)
const episodes = await db.query.episodes.findMany({
  where: and(
    gte(episodes.created_at, startUTC.toISOString()),
    lte(episodes.created_at, endUTC.toISOString())
  )
});

// Format date in specific timezone (server-side)
const formatted = formatInTimezoneServer(
  episode.created_at,
  'Asia/Jerusalem',
  'dd/MM/yyyy HH:mm'
);
```

### Client-Side (Client Components)

```typescript
'use client';

import { formatUserDate, formatRelativeTime, getUserTimezone } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

// Display date in user's timezone
<p>{formatUserDate(episode.created_at, DATE_FORMATS.DISPLAY_DATE)}</p>
// Output: "15/01/2024" (in user's timezone)

// Display relative time
<p>{formatRelativeTime(episode.created_at)}</p>
// Output: "2 hours ago"

// Get user's timezone
const timezone = getUserTimezone();
// Output: "Asia/Jerusalem" (detected from browser)
```

### Converting User Input to UTC

```typescript
'use client';

import { toUTCDate, getUserTimezone } from '@/lib/utils/date/client';

function handleDateSubmit(dateString: string) {
  // User selected "15/01/2024" in their timezone
  const utcDate = toUTCDate(dateString, getUserTimezone());

  // Send UTC date to server
  await createEpisode({
    startDate: utcDate.toISOString(), // "2024-01-14T22:00:00.000Z" (UTC)
  });
}
```

---

## Critical Use Cases

### 1. Episode Date Range (Telegram Messages)

When user selects dates for an episode:

```typescript
// Server Action
export async function generateEpisode({
  startDate,  // User input: "2024-01-15"
  endDate,    // User input: "2024-01-20"
  timezone,   // User's timezone: "Asia/Jerusalem"
}: {
  startDate: string;
  endDate: string;
  timezone: string;
}) {
  // Convert to UTC range
  const { startUTC, endUTC } = createDateRangeUTC(startDate, endDate, timezone);

  // startUTC: 2024-01-14T22:00:00.000Z (00:00 in Israel)
  // endUTC:   2024-01-20T21:59:59.999Z (23:59:59 in Israel)

  // Use in Lambda invocation
  await invokeLambda({
    startDate: startUTC.toISOString(),
    endDate: endUTC.toISOString(),
  });
}
```

### 2. Displaying Episode Creation Time

```typescript
'use client';

// In component
<div>
  <p>Created: {formatUserDate(episode.created_at, DATE_FORMATS.DISPLAY_DATETIME)}</p>
  <p>{formatRelativeTime(episode.created_at)}</p>
</div>

// Output (for Israeli user):
// Created: 15/01/2024 14:30
// 2 hours ago
```

### 3. Processing Logs (Server-Side)

```typescript
import { nowUTC, toISOUTC } from '@/lib/utils/date/server';

// Log processing stage
await db.insert(episodeProcessingLogs).values({
  episode_id: episodeId,
  stage: 'audio_processing',
  started_at: toISOUTC(nowUTC()),  // Always UTC
  status: 'started',
});
```

---

## Migration from Old Code

### Before (Problematic)
```typescript
// ❌ Ambiguous - local or UTC?
const now = new Date();

// ❌ May not be UTC
const timestamp = new Date().toISOString();

// ❌ Doesn't account for user timezone
const formatted = date.toLocaleDateString();
```

### After (Correct)
```typescript
// Server-side
import { nowUTC, toISOUTC } from '@/lib/utils/date/server';

// ✅ Explicitly UTC
const now = nowUTC();

// ✅ Explicitly UTC ISO string
const timestamp = toISOUTC(nowUTC());

// Client-side
import { formatUserDate } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

// ✅ Formatted in user's timezone
const formatted = formatUserDate(date, DATE_FORMATS.DISPLAY_DATE);
```

---

## Files

- `constants.ts` - Date formats, timezones, locales (safe for both client/server)
- `server.ts` - Server-side utilities (UTC-only)
- `client.ts` - Client-side utilities (timezone-aware)
- `index.ts` - Central export

---

## Python Lambda Equivalent

See `Lambda/shared-layer/python/shared/utils/datetime_utils.py` for Python equivalents.

```python
from shared.utils.datetime_utils import now_utc, to_iso_utc

# Always use UTC
timestamp = now_utc()
iso_string = to_iso_utc(timestamp)
```
