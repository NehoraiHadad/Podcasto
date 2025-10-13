# Database Schema Documentation

**Last Updated**: 2025-10-13
**ORM**: Drizzle ORM
**Database**: PostgreSQL (Supabase)
**Schema Location**: `src/lib/db/schema/`

---

## Overview

The Podcasto database schema is organized around podcast content generation, user management, and email notification tracking. The schema follows a clear separation of concerns with dedicated tables for core entities and their relationships.

### Architecture Principles

- **Cascade Deletions**: Parent-child relationships use `onDelete: 'cascade'` to maintain referential integrity
- **UUID Primary Keys**: All tables use UUID for distributed system compatibility
- **Timestamp Tracking**: All entities track creation/update times with timezone support
- **Indexed Lookups**: Strategic indexes on frequently queried fields
- **Supabase Auth Integration**: References to `auth.users` (managed by Supabase)

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│   auth.users        │  (Supabase managed)
│   (External)        │
└──────┬──────────────┘
       │
       │ (references user_id)
       │
       ├──────────────┬──────────────┬──────────────┐
       │              │              │              │
       ▼              ▼              ▼              ▼
┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────┐
│  profiles  │  │ user_roles  │  │subscr.   │  │sent_ep.   │
└────────────┘  └─────────────┘  └────┬─────┘  └─────┬─────┘
                                       │              │
                                       ▼              │
                                ┌────────────┐        │
                                │  podcasts  │◄───────┘
                                └──────┬─────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
             ┌────────────┐     ┌───────────┐     ┌──────────────┐
             │  episodes  │     │  podcast_ │     │ (future      │
             └──────┬─────┘     │  configs  │     │  extensions) │
                    │           └───────────┘     └──────────────┘
                    ▼
             ┌────────────┐
             │sent_episodes│
             └────────────┘
```

---

## Core Tables

### 1. podcasts

**Purpose**: Stores podcast metadata and configuration

```typescript
{
  id: uuid (PK),
  title: text (required),
  description: text,
  cover_image: text,
  image_style: text,          // Style for AI image generation
  is_paused: boolean,          // Controls episode generation
  created_at: timestamp,
  updated_at: timestamp
}
```

**Key Fields**:
- `image_style`: Stores the visual style template used for podcast cover generation (e.g., 'modern-professional', 'minimalist')
- `is_paused`: When true, automatic episode generation is disabled for this podcast

**Relationships**:
- One-to-Many: `episodes`
- One-to-Many: `podcast_configs`
- One-to-Many: `subscriptions`

**Usage**:
- Primary entity for podcast management
- Referenced by all podcast-related operations
- Soft pause mechanism via `is_paused` flag

---

### 2. episodes

**Purpose**: Individual podcast episodes with generation metadata

```typescript
{
  id: uuid (PK),
  podcast_id: uuid (FK → podcasts.id, CASCADE),
  title: text (required),
  description: text,
  language: text,
  audio_url: varchar,           // S3 URL to audio file
  duration: integer,            // Duration in seconds
  status: text,                 // pending|processing|completed|failed
  metadata: text,               // JSON metadata from generation
  cover_image: text,            // Episode-specific cover
  script_url: varchar,          // S3 URL to script/transcript
  analysis: text,               // Content analysis data
  speaker2_role: text,          // Episode-specific speaker role override
  content_start_date: timestamp, // For bulk generation date ranges
  content_end_date: timestamp,
  created_at: timestamp,
  published_at: timestamp
}
```

**Key Fields**:
- `status`: Tracks episode lifecycle (pending → processing → completed/failed)
- `audio_url`: Nullable; only populated after successful audio generation
- `content_start_date/end_date`: Used by bulk generation to track date ranges
- `speaker2_role`: Overrides the default role from podcast_configs if specified

**Relationships**:
- Many-to-One: `podcasts`
- One-to-Many: `sent_episodes`

**Status Flow**:
```
pending → processing → completed
                    → failed
```

**Usage**:
- Created by episode generator
- Updated by AWS Lambda audio processor
- Referenced in email notifications

---

### 3. podcast_configs

**Purpose**: Detailed configuration for AI podcast generation

```typescript
{
  id: uuid (PK),
  podcast_id: uuid (FK → podcasts.id, CASCADE),
  content_source: text (required),      // 'telegram' | 'url' | 'manual'
  telegram_channel: text,
  telegram_hours: integer,              // Hours of history to fetch
  urls: jsonb (string[]),               // Array of source URLs
  creator: text (required),             // Creator name
  podcast_name: text (required),        // Display name
  slogan: text,
  language: text = 'english',
  creativity_level: integer (required), // 1-100 scale
  is_long_podcast: boolean (required),
  discussion_rounds: integer (required),
  min_chars_per_round: integer (required),
  conversation_style: text (required),  // 'casual' | 'professional' | etc
  speaker1_role: text (required),       // e.g., 'Host', 'Interviewer'
  speaker2_role: text (required),       // e.g., 'Expert', 'Guest'
  mixing_techniques: jsonb (string[]) (required),
  additional_instructions: text,
  episode_frequency: integer = 7,       // Days between episodes
  created_at: timestamp,
  updated_at: timestamp
}
```

**Key Fields**:
- `content_source`: Determines which data fetcher to use
- `telegram_hours`: How far back to fetch from Telegram channels
- `creativity_level`: Controls AI model's creativity (higher = more creative)
- `discussion_rounds`: Number of back-and-forth exchanges in podcast
- `episode_frequency`: Automatic scheduling interval

**Relationships**:
- Many-to-One: `podcasts`

**Usage**:
- Passed to AWS Lambda for AI generation
- Single source of truth for generation parameters
- Can be updated without affecting historical episodes

---

### 4. subscriptions

**Purpose**: Tracks user subscriptions to podcasts for email notifications

```typescript
{
  id: uuid (PK),
  user_id: uuid (required) → auth.users,
  podcast_id: uuid (FK → podcasts.id, CASCADE),
  created_at: timestamp
}
```

**Indexes**:
```typescript
{
  subscriptions_podcast_id_idx: [podcast_id],  // Fetch all subscribers
  subscriptions_user_id_idx: [user_id]         // User subscription lookup
}
```

**Relationships**:
- Many-to-One: `podcasts`
- External: `auth.users` (via user_id)

**Usage**:
- Query by `podcast_id` when sending episode notifications
- Query by `user_id` for subscription management UI
- Cascade delete when podcast is removed

---

### 5. sent_episodes

**Purpose**: Tracks which episodes have been emailed to which users (duplicate prevention)

```typescript
{
  id: uuid (PK),
  user_id: uuid (required) → auth.users,
  episode_id: uuid (FK → episodes.id, CASCADE),
  sent_at: timestamp
}
```

**Indexes**:
```typescript
{
  sent_episodes_episode_user_idx: [episode_id, user_id],  // Duplicate check
  sent_episodes_user_id_idx: [user_id]                    // User history
}
```

**Relationships**:
- Many-to-One: `episodes`
- External: `auth.users` (via user_id)

**Usage**:
- Check before sending: `SELECT * WHERE episode_id = X AND user_id = Y`
- Prevents duplicate email notifications
- Provides email history for users

---

### 6. profiles

**Purpose**: Extended user profile data and preferences

```typescript
{
  id: uuid (PK) → auth.users.id,
  display_name: text,
  email_notifications: boolean = true,
  unsubscribe_token: uuid (unique),
  created_at: timestamp,
  updated_at: timestamp
}
```

**Key Fields**:
- `id`: Same as Supabase auth.users.id (not a foreign key, shared primary key)
- `email_notifications`: Global on/off switch for all email notifications
- `unsubscribe_token`: Unique token for one-click email unsubscribe links

**Relationships**:
- External: `auth.users` (via id)

**Usage**:
- Check `email_notifications` before sending any emails
- Use `unsubscribe_token` in email footer links
- Extend with additional user preferences as needed

---

### 7. user_roles

**Purpose**: Role-based access control (RBAC)

```typescript
{
  id: uuid (PK),
  user_id: uuid (required) → auth.users,
  role: text (required),              // 'admin' | 'moderator' | etc
  created_at: timestamp
}
```

**Relationships**:
- External: `auth.users` (via user_id)

**Usage**:
- Query by `user_id` to check permissions
- Currently supports 'admin' role for admin panel access
- Extensible for additional roles (moderator, contributor, etc.)

---

## Relationships Summary

### podcasts (parent)
```typescript
- ONE podcast → MANY episodes
- ONE podcast → MANY subscriptions
- ONE podcast → MANY podcast_configs
```

### episodes
```typescript
- MANY episodes → ONE podcast
- ONE episode → MANY sent_episodes
```

### subscriptions
```typescript
- MANY subscriptions → ONE podcast
- MANY subscriptions → ONE user (auth.users)
```

### sent_episodes
```typescript
- MANY sent_episodes → ONE episode
- MANY sent_episodes → ONE user (auth.users)
```

### podcast_configs
```typescript
- MANY configs → ONE podcast
```

### profiles
```typescript
- ONE profile → ONE user (auth.users) [1:1 relationship via shared PK]
```

### user_roles
```typescript
- MANY roles → ONE user (auth.users)
```

---

## Indexes

### Performance-Critical Indexes

**subscriptions**:
- `subscriptions_podcast_id_idx ON podcast_id`
  - **Use Case**: Fetch all subscribers when new episode is published
  - **Query**: `SELECT * FROM subscriptions WHERE podcast_id = X`

- `subscriptions_user_id_idx ON user_id`
  - **Use Case**: Show user's subscribed podcasts
  - **Query**: `SELECT * FROM subscriptions WHERE user_id = X`

**sent_episodes**:
- `sent_episodes_episode_user_idx ON (episode_id, user_id)`
  - **Use Case**: Check if episode was already sent to user (duplicate prevention)
  - **Query**: `SELECT * FROM sent_episodes WHERE episode_id = X AND user_id = Y`

- `sent_episodes_user_id_idx ON user_id`
  - **Use Case**: Fetch user's email history
  - **Query**: `SELECT * FROM sent_episodes WHERE user_id = X`

---

## Data Flow Examples

### 1. Episode Generation & Notification Flow

```
1. Admin triggers episode generation
   ↓
2. Episode created with status='pending'
   ↓
3. SQS message sent to Lambda
   ↓
4. Lambda updates status='processing'
   ↓
5. Lambda generates audio, uploads to S3
   ↓
6. Lambda updates status='completed', sets audio_url
   ↓
7. Email service queries:
   - subscriptions WHERE podcast_id = X
   - profiles WHERE email_notifications = true
   - sent_episodes WHERE episode_id = Y (exclude already sent)
   ↓
8. Emails sent, records created in sent_episodes
```

### 2. User Subscription Flow

```
1. User subscribes to podcast
   ↓
2. INSERT INTO subscriptions (user_id, podcast_id)
   ↓
3. User included in future episode notifications
```

### 3. Unsubscribe Flow

```
1. User clicks unsubscribe link with token
   ↓
2. Query profiles WHERE unsubscribe_token = X
   ↓
3. UPDATE profiles SET email_notifications = false
   ↓
4. User excluded from ALL future notifications
```

---

## Migration Strategy

### Adding New Fields

**Recommended Pattern**:
```typescript
// 1. Update schema file
export const podcasts = pgTable('podcasts', {
  // ... existing fields
  new_field: text('new_field')
});

// 2. Generate migration
// $ npx drizzle-kit generate

// 3. Review generated SQL in drizzle/ directory

// 4. Apply to database
// $ npx drizzle-kit push
```

### Changing Relationships

**Important**: Never hardcode generated IDs in data migrations. Use queries to find IDs dynamically.

**Example**:
```sql
-- ✅ Good: Dynamic reference
UPDATE episodes
SET podcast_id = (SELECT id FROM podcasts WHERE title = 'Example')
WHERE title = 'Example Episode';

-- ❌ Bad: Hardcoded UUID
UPDATE episodes
SET podcast_id = '123e4567-e89b-12d3-a456-426614174000'
WHERE title = 'Example Episode';
```

---

## Schema Relations Code

All relationships are defined in `schema/relations.ts` using Drizzle's relations API:

```typescript
// Example: podcasts → episodes (one-to-many)
export const podcastsRelations = relations(podcasts, ({ many }) => ({
  episodes: many(episodes),
  subscriptions: many(subscriptions),
  podcastConfigs: many(podcastConfigs)
}));

// Example: episodes → podcast (many-to-one)
export const episodesRelations = relations(episodes, ({ one, many }) => ({
  podcast: one(podcasts, {
    fields: [episodes.podcast_id],
    references: [podcasts.id]
  }),
  sentEpisodes: many(sentEpisodes)
}));
```

**Usage in Queries**:
```typescript
import { db } from '@/lib/db';
import { podcasts, episodes } from '@/lib/db/schema';

// Query with relations
const podcastWithEpisodes = await db.query.podcasts.findFirst({
  where: eq(podcasts.id, podcastId),
  with: {
    episodes: true,
    podcastConfigs: true
  }
});
```

---

## Important Notes

### Supabase Auth Integration

- `auth.users` table is managed by Supabase and lives in the `auth` schema
- Our tables reference `auth.users.id` via `user_id` fields
- **Never** manually modify `auth.users` - use Supabase Auth API
- Row Level Security (RLS) may be enabled on some tables via Supabase dashboard

### Cascade Deletion Behavior

All foreign keys use `onDelete: 'cascade'`:
- Deleting a podcast → deletes all episodes, configs, subscriptions
- Deleting an episode → deletes all sent_episodes records
- Deleting a user (via Supabase) → orphans subscriptions and sent_episodes (consider adding triggers)

### Nullable Fields

- `episodes.audio_url`: Nullable because episodes start in 'pending' status before audio generation
- Optional metadata fields allow gradual feature adoption without schema changes

### JSONB Fields

- `podcast_configs.urls`: Array of strings for multi-source content
- `podcast_configs.mixing_techniques`: Array of technique names
- Use JSONB for flexible, schema-less arrays/objects that don't need querying

---

## Query Best Practices

### ✅ DO

```typescript
// Use Drizzle's query builder
const podcast = await db.query.podcasts.findFirst({
  where: eq(podcasts.id, id),
  with: { episodes: true }
});

// Use proper indexes
const subs = await db.query.subscriptions.findMany({
  where: eq(subscriptions.podcast_id, podcastId)  // Uses index
});
```

### ❌ DON'T

```typescript
// Don't fetch all then filter in JS
const allPodcasts = await db.select().from(podcasts);
const myPodcast = allPodcasts.find(p => p.id === id);  // Inefficient!

// Don't skip cascade deletes
await db.delete(episodes).where(eq(episodes.podcast_id, id));
await db.delete(podcasts).where(eq(podcasts.id, id));  // Manual cascade
```

---

## Future Enhancements

### Potential Schema Extensions

1. **Comments/Reviews**: User feedback on episodes
2. **Analytics**: Listen counts, completion rates
3. **Playlists**: User-curated episode collections
4. **Transcripts**: Full-text searchable transcripts table
5. **Tags/Categories**: Taxonomy for podcast discovery
6. **Premium Tiers**: Subscription levels and payment tracking

### Monitoring Considerations

- Track episode generation failures in `status='failed'`
- Monitor cascade deletes to detect data loss
- Alert on long-running 'processing' episodes (stuck jobs)
- Track sent_episodes growth rate (email volume)

---

**Schema Version**: 1.0
**Maintained By**: Development Team
**Last Review**: 2025-10-13
