-- Data migration script to assign ownership to nehorai for all existing podcasts and episodes
-- This script should be run AFTER applying migration 0007_flawless_lilandra.sql

-- IMPORTANT: Replace 'nehorai@example.com' with the actual email of the nehorai user
-- You can find it by querying: SELECT email FROM auth.users WHERE email LIKE '%nehorai%';

-- Step 1: Find nehorai's user_id from profiles table
-- The profiles.id matches auth.users.id in Supabase
DO $$
DECLARE
  nehorai_user_id uuid;
BEGIN
  -- Try to find nehorai's user_id
  -- IMPORTANT: Update the email address below to match the actual admin user
  SELECT id INTO nehorai_user_id
  FROM profiles
  WHERE id = (
    SELECT id
    FROM auth.users
    WHERE email LIKE '%nehorai%'
       OR email LIKE '%admin%'
    LIMIT 1
  );

  -- Check if user was found
  IF nehorai_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found. Please update the email pattern in this script.';
  END IF;

  RAISE NOTICE 'Found admin user_id: %', nehorai_user_id;

  -- Step 2: Assign ownership to all podcasts without created_by
  UPDATE podcasts
  SET created_by = nehorai_user_id
  WHERE created_by IS NULL;

  RAISE NOTICE 'Updated % podcasts', (SELECT COUNT(*) FROM podcasts WHERE created_by = nehorai_user_id);

  -- Step 3: Assign ownership to all episodes without created_by
  UPDATE episodes
  SET created_by = nehorai_user_id
  WHERE created_by IS NULL;

  RAISE NOTICE 'Updated % episodes', (SELECT COUNT(*) FROM episodes WHERE created_by = nehorai_user_id);

  -- Step 4: Assign user_id to cost_tracking_events based on related podcast/episode
  -- First, update cost events that have podcast_id
  UPDATE cost_tracking_events cte
  SET user_id = p.created_by
  FROM podcasts p
  WHERE cte.podcast_id = p.id
    AND cte.user_id IS NULL
    AND p.created_by IS NOT NULL;

  RAISE NOTICE 'Updated cost events via podcast_id: %', (SELECT COUNT(*) FROM cost_tracking_events WHERE user_id IS NOT NULL AND podcast_id IS NOT NULL);

  -- Then, update cost events that have episode_id
  UPDATE cost_tracking_events cte
  SET user_id = e.created_by
  FROM episodes e
  WHERE cte.episode_id = e.id
    AND cte.user_id IS NULL
    AND e.created_by IS NOT NULL;

  RAISE NOTICE 'Updated cost events via episode_id: %', (SELECT COUNT(*) FROM cost_tracking_events WHERE user_id IS NOT NULL AND episode_id IS NOT NULL);

END $$;

-- Verification queries (optional - run these to check the results)
-- SELECT COUNT(*) as total_podcasts, COUNT(created_by) as podcasts_with_owner FROM podcasts;
-- SELECT COUNT(*) as total_episodes, COUNT(created_by) as episodes_with_owner FROM episodes;
-- SELECT COUNT(*) as total_cost_events, COUNT(user_id) as events_with_user FROM cost_tracking_events;
