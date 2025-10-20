-- Fix "Function Search Path Mutable" security warnings
-- Adds SET search_path = public, pg_temp to all functions to prevent SQL injection

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- 1. update_podcast_configs_updated_at
CREATE OR REPLACE FUNCTION update_podcast_configs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 3. set_first_user_as_admin
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    -- Insert admin role for the first user
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- 4. sync_users_cache
CREATE OR REPLACE FUNCTION sync_users_cache()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    -- סנכרון משתמשים חדשים
    INSERT INTO public.users_cache (id, email, created_at)
    SELECT id, email, created_at
    FROM auth.users
    ON CONFLICT (id)
    DO UPDATE SET
        email = EXCLUDED.email,
        created_at = EXCLUDED.created_at;

    RETURN NEW;
END;
$$;

-- ============================================
-- QUERY FUNCTIONS
-- ============================================

-- 5. is_admin (no parameters)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Replace these IDs with your actual admin user IDs
  RETURN auth.uid() IN (
    'admin-user-id-1',
    'admin-user-id-2'
  );
END;
$$;

-- 6. is_admin (with user_id_param)
CREATE OR REPLACE FUNCTION is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  admin_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = user_id_param
    AND role = 'admin'
  ) INTO admin_exists;

  RETURN admin_exists;
END;
$$;

-- 7. get_podcast_config
CREATE OR REPLACE FUNCTION get_podcast_config(input_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result jsonb;
BEGIN
  -- First try to find by podcast_config_id (direct ID)
  SELECT row_to_json(pc)::jsonb INTO result
  FROM podcast_configs pc
  WHERE pc.id::text = input_id;

  -- If not found, try to find by podcast_id
  IF result IS NULL THEN
    SELECT row_to_json(pc)::jsonb INTO result
    FROM podcast_configs pc
    WHERE pc.podcast_id::text = input_id;
  END IF;

  -- Return the result (will be NULL if no match found)
  RETURN result;
END;
$$;

-- 8. get_podcast_config_by_id
CREATE OR REPLACE FUNCTION get_podcast_config_by_id(config_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  config_row jsonb;
BEGIN
  SELECT to_jsonb(podcast_configs.*) INTO config_row
  FROM podcast_configs
  WHERE id = config_id;

  IF config_row IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Podcast config not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', config_row
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 9. get_podcast_config_by_podcast_id
CREATE OR REPLACE FUNCTION get_podcast_config_by_podcast_id(p_podcast_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  config_row jsonb;
BEGIN
  SELECT to_jsonb(podcast_configs.*) INTO config_row
  FROM podcast_configs
  WHERE podcast_id = p_podcast_id;

  IF config_row IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Podcast config not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', config_row
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 10. check_podcasts_for_new_episodes
CREATE OR REPLACE FUNCTION check_podcasts_for_new_episodes()
RETURNS TABLE(
  podcast_id uuid,
  podcast_title text,
  content_source text,
  episode_frequency integer,
  days_since_last_episode integer
)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH last_episodes AS (
    SELECT
      e.podcast_id,
      MAX(e.published_at) as last_episode_date
    FROM
      episodes e
    WHERE
      e.status = 'completed' OR e.status IS NULL
    GROUP BY
      e.podcast_id
  ),
  pending_episodes AS (
    SELECT
      e.podcast_id,
      COUNT(*) as pending_count
    FROM
      episodes e
    WHERE
      e.status IN ('pending', 'content_collected', 'generating_audio')
    GROUP BY
      e.podcast_id
  )
  SELECT
    p.id as podcast_id,
    p.title as podcast_title,
    pc.content_source,
    pc.episode_frequency,
    CASE
      WHEN le.last_episode_date IS NULL THEN 999 -- No episodes yet, high priority
      ELSE EXTRACT(DAY FROM NOW() - le.last_episode_date)::INTEGER
    END as days_since_last_episode
  FROM
    podcasts p
  JOIN
    podcast_configs pc ON p.id = pc.podcast_id
  LEFT JOIN
    last_episodes le ON p.id = le.podcast_id
  LEFT JOIN
    pending_episodes pe ON p.id = pe.podcast_id
  WHERE
    -- Only include podcasts with no pending episodes
    (pe.pending_count IS NULL OR pe.pending_count = 0)
    AND
    -- And that need a new episode based on frequency
    CASE
      WHEN le.last_episode_date IS NULL THEN TRUE -- No episodes yet, should create one
      ELSE EXTRACT(DAY FROM NOW() - le.last_episode_date)::INTEGER >= pc.episode_frequency
    END;
END;
$$;

-- 11. update_episode_status
CREATE OR REPLACE FUNCTION update_episode_status(episode_id uuid, new_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result_row JSONB;
BEGIN
  UPDATE episodes
  SET status = update_episode_status.new_status,
      published_at = NOW()
  WHERE id = update_episode_status.episode_id
  RETURNING jsonb_build_object(
    'id', episodes.id,
    'status', episodes.status,
    'published_at', episodes.published_at
  ) INTO result_row;

  IF result_row IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Episode not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', result_row
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 12. update_episode_audio_url
CREATE OR REPLACE FUNCTION update_episode_audio_url(
  episode_id uuid,
  audio_url text,
  new_status text DEFAULT 'completed',
  duration integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result_row JSONB;
BEGIN
  UPDATE episodes
  SET audio_url = update_episode_audio_url.audio_url,
      status = update_episode_audio_url.new_status,
      duration = update_episode_audio_url.duration,
      published_at = NOW()
  WHERE id = update_episode_audio_url.episode_id
  RETURNING jsonb_build_object(
    'id', id,
    'audio_url', episodes.audio_url,
    'status', episodes.status,
    'duration', episodes.duration,
    'published_at', episodes.published_at
  ) INTO result_row;

  IF result_row IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Episode not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', result_row
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 13. mark_episode_failed
CREATE OR REPLACE FUNCTION mark_episode_failed(episode_id uuid, error_message text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result_row JSONB;
  existing_metadata TEXT;
  new_metadata JSONB;
BEGIN
  -- Get existing metadata
  SELECT metadata INTO existing_metadata
  FROM episodes
  WHERE id = episode_id;

  -- Parse existing metadata or create new
  IF existing_metadata IS NULL OR existing_metadata = '' THEN
    new_metadata = jsonb_build_object();
  ELSE
    BEGIN
      new_metadata = existing_metadata::jsonb;
    EXCEPTION WHEN OTHERS THEN
      new_metadata = jsonb_build_object();
    END;
  END IF;

  -- Add error information to metadata
  new_metadata = new_metadata || jsonb_build_object(
    'error', error_message,
    'failed_at', NOW()::text
  );

  -- Update episode with failed status and error metadata
  UPDATE episodes
  SET status = 'failed',
      metadata = new_metadata::text,
      updated_at = NOW()
  WHERE id = episode_id
  RETURNING jsonb_build_object(
    'id', episodes.id,
    'status', episodes.status,
    'metadata', episodes.metadata,
    'updated_at', episodes.updated_at
  ) INTO result_row;

  IF result_row IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Episode not found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', result_row
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
