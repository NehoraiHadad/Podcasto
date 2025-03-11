# Supabase to Drizzle Migration

## Task Objective
Migrate from Supabase's Data API to Drizzle ORM for more efficient database operations while maintaining Supabase as the database provider.

## Current State Assessment
The application currently uses Supabase's Data API (PostgREST) for database operations. The database schema includes tables for podcasts, episodes, subscriptions, sent_episodes, and user_roles. Authentication is handled through Supabase Auth.

## Future State Goal
The application will use Drizzle ORM for database operations, providing better type safety, more efficient queries, and improved developer experience while maintaining compatibility with Supabase as the database provider.

## Implementation Plan

### 1. Setup Drizzle ORM
- [ ] Install required dependencies: `drizzle-orm`, `postgres`, and `drizzle-kit`
- [ ] Create a database connection configuration file
- [ ] Configure environment variables for database connection

### 2. Define Schema Models
- [ ] Create a schema directory structure
- [ ] Define table schemas for all existing tables using Drizzle's schema definition syntax
- [ ] Define relationships between tables
- [ ] Create TypeScript types for all database entities

### 3. Create Database Client
- [ ] Create a unified database client for server-side operations
- [ ] Implement connection pooling for efficient database connections
- [ ] Create utility functions for common database operations

### 4. Migrate API Functions
- [ ] Refactor podcast-related database operations to use Drizzle
- [ ] Refactor subscription-related database operations to use Drizzle
- [ ] Refactor user role and authentication-related database operations to use Drizzle
- [ ] Ensure all database operations maintain the same functionality

### 5. Testing and Validation
- [ ] Test all migrated functions to ensure they work as expected
- [ ] Validate type safety and error handling
- [ ] Ensure performance is maintained or improved

### 6. Cleanup and Documentation
- [ ] Remove unused Supabase Data API code
- [ ] Update documentation to reflect the new database access pattern
- [ ] Document any changes to the API or database schema

## Detailed Implementation Steps

### 1. Setup Drizzle ORM

#### Install Dependencies
```bash
npm i drizzle-orm postgres
npm i -D drizzle-kit
```

#### Create Database Connection Configuration
Create a new file at `src/lib/db/index.ts`:

```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Use connection pooler URL from Supabase
const connectionString = process.env.DATABASE_URL;

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
```

#### Configure Environment Variables
Add the following to `.env.local`:

```
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
```

Note: Get this URL from Supabase Dashboard > Project Settings > Database > Connection Pooling

### 2. Define Schema Models

#### Create Schema Directory Structure
Create the following directory structure:
```
src/
  lib/
    db/
      index.ts        # Database connection
      schema/         # Schema definitions
        index.ts      # Exports all schemas
        podcasts.ts   # Podcast table schema
        episodes.ts   # Episode table schema
        subscriptions.ts # Subscription table schema
        sent-episodes.ts # Sent episodes table schema
        user-roles.ts # User roles table schema
      types.ts        # Generated types
```

#### Define Table Schemas
Create schema files for each table. For example, `src/lib/db/schema/podcasts.ts`:

```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const podcasts = pgTable('podcasts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  language: text('language'),
  image_url: text('image_url'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});
```

### 3. Create Database Client

#### Create Unified Database Client
Enhance the `src/lib/db/index.ts` file with utility functions:

```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use connection pooler URL from Supabase
const connectionString = process.env.DATABASE_URL;

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from './schema';
```

### 4. Migrate API Functions

#### Example: Refactoring Podcast API
Refactor `src/lib/api/podcasts.ts`:

```typescript
'use server';

import { db } from '@/lib/db';
import { podcasts } from '@/lib/db/schema';
import { episodes } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export type Podcast = {
  id: string;
  title: string;
  description: string;
  language: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  episodes_count?: number;
};

export type Episode = {
  id: string;
  podcast_id: string;
  title: string;
  audio_url: string;
  duration?: number;
  created_at: string;
  published_at: string;
  description?: string;
  language?: string;
};

export async function getPodcasts(): Promise<Podcast[]> {
  try {
    // Get all podcasts
    const podcastsData = await db.select().from(podcasts);
    
    // Get episode counts for each podcast
    const podcastsWithCounts = await Promise.all(
      podcastsData.map(async (podcast) => {
        const episodeCount = await db
          .select({ count: count() })
          .from(episodes)
          .where(eq(episodes.podcast_id, podcast.id));
        
        return {
          ...podcast,
          episodes_count: episodeCount[0]?.count || 0
        };
      })
    );
    
    return podcastsWithCounts;
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return [];
  }
}
```

### 5. Testing and Validation

#### Create Test Script
Create a test script to validate the migration:

```typescript
// src/lib/db/test.ts
import { db } from './index';
import { podcasts } from './schema';

async function testDrizzleConnection() {
  try {
    const result = await db.select().from(podcasts).limit(1);
    console.log('Connection successful!');
    console.log('Sample data:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    // Close the connection
    await db.end();
  }
}

testDrizzleConnection();
```

### 6. Cleanup and Documentation

#### Update README
Update the database documentation to reflect the new approach:

```markdown
# Database Access with Drizzle ORM

This project uses Drizzle ORM to interact with a Supabase PostgreSQL database.

## Setup

1. Configure your database connection in `.env.local`:
   ```
   DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
   ```

2. Use the database client in your server components:
   ```typescript
   import { db } from '@/lib/db';
   import { podcasts } from '@/lib/db/schema';
   
   export async function MyServerComponent() {
     const allPodcasts = await db.select().from(podcasts);
     // ...
   }
   ```

## Schema Management

To update the database schema:

1. Modify the schema files in `src/lib/db/schema/`
2. Run migrations using Drizzle Kit:
   ```bash
   npx drizzle-kit push:pg
   ```
``` 