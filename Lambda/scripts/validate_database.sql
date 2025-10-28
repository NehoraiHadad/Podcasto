-- Database Validation Script for Single-Speaker Feature
-- Run these queries to verify podcast_format integration

-- ============================================
-- 1. Check podcast_configs table for format field
-- ============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'podcast_configs'
  AND column_name = 'podcast_format';

-- Expected:
-- column_name: podcast_format
-- data_type: text (or podcast_format_enum)
-- is_nullable: NO
-- column_default: 'multi-speaker'

-- ============================================
-- 2. Check if podcast_format constraint exists
-- ============================================
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'podcast_configs'
  AND constraint_name LIKE '%podcast_format%';

-- Expected: check constraint on podcast_format

-- ============================================
-- 3. Count podcasts by format
-- ============================================
SELECT
    podcast_format,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM podcast_configs
GROUP BY podcast_format
ORDER BY count DESC;

-- Expected: majority multi-speaker, some single-speaker

-- ============================================
-- 4. Check recent single-speaker podcasts
-- ============================================
SELECT
    pc.id as config_id,
    p.id as podcast_id,
    p.title,
    pc.podcast_format,
    pc.speaker1_role,
    pc.speaker1_gender,
    pc.language,
    p.created_at
FROM podcast_configs pc
JOIN podcasts p ON pc.podcast_id = p.id
WHERE pc.podcast_format = 'single-speaker'
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================
-- 5. Check episodes with format in metadata
-- ============================================
SELECT
    e.id,
    e.title,
    e.status,
    e.metadata->>'podcast_format' as metadata_format,
    e.metadata->>'speaker1_voice' as speaker1_voice,
    e.metadata->>'speaker2_voice' as speaker2_voice,
    pc.podcast_format as config_format,
    e.created_at
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.metadata IS NOT NULL
  AND e.metadata->>'podcast_format' IS NOT NULL
ORDER BY e.created_at DESC
LIMIT 10;

-- ============================================
-- 6. Check completed single-speaker episodes
-- ============================================
SELECT
    e.id,
    e.title,
    e.status,
    e.audio_url,
    e.duration,
    e.metadata->>'podcast_format' as format,
    e.metadata->>'speaker1_voice' as voice,
    pc.podcast_format as config_format,
    e.created_at
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE pc.podcast_format = 'single-speaker'
  AND e.status = 'completed'
ORDER BY e.created_at DESC
LIMIT 10;

-- ============================================
-- 7. Check for format mismatches
-- ============================================
-- Episodes where metadata format differs from config format
SELECT
    e.id,
    e.title,
    e.status,
    e.metadata->>'podcast_format' as metadata_format,
    pc.podcast_format as config_format,
    CASE
        WHEN e.metadata->>'podcast_format' = pc.podcast_format THEN 'MATCH'
        ELSE 'MISMATCH'
    END as match_status,
    e.created_at
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.metadata IS NOT NULL
  AND e.metadata->>'podcast_format' IS NOT NULL
  AND e.metadata->>'podcast_format' != pc.podcast_format
ORDER BY e.created_at DESC
LIMIT 10;

-- Expected: no mismatches (or very few from testing)

-- ============================================
-- 8. Check episode processing logs for format
-- ============================================
SELECT
    epl.episode_id,
    epl.stage,
    epl.status,
    epl.error_message,
    epl.additional_data->>'podcast_format' as format,
    epl.created_at
FROM episode_processing_logs epl
WHERE epl.additional_data->>'podcast_format' IS NOT NULL
ORDER BY epl.created_at DESC
LIMIT 20;

-- ============================================
-- 9. Statistics: Episode success rate by format
-- ============================================
SELECT
    pc.podcast_format,
    e.status,
    COUNT(*) as count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY pc.podcast_format) as percentage
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.created_at > NOW() - INTERVAL '7 days'
GROUP BY pc.podcast_format, e.status
ORDER BY pc.podcast_format, count DESC;

-- Expected: similar success rates for both formats

-- ============================================
-- 10. Check for NULL or invalid formats
-- ============================================
SELECT
    id,
    podcast_id,
    podcast_format,
    created_at
FROM podcast_configs
WHERE podcast_format IS NULL
   OR podcast_format NOT IN ('single-speaker', 'multi-speaker');

-- Expected: no rows (or only test data)

-- ============================================
-- 11. Sample single-speaker episode details
-- ============================================
-- Replace <episode-id> with actual episode ID from query 6
/*
SELECT
    e.id,
    e.title,
    e.status,
    e.audio_url,
    e.duration,
    e.script_url,
    e.description,
    e.metadata,
    pc.podcast_format,
    pc.speaker1_role,
    pc.speaker1_gender,
    pc.language,
    e.created_at,
    e.updated_at
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.id = '<episode-id>';
*/

-- ============================================
-- 12. Check RLS policies (if applicable)
-- ============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('podcast_configs', 'episodes', 'podcasts')
ORDER BY tablename, policyname;

-- ============================================
-- Summary Queries
-- ============================================

-- Total podcast count by format
SELECT
    'Total Podcasts' as metric,
    podcast_format as format,
    COUNT(*) as value
FROM podcast_configs
GROUP BY podcast_format
UNION ALL
-- Total episodes by format
SELECT
    'Total Episodes' as metric,
    pc.podcast_format as format,
    COUNT(*) as value
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
GROUP BY pc.podcast_format
UNION ALL
-- Completed episodes by format
SELECT
    'Completed Episodes' as metric,
    pc.podcast_format as format,
    COUNT(*) as value
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.status = 'completed'
GROUP BY pc.podcast_format
ORDER BY metric, format;

-- ============================================
-- Test Queries (for manual testing)
-- ============================================

-- Create a test single-speaker podcast (COMMENTED OUT - uncomment to use)
/*
INSERT INTO podcasts (id, title, description, user_id)
VALUES (gen_random_uuid(), 'Test Single-Speaker Podcast', 'Test podcast for validation', '<your-user-id>')
RETURNING id;

-- Use the returned podcast_id in the next query
INSERT INTO podcast_configs (
    id, podcast_id, podcast_format, telegram_channel,
    speaker1_role, speaker1_gender, language, telegram_hours
)
VALUES (
    gen_random_uuid(),
    '<podcast-id-from-above>',
    'single-speaker',
    '<your-telegram-channel>',
    'Narrator',
    'male',
    'he',
    24
)
RETURNING id, podcast_id;
*/

-- Delete test podcast (COMMENTED OUT - uncomment to use)
/*
DELETE FROM podcast_configs WHERE id = '<test-config-id>';
DELETE FROM podcasts WHERE id = '<test-podcast-id>';
*/

-- ============================================
-- Troubleshooting Queries
-- ============================================

-- Find episodes stuck in processing with format info
SELECT
    e.id,
    e.title,
    e.status,
    pc.podcast_format,
    EXTRACT(EPOCH FROM (NOW() - e.updated_at))/3600 as hours_since_update,
    e.created_at
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.status IN ('processing', 'pending', 'content_collected', 'script_ready')
  AND e.updated_at < NOW() - INTERVAL '1 hour'
ORDER BY e.updated_at ASC
LIMIT 20;

-- Find failed episodes by format
SELECT
    pc.podcast_format,
    COUNT(*) as failed_count,
    array_agg(DISTINCT e.id) as episode_ids
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.status = 'failed'
  AND e.created_at > NOW() - INTERVAL '7 days'
GROUP BY pc.podcast_format;
