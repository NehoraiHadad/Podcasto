# Database Layer with Drizzle ORM

This directory contains the database layer implementation using Drizzle ORM with Supabase.

## Schema Structure

The schema is defined in the `schema` directory, with each table having its own file. The relationships between tables are defined in `schema/relations.ts`.

## Migration Workflow

When making changes to the database schema, follow these steps:

1. **Update Schema Files**: Modify the appropriate schema files in `src/lib/db/schema/`.

2. **Generate Migration**: Run the following command to generate a migration:
   ```bash
   npx drizzle-kit generate
   ```
   This will create a new migration file in the `drizzle` directory.

3. **Review Migration**: Check the generated SQL in the migration file to ensure it matches your intended changes.

4. **Apply Migration**: To apply the migration to your database, you can use the Supabase CLI or execute the SQL directly in the Supabase dashboard.

   Using Supabase CLI:
   ```bash
   supabase db push
   ```

   Or manually execute the SQL from the migration file in the Supabase dashboard SQL editor.

5. **Update Types**: After applying the migration, make sure to update any affected TypeScript types in your application.

## Usage Examples

### Basic Query Examples

```typescript
// Import the database client
import { db } from '@/lib/db';
import { podcasts, episodes } from '@/lib/db/schema';

// Select all podcasts
const allPodcasts = await db.select().from(podcasts);

// Select a specific podcast by ID
const podcast = await db.select().from(podcasts).where(eq(podcasts.id, podcastId)).limit(1);

// Insert a new podcast
const newPodcast = await db.insert(podcasts).values({
  title: 'My New Podcast',
  description: 'A description of my podcast',
  language: 'en'
}).returning();

// Update a podcast
await db.update(podcasts)
  .set({ title: 'Updated Title' })
  .where(eq(podcasts.id, podcastId));

// Delete a podcast
await db.delete(podcasts).where(eq(podcasts.id, podcastId));
```

### Relationship Query Examples

```typescript
// Get all episodes for a podcast
const podcastWithEpisodes = await db.query.podcasts.findFirst({
  where: eq(podcasts.id, podcastId),
  with: {
    episodes: true
  }
});

// Get all subscriptions for a podcast
const podcastWithSubscriptions = await db.query.podcasts.findFirst({
  where: eq(podcasts.id, podcastId),
  with: {
    subscriptions: true
  }
});
```

## Environment Variables

The database connection requires the following environment variable:

- `DATABASE_URL`: The connection string for your Supabase database

Make sure this is properly set in your `.env.local` file.

## Troubleshooting

If you encounter issues with migrations or database connections, check the following:

1. Ensure your `DATABASE_URL` is correctly set and points to a valid Supabase database.
2. Verify that you have the necessary permissions to modify the database schema.
3. Check for any conflicts between your local schema and the remote database schema.
4. If using connection pooling, ensure you've set `prepare: false` in the Postgres client configuration. 