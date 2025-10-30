# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Podcasto is an AI-powered podcast generator that transforms Telegram news content into professional podcasts delivered via email. The system uses Next.js 15 with React Server Components on the frontend, AWS Lambda for audio processing, and Supabase for data persistence.

## Essential Commands

### Development
```bash
cd podcasto
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # Run ESLint
```

### Database Operations
```bash
cd podcasto
npx drizzle-kit generate    # Generate migration from schema changes
npx drizzle-kit push        # Push schema changes to database
```

### Lambda Deployment
```bash
cd Lambda/audio-generation-lambda
./deploy.sh dev     # Deploy to dev environment
./deploy.sh prod    # Deploy to production
```

## Architecture Overview

### Multi-Service Architecture
Podcasto uses a distributed architecture across four primary services:

1. **Next.js Application (Vercel)**: Main web application handling user interactions, admin dashboard, and episode triggering
2. **Telegram Lambda (AWS)**: Fetches content from Telegram channels and stores to S3
3. **Script Preprocessor Lambda (AWS)**: Generates clean content, analysis, and script using Google Gemini
4. **Audio Generation Lambda (AWS)**: Processes scripts using Google Gemini 2.5 Flash TTS, generates audio files

**Flow**: User triggers episode → Next.js invokes Telegram Lambda → Telegram Lambda fetches content → `script-generation-queue` → Script Lambda generates script → `audio-generation-queue` → Audio Lambda generates podcast → S3 storage → Database updated

### Database Layer (Drizzle + Supabase)
- **Schema Location**: `podcasto/src/lib/db/schema/`
- **Core Tables**: podcasts, episodes, subscriptions, sent_episodes, user_roles, podcast_configs
- **Pattern**: Each table has its own schema file; relationships defined in `schema/relations.ts`
- **Migration Workflow**: Update schema files → `npx drizzle-kit generate` → migrations created in `drizzle/` directory
- **Date/Time Policy**: All timestamps stored in UTC with `withTimezone: true` (see Date & Time Handling below)

### Date & Time Handling

**Golden Rule: "Store UTC, Display Local, Process UTC"**

All dates and times in Podcasto follow a strict UTC-first policy:

**Database:**
- All timestamp columns use `timestamp('field_name', { withTimezone: true })`
- PostgreSQL automatically converts and stores in UTC
- Never store dates in local timezone

**Next.js Application:**

Server-side (Server Components, Server Actions, API Routes):
```typescript
import { nowUTC, createDateRangeUTC, formatInTimezoneServer } from '@/lib/utils/date/server';

// Get current time
const now = nowUTC();

// Create date range for queries (handles user timezone)
const { startUTC, endUTC } = createDateRangeUTC(
  userStartDate,  // "2024-01-15"
  userEndDate,    // "2024-01-20"
  'Asia/Jerusalem' // User's timezone
);

// Query with UTC dates
const episodes = await db.query.episodes.findMany({
  where: and(
    gte(episodes.created_at, startUTC.toISOString()),
    lte(episodes.created_at, endUTC.toISOString())
  )
});
```

Client-side (Client Components with "use client"):
```typescript
import { formatUserDate, formatRelativeTime } from '@/lib/utils/date/client';
import { DATE_FORMATS } from '@/lib/utils/date/constants';

// Display in user's timezone
<p>{formatUserDate(episode.created_at, DATE_FORMATS.DISPLAY_DATE)}</p>
<p>{formatRelativeTime(episode.created_at)}</p>
```

**Lambda Functions (Python):**
```python
from shared.utils.datetime_utils import now_utc, to_iso_utc, create_date_range_utc

# Always use UTC
timestamp = now_utc()
iso_string = to_iso_utc(timestamp)

# Create date range for queries
start_utc, end_utc = create_date_range_utc(
    start_date,
    end_date,
    'Asia/Jerusalem'
)
```

**Critical Use Case - Episode Date Ranges:**
When users select dates for Telegram message filtering, the dates must be converted from their timezone to UTC to avoid missing messages:

```typescript
// User in Israel selects "2024-01-15" to "2024-01-20"
const { startUTC, endUTC } = createDateRangeUTC(
  '2024-01-15',
  '2024-01-20',
  'Asia/Jerusalem'
);
// startUTC: 2024-01-14T22:00:00.000Z (midnight Israel time)
// endUTC: 2024-01-20T21:59:59.999Z (end of day Israel time)
```

**Documentation:**
- Detailed guide: `src/lib/utils/date/README.md`
- Constants: `src/lib/utils/date/constants.ts`

### Authentication & Authorization
- **Implementation**: Supabase Auth with middleware protection
- **Middleware**: `src/middleware.ts` handles route protection and session refresh
- **Protected Routes**: `/profile`, `/settings`, `/podcasts/my`
- **Admin Routes**: `/admin` (requires admin role in user_roles table)
- **Session Management**: Server-side session handling via `@/lib/supabase/server`

### Server Actions Pattern
Server actions are organized by domain in `src/lib/actions/`:
- `admin-actions.ts`: Admin operations (episode management, user roles)
- `auth-actions.ts`: Authentication flows
- `episode-actions.ts`: Episode CRUD and status updates
- `podcast-actions.ts`: Podcast configuration and management
- `subscription-actions.ts`: User subscription management

**Convention**: All server actions use `"use server"` directive and return `{ success, data?, error? }` format.

### AWS Lambda Integration
- **Audio Generation Lambda**: Uses Google Gemini 2.5 Flash TTS for multi-speaker podcast generation
- **Message Format**: SQS messages include `episode_id`, `podcast_id`, `s3_path`, `timestamp`
- **Processing Flow**: SQS → Retrieve episode config → Fetch Telegram data from S3 → Generate audio → Upload to S3 → Update database
- **Timeout**: 15 minutes for audio processing
- **Error Handling**: Failed episodes marked with status 'failed'; dead letter queue for retry failures

### Episode Generation Monitoring

Podcasto includes a comprehensive monitoring system for tracking episode generation attempts and processing stages:

**Tracking Tables**:
- `episode_generation_attempts`: Tracks every generation attempt (success/failure), even when episode creation fails early
  - Captures: trigger source (cron/manual), status, error details, date range
  - Use for: reporting, identifying problematic podcasts, failure notifications

- `episode_processing_logs`: Tracks detailed processing stages for existing episodes
  - Captures: stage (telegram/script/audio/image), status, timing, errors
  - Use for: debugging failed episodes, performance analysis, stuck episode detection

**API Location**: `src/lib/db/api/episode-generation-attempts/`, `src/lib/db/api/episode-processing-logs.ts`

**Trigger Sources**:
- `cron`: Automated scheduled generation
- `manual_admin`: Admin-triggered generation
- `manual_user`: User-triggered generation

**Usage Example**:
```typescript
import { logGenerationAttempt } from '@/lib/db/api/episode-generation-attempts';

// Log a failed attempt with no messages
await logGenerationAttempt({
  podcastId: 'podcast-123',
  status: 'failed_no_messages',
  triggerSource: 'cron',
  failureReason: 'No new messages in channel',
  errorDetails: { channel_name: 'TechNews' }
});
```

**Monitoring Functions**:
- `getDailySummary()`: Daily generation statistics
- `getProblematicPodcasts()`: Identify high-failure-rate podcasts
- `getStuckEpisodes()`: Find episodes stuck in processing
- `getProcessingStats()`: Aggregated stage statistics

### File Upload & S3 Configuration
- **S3 Bucket**: Configured via `S3_BUCKET_NAME` and `AWS_REGION` environment variables
- **Image Handling**: `next.config.ts` includes multiple S3 hostname patterns for image optimization
- **Body Size Limit**: Server actions support up to 4MB (configured in `next.config.ts`)

### CloudFront CDN Integration
Podcasto uses AWS CloudFront as a Content Delivery Network (CDN) layer in front of S3 for optimized global audio delivery, following Amazon Audible's architecture best practices.

**Architecture**:
```
User Browser → CloudFront Edge Location (cached) → S3 Origin (cache miss only)
```

**Benefits**:
- **Latency**: 50-70% reduction for users outside us-east-1 region
- **Cost**: 60-80% bandwidth cost savings (CloudFront cheaper than S3 data transfer)
- **Cache Hit Ratio**: 80-95% after warm-up period (1-day default TTL)
- **Scalability**: Better handling of traffic spikes via edge caching
- **Security**: DDoS protection via AWS Shield integration

**Configuration**:
- **Enable**: Set `CLOUDFRONT_DOMAIN` environment variable (e.g., `d1234abcd.cloudfront.net`)
- **Fallback**: Automatically falls back to S3 presigned URLs if CloudFront unavailable
- **Cache**: 1-day default TTL at 400+ edge locations worldwide
- **Access**: Origin Access Control (OAC) restricts direct S3 access

**Code Location**:
- Constants: `src/lib/constants/aws-constants.ts`
- Utilities: `src/lib/utils/cloudfront-utils.ts`
- URL Generation: `src/lib/utils/s3-url-utils.ts` (`getBestUrlForS3Object()`)
- Audio Actions: `src/lib/actions/episode/audio-actions.ts` (`getEpisodeAudioUrl()`)

**Usage Example**:
```typescript
import { getEpisodeAudioUrl } from '@/lib/actions/episode/audio-actions';

const { url, source, error } = await getEpisodeAudioUrl(episodeId);
// With CloudFront: { url: "https://d123.cloudfront.net/podcasts/...", source: "cloudfront" }
// Without CloudFront: { url: "https://bucket.s3.amazonaws.com/...", source: "s3" }
```

**Security**:
- S3 bucket policy restricts access to CloudFront OAC only
- HTTPS enforced for all CloudFront distributions
- Public S3 access disabled (all traffic via CloudFront)

## Code Conventions (from .cursorrules)

### Project Structure
```
podcasto/
├── src/
│   ├── app/              # Next.js App Router pages and routes
│   │   ├── admin/        # Admin dashboard
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   ├── podcasts/     # Podcast playback and listing
│   │   └── profile/      # User profile
│   ├── components/       # React components
│   │   ├── admin/        # Admin-specific components
│   │   ├── episodes/     # Episode display components
│   │   ├── podcasts/     # Podcast components
│   │   └── ui/           # Shadcn UI components
│   ├── lib/
│   │   ├── actions/      # Server actions
│   │   ├── db/           # Database schema and utilities
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # Business logic services
│   │   ├── supabase/     # Supabase client utilities
│   │   └── utils/        # Utility functions
│   └── types/            # TypeScript type definitions
```

### Development Standards
- **Functional Programming**: Embrace functional, declarative patterns; avoid classes
- **TypeScript**: Strongly typed with accurate implementations
- **File Size Limit**: Maximum 150 lines per file; refactor if exceeded
- **Naming Conventions**:
  - Files/directories: lowercase with dashes (`auth-wizard`)
  - Variables: descriptive with auxiliary verbs (`isLoading`, `hasError`)
  - Exports: Named exports for components
- **Function Pattern**: RORO (Receive an Object, Return an Object)
- **Server Components**: Prefer RSC; minimize `"use client"` usage
- **State Management**: Zustand for client-side state when needed
- **UI Components**: Use Shadcn UI via `npx shadcn@latest add <component>`

### Build Notes System
Active development tasks are tracked in `/ProjectDocs/Build_Notes/active/` with structured markdown files:
- **Naming**: `build-title_phase-#_task-group-name.md`
- **Structure**: Task Objective → Current State → Future State → Implementation Plan
- **Updates**: Append changes; never delete tasks; line out non-applicable items
- **Completion**: Move to `completed/` when done; move to `archived/` if deprecated

### Context Files
Located in `/ProjectDocs/contexts/`:
- `projectContext.md`: Overall project scope and requirements
- `databaseSchema.md`: Database structure and relationships
- Update only for significant, approved changes to project scope

## Environment Variables

### Required for Next.js (Vercel)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                    # Postgres connection string

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AUDIO_GENERATION_QUEUE_URL=      # SQS queue URL
S3_BUCKET_NAME=

# AWS CloudFront CDN (optional - improves performance and reduces costs)
CLOUDFRONT_DOMAIN=               # e.g., d1234abcd.cloudfront.net (omit to use S3 direct)

# AWS SES (Email Notifications)
AWS_SES_REGION=us-east-1         # Optional, defaults to AWS_REGION
AWS_SES_FROM_EMAIL=notifications@podcasto.org
AWS_SES_FROM_NAME=Podcasto

# Site URL (for email links)
NEXT_PUBLIC_SITE_URL=https://podcasto.org  # Production domain

# Optional
NODE_ENV=development
```

### AWS Lambda Secrets (AWS Secrets Manager)
Store in secret named `podcasto-secrets`:
```json
{
  "SUPABASE_URL": "...",
  "SUPABASE_SERVICE_KEY": "...",
  "GEMINI_API_KEY": "..."
}
```

## Key Patterns & Gotchas

### Audio URL Handling
The `episodes.audio_url` field is nullable. Always guard against null values in UI components when displaying audio players or download links.

### Episode Processing States
Episodes follow this status flow: `pending` → `processing` → `completed` (or `failed`). Check status before allowing user actions.

### Bulk Operations
Recent addition of bulk selection/deletion for episodes in admin panel. Server action `deleteEpisodesBulk` handles validation and aggregation.

### Admin Role Checking
Admin routes are protected by middleware, but also verify user role from `user_roles` table for granular permissions in server actions.

### Migration Best Practices
- Never hardcode generated IDs in data migrations
- Use `npx drizzle-kit generate` for DDL changes
- Review migration SQL before applying to production

### Podcast Format Handling

Podcasts can be single-speaker (monologue) or multi-speaker (dialogue). The `podcast_format` field is critical throughout the system and determines:

**What It Controls:**
- **Script Generation Prompt**: Narration style vs dialogue structure
- **TTS Configuration**: `VoiceConfig` (single) vs `MultiSpeakerVoiceConfig` (multi)
- **Speaker Roles**: `speaker2_role` is NULL for single-speaker, required for multi-speaker
- **Voice Selection**: One voice vs two distinct voices

**Database Schema:**
```typescript
// podcast_configs table
{
  podcast_format: TEXT DEFAULT 'multi-speaker',  // 'single-speaker' | 'multi-speaker'
  speaker1_role: TEXT NOT NULL,                   // Always required
  speaker2_role: TEXT,                            // NULL for single-speaker
}
```

**Validation Rules:**
- Format must be 'single-speaker' or 'multi-speaker'
- `speaker1_role` always required
- `speaker2_role` required if format is 'multi-speaker'
- `speaker2_role` automatically set to NULL if format is 'single-speaker'

**Pipeline Flow:**
```
1. User selects format in UI (podcast creation form)
2. Server action validates and stores in podcast_configs.podcast_format
3. Episode generation triggered
4. Telegram Lambda includes format in SQS message
5. Script Preprocessor generates appropriate script style (narration vs dialogue)
6. Script Preprocessor selects voices and includes format in dynamic_config
7. Audio Lambda reads format and routes to correct TTS method:
   - Single-speaker → VoiceConfig with one voice
   - Multi-speaker → MultiSpeakerVoiceConfig with two voices
8. Generated audio matches selected format
```

**Lambda Integration:**

*Telegram Lambda:*
```python
# Extracts format from podcast config
podcast_format = config.get('podcast_format', 'multi-speaker')
# Includes in SQS message to Script Preprocessor
```

*Script Preprocessor Lambda:*
```python
# Receives format from Telegram Lambda
podcast_format = message.get('podcast_format', 'multi-speaker')
# Generates script appropriate for format (narration vs dialogue)
# Selects voices (one for single-speaker, two for multi-speaker)
# Includes format in dynamic_config for Audio Lambda
```

*Audio Generation Lambda:*
```python
# Receives format in dynamic_config
podcast_format = dynamic_config.get('podcast_format', 'multi-speaker')

# Routes to appropriate generation method
if podcast_format == 'single-speaker':
    # Use VoiceConfig with speaker1_voice only
    voice_config = VoiceConfig(prebuilt_voice_config=PrebuiltVoiceConfig(
        voice_name=speaker1_voice
    ))
else:  # multi-speaker
    # Use MultiSpeakerVoiceConfig with both voices
    multi_speaker_config = MultiSpeakerVoiceConfig([
        Speaker(speaker_id="1", voice_config=VoiceConfig(...)),
        Speaker(speaker_id="2", voice_config=VoiceConfig(...))
    ])
```

**Important Considerations:**
1. **Format Immutability**: Cannot change format after episodes are created (voice consistency)
2. **Default Value**: Always defaults to 'multi-speaker' for backward compatibility
3. **Voice Consistency**: Pre-selected voices ensure consistency across retries and chunks
4. **Validation**: Format validated at multiple stages (UI, server action, Lambda)

**When Working with Podcast Code:**
- Always check `podcast_format` to handle both cases correctly
- Never assume multi-speaker; check the format field explicitly
- Ensure `speaker2_role` is NULL for single-speaker in database operations
- Include format in all SQS messages between Lambda functions
- Log format at each processing stage for debugging

**Documentation:**
- User Guide: `docs/USER_GUIDE.md`
- Format Comparison: `docs/PODCAST_FORMATS.md`
- API Reference: `docs/API_DOCUMENTATION.md`
- Lambda Architecture: `Lambda/ARCHITECTURE_SINGLE_SPEAKER.md`

### Email Notification System
- **Service**: AWS SES for transactional emails
- **Trigger Point**: Episode processor sends emails when status changes to `PUBLISHED`
- **User Preferences**: Check `profiles.email_notifications` before sending
- **Duplicate Prevention**: Track sent emails in `sent_episodes` table
- **Non-Blocking**: Email failures don't prevent episode publishing
- **Templates**: HTML and plain text versions in `src/lib/email/templates/`
- **Testing**: Verify SES domain/email in AWS Console; move out of sandbox for production
