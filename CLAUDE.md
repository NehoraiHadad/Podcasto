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
Podcasto uses a distributed architecture across three primary services:

1. **Next.js Application (Vercel)**: Main web application handling user interactions, admin dashboard, and episode triggering
2. **Telegram Lambda (AWS)**: Fetches content from Telegram channels and stores to S3
3. **Audio Generation Lambda (AWS)**: Processes episode content using Google Gemini 2.5 Flash TTS, generates audio files

**Flow**: User triggers episode → Next.js sends to SQS → Telegram Lambda fetches content → Audio Lambda generates podcast → S3 storage → Database updated

### Database Layer (Drizzle + Supabase)
- **Schema Location**: `podcasto/src/lib/db/schema/`
- **Core Tables**: podcasts, episodes, subscriptions, sent_episodes, user_roles, podcast_configs
- **Pattern**: Each table has its own schema file; relationships defined in `schema/relations.ts`
- **Migration Workflow**: Update schema files → `npx drizzle-kit generate` → migrations created in `drizzle/` directory

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

### File Upload & S3 Configuration
- **S3 Bucket**: Configured via `S3_BUCKET_NAME` and `AWS_REGION` environment variables
- **Image Handling**: `next.config.ts` includes multiple S3 hostname patterns for image optimization
- **Body Size Limit**: Server actions support up to 4MB (configured in `next.config.ts`)

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

### Email Notification System
- **Service**: AWS SES for transactional emails
- **Trigger Point**: Episode processor sends emails when status changes to `PUBLISHED`
- **User Preferences**: Check `profiles.email_notifications` before sending
- **Duplicate Prevention**: Track sent emails in `sent_episodes` table
- **Non-Blocking**: Email failures don't prevent episode publishing
- **Templates**: HTML and plain text versions in `src/lib/email/templates/`
- **Testing**: Verify SES domain/email in AWS Console; move out of sandbox for production
