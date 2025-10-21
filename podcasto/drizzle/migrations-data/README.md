# Data Migrations for User Cost Tracking

This directory contains data migration scripts that populate newly added schema columns with existing data.

## Migration 0007: User Ownership Assignment

**Purpose**: Assign ownership (`created_by`) to all existing podcasts and episodes, and link cost tracking events to users.

### Prerequisites
1. Schema migration `0007_flawless_lilandra.sql` must be applied first
2. You need to know the admin user's email address (nehorai)

### Steps to Execute

#### 1. Find the Admin User Email
First, identify the admin user's email in the database:

```sql
-- Run this query in Supabase SQL Editor or psql
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%nehorai%'
   OR email LIKE '%admin%'
ORDER BY created_at ASC;
```

#### 2. Update the Data Migration Script
Edit `assign-nehorai-ownership.sql` and update the email pattern on line 18:
```sql
WHERE email LIKE '%nehorai%'  -- Update this to match the actual email
   OR email LIKE '%admin%'
```

Or use the exact email:
```sql
WHERE email = 'actual-nehorai-email@example.com'
```

#### 3. Run the Schema Migration
```bash
cd podcasto
npx drizzle-kit push
```

Or in Supabase SQL Editor, run:
```sql
-- Copy and paste the contents of drizzle/0007_flawless_lilandra.sql
```

#### 4. Run the Data Migration
In Supabase SQL Editor or via psql:
```bash
psql $DATABASE_URL -f drizzle/migrations-data/assign-nehorai-ownership.sql
```

Or copy-paste the entire script into Supabase SQL Editor and execute.

#### 5. Verify the Results
Run these queries to verify:

```sql
-- Check podcasts
SELECT
  COUNT(*) as total_podcasts,
  COUNT(created_by) as podcasts_with_owner,
  COUNT(*) - COUNT(created_by) as podcasts_without_owner
FROM podcasts;

-- Check episodes
SELECT
  COUNT(*) as total_episodes,
  COUNT(created_by) as episodes_with_owner,
  COUNT(*) - COUNT(created_by) as episodes_without_owner
FROM episodes;

-- Check cost tracking events
SELECT
  COUNT(*) as total_cost_events,
  COUNT(user_id) as events_with_user,
  COUNT(*) - COUNT(user_id) as events_without_user
FROM cost_tracking_events;

-- Verify the owner
SELECT
  p.email,
  COUNT(DISTINCT pod.id) as owned_podcasts,
  COUNT(DISTINCT ep.id) as owned_episodes
FROM profiles p
LEFT JOIN podcasts pod ON pod.created_by = p.id
LEFT JOIN episodes ep ON ep.created_by = p.id
GROUP BY p.id, p.email
ORDER BY owned_podcasts DESC;
```

### What This Migration Does

1. **Finds Admin User**: Locates the nehorai/admin user in the auth.users table
2. **Updates Podcasts**: Sets `created_by` for all podcasts that don't have an owner
3. **Updates Episodes**: Sets `created_by` for all episodes that don't have an owner
4. **Links Cost Events**: Sets `user_id` on cost_tracking_events based on the related podcast/episode owner

### Safety Features

- Uses `DO $$ ... END $$` block for transaction-like behavior
- Raises an exception if admin user is not found
- Only updates records where the field is `NULL` (idempotent)
- Provides progress notices during execution
- Includes verification queries

### Rollback (if needed)

If you need to rollback the data migration:

```sql
-- WARNING: This will remove ownership from all podcasts/episodes
UPDATE podcasts SET created_by = NULL;
UPDATE episodes SET created_by = NULL;
UPDATE cost_tracking_events SET user_id = NULL;
```

### Notes

- This is a **one-time migration** for existing data
- Future podcasts and episodes will have `created_by` set automatically when created
- The script is idempotent - safe to run multiple times
- Always test on a development/staging database first
