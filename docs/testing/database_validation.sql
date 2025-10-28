-- ============================================================================
-- Single-Speaker Feature - Database Validation Queries
-- ============================================================================
-- Purpose: Validate database integrity after single-speaker feature deployment
-- Usage: Run these queries against the database to verify correct implementation
-- Date: 2025-10-28
-- ============================================================================

-- ============================================================================
-- SECTION 1: SCHEMA VALIDATION
-- ============================================================================

-- Query 1.1: Verify podcast_format column exists
-- Expected: Returns 1 row with column details
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'podcast_configs'
  AND column_name = 'podcast_format';
-- Expected Result:
-- column_name      | data_type | column_default  | is_nullable
-- podcast_format   | text      | 'multi-speaker' | YES


-- Query 1.2: Verify speaker2_role is nullable
-- Expected: is_nullable = 'YES'
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'podcast_configs'
  AND column_name = 'speaker2_role';
-- Expected Result:
-- column_name    | data_type | is_nullable
-- speaker2_role  | text      | YES


-- Query 1.3: List all columns in podcast_configs table
-- Use to verify full schema
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'podcast_configs'
ORDER BY ordinal_position;


-- ============================================================================
-- SECTION 2: DATA INTEGRITY CHECKS
-- ============================================================================

-- Query 2.1: Check for NULL podcast_format values
-- Expected: 0 rows (all podcasts should have format set)
SELECT
    id,
    podcast_name,
    podcast_format,
    created_at
FROM podcast_configs
WHERE podcast_format IS NULL;
-- Expected: 0 rows (migration should have set default)


-- Query 2.2: Verify podcast_format contains only valid values
-- Expected: Only 'single-speaker' and 'multi-speaker'
SELECT
    podcast_format,
    COUNT(*) as count
FROM podcast_configs
GROUP BY podcast_format
ORDER BY count DESC;
-- Expected Result (example):
-- podcast_format  | count
-- multi-speaker   | 45
-- single-speaker  | 12


-- Query 2.3: Find invalid podcast_format values (if any)
-- Expected: 0 rows
SELECT
    id,
    podcast_name,
    podcast_format
FROM podcast_configs
WHERE podcast_format NOT IN ('single-speaker', 'multi-speaker')
   OR podcast_format IS NULL;
-- Expected: 0 rows


-- ============================================================================
-- SECTION 3: SINGLE-SPEAKER VALIDATION
-- ============================================================================

-- Query 3.1: Verify single-speaker podcasts have NO speaker2_role
-- Expected: 0 rows (single-speaker should have NULL speaker2_role)
SELECT
    id,
    podcast_name,
    podcast_format,
    speaker1_role,
    speaker2_role,
    created_at
FROM podcast_configs
WHERE podcast_format = 'single-speaker'
  AND speaker2_role IS NOT NULL;
-- Expected: 0 rows (data integrity issue if any found)


-- Query 3.2: List all single-speaker podcasts
-- Use to verify single-speaker podcasts are configured correctly
SELECT
    id,
    podcast_name,
    speaker1_role,
    speaker2_role,
    conversation_style,
    language,
    created_at
FROM podcast_configs
WHERE podcast_format = 'single-speaker'
ORDER BY created_at DESC;


-- Query 3.3: Count single-speaker podcasts by speaker role
SELECT
    speaker1_role,
    COUNT(*) as count
FROM podcast_configs
WHERE podcast_format = 'single-speaker'
GROUP BY speaker1_role
ORDER BY count DESC;


-- ============================================================================
-- SECTION 4: MULTI-SPEAKER VALIDATION
-- ============================================================================

-- Query 4.1: Verify multi-speaker podcasts HAVE speaker2_role
-- Expected: 0 rows (multi-speaker must have speaker2_role)
SELECT
    id,
    podcast_name,
    podcast_format,
    speaker1_role,
    speaker2_role,
    created_at
FROM podcast_configs
WHERE podcast_format = 'multi-speaker'
  AND speaker2_role IS NULL;
-- Expected: 0 rows (data integrity issue if any found)


-- Query 4.2: List all multi-speaker podcasts
-- Verify both speaker roles are set
SELECT
    id,
    podcast_name,
    speaker1_role,
    speaker2_role,
    conversation_style,
    language,
    created_at
FROM podcast_configs
WHERE podcast_format = 'multi-speaker'
ORDER BY created_at DESC
LIMIT 20;


-- Query 4.3: Count multi-speaker podcasts by speaker role combinations
SELECT
    speaker1_role,
    speaker2_role,
    COUNT(*) as count
FROM podcast_configs
WHERE podcast_format = 'multi-speaker'
GROUP BY speaker1_role, speaker2_role
ORDER BY count DESC;


-- ============================================================================
-- SECTION 5: EPISODE VALIDATION
-- ============================================================================

-- Query 5.1: Check episode generation by podcast format
-- Compare success rates between single and multi-speaker
SELECT
    pc.podcast_format,
    COUNT(e.id) as total_episodes,
    COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed,
    COUNT(CASE WHEN e.status = 'processing' THEN 1 END) as processing,
    COUNT(CASE WHEN e.audio_url IS NOT NULL THEN 1 END) as with_audio
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
GROUP BY pc.podcast_format;
-- Look for significant differences in completion rates


-- Query 5.2: Recent episodes by format
-- Verify both formats are generating episodes
SELECT
    e.id,
    p.podcast_name,
    pc.podcast_format,
    e.title,
    e.status,
    e.created_at,
    e.audio_url IS NOT NULL as has_audio
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.created_at > NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC
LIMIT 50;


-- Query 5.3: Check episode metadata for format tracking
-- Verify podcast_format is stored in episode metadata
SELECT
    e.id,
    p.podcast_name,
    pc.podcast_format as config_format,
    e.metadata->>'podcast_format' as episode_format,
    e.status,
    e.created_at
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.created_at > NOW() - INTERVAL '7 days'
ORDER BY e.created_at DESC
LIMIT 20;
-- Verify episode_format matches config_format


-- ============================================================================
-- SECTION 6: MIGRATION VERIFICATION
-- ============================================================================

-- Query 6.1: Check oldest podcasts have format set
-- Verify migration applied to all existing records
SELECT
    id,
    podcast_name,
    podcast_format,
    created_at
FROM podcast_configs
ORDER BY created_at ASC
LIMIT 10;
-- All should have podcast_format = 'multi-speaker' (default from migration)


-- Query 6.2: Check format distribution by creation date
-- Verify newer podcasts can be single-speaker
SELECT
    DATE_TRUNC('month', created_at) as month,
    podcast_format,
    COUNT(*) as count
FROM podcast_configs
GROUP BY DATE_TRUNC('month', created_at), podcast_format
ORDER BY month DESC;


-- Query 6.3: Find podcasts created before migration
-- Verify they all defaulted to multi-speaker
SELECT
    COUNT(*) as pre_migration_count,
    COUNT(CASE WHEN podcast_format = 'multi-speaker' THEN 1 END) as multi_speaker,
    COUNT(CASE WHEN podcast_format = 'single-speaker' THEN 1 END) as single_speaker
FROM podcast_configs
WHERE created_at < '2025-10-27'::timestamp;  -- Adjust date to actual migration date
-- Expected: All or most should be multi-speaker


-- ============================================================================
-- SECTION 7: PROCESSING LOGS VALIDATION
-- ============================================================================

-- Query 7.1: Check episode processing success by format
-- Identify any format-specific processing issues
SELECT
    pc.podcast_format,
    epl.stage,
    epl.status,
    COUNT(*) as count
FROM episode_processing_logs epl
JOIN episodes e ON epl.episode_id = e.id
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE epl.created_at > NOW() - INTERVAL '7 days'
GROUP BY pc.podcast_format, epl.stage, epl.status
ORDER BY pc.podcast_format, epl.stage, epl.status;


-- Query 7.2: Find failed processing stages for single-speaker
-- Identify any single-speaker specific issues
SELECT
    epl.episode_id,
    p.podcast_name,
    epl.stage,
    epl.status,
    epl.error_message,
    epl.started_at,
    epl.completed_at
FROM episode_processing_logs epl
JOIN episodes e ON epl.episode_id = e.id
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE pc.podcast_format = 'single-speaker'
  AND epl.status = 'failed'
  AND epl.created_at > NOW() - INTERVAL '7 days'
ORDER BY epl.started_at DESC;


-- Query 7.3: Compare average processing times by format
-- Identify performance differences
SELECT
    pc.podcast_format,
    epl.stage,
    COUNT(*) as episodes_processed,
    AVG(EXTRACT(EPOCH FROM (epl.completed_at - epl.started_at))) as avg_duration_seconds,
    MIN(EXTRACT(EPOCH FROM (epl.completed_at - epl.started_at))) as min_duration_seconds,
    MAX(EXTRACT(EPOCH FROM (epl.completed_at - epl.started_at))) as max_duration_seconds
FROM episode_processing_logs epl
JOIN episodes e ON epl.episode_id = e.id
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE epl.status = 'completed'
  AND epl.completed_at IS NOT NULL
  AND epl.created_at > NOW() - INTERVAL '7 days'
GROUP BY pc.podcast_format, epl.stage
ORDER BY pc.podcast_format, epl.stage;


-- ============================================================================
-- SECTION 8: GENERATION ATTEMPTS TRACKING
-- ============================================================================

-- Query 8.1: Track generation attempts by format
SELECT
    pc.podcast_format,
    ega.status,
    COUNT(*) as count
FROM episode_generation_attempts ega
JOIN podcast_configs pc ON ega.podcast_id = pc.podcast_id
WHERE ega.created_at > NOW() - INTERVAL '7 days'
GROUP BY pc.podcast_format, ega.status
ORDER BY pc.podcast_format, count DESC;


-- Query 8.2: Find problematic single-speaker podcasts
-- Identify podcasts with high failure rates
SELECT
    p.id,
    p.podcast_name,
    pc.podcast_format,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN ega.status LIKE 'failed%' THEN 1 END) as failed_attempts,
    ROUND(
        100.0 * COUNT(CASE WHEN ega.status LIKE 'failed%' THEN 1 END) / COUNT(*),
        2
    ) as failure_rate_pct
FROM episode_generation_attempts ega
JOIN podcast_configs pc ON ega.podcast_id = pc.podcast_id
JOIN podcasts p ON pc.podcast_id = p.id
WHERE pc.podcast_format = 'single-speaker'
  AND ega.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.podcast_name, pc.podcast_format
HAVING COUNT(*) >= 3
ORDER BY failure_rate_pct DESC, total_attempts DESC;


-- ============================================================================
-- SECTION 9: CONSISTENCY CHECKS (CROSS-VALIDATION)
-- ============================================================================

-- Query 9.1: Verify all episodes have matching podcast format
-- Ensures format is tracked consistently
SELECT
    e.id as episode_id,
    p.podcast_name,
    pc.podcast_format as config_format,
    e.metadata->>'podcast_format' as episode_metadata_format
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.created_at > NOW() - INTERVAL '7 days'
  AND (
    e.metadata->>'podcast_format' IS NULL
    OR e.metadata->>'podcast_format' != pc.podcast_format
  )
ORDER BY e.created_at DESC;
-- Expected: 0 rows (perfect consistency)


-- Query 9.2: Check for orphaned configurations
-- Find podcast_configs without podcasts
SELECT
    pc.id,
    pc.podcast_name,
    pc.podcast_format,
    pc.created_at
FROM podcast_configs pc
LEFT JOIN podcasts p ON pc.podcast_id = p.id
WHERE p.id IS NULL;
-- Expected: 0 rows


-- Query 9.3: Verify speaker role consistency
-- Ensure speaker roles are set correctly
SELECT
    podcast_format,
    COUNT(*) as total,
    COUNT(speaker1_role) as has_speaker1,
    COUNT(speaker2_role) as has_speaker2,
    COUNT(CASE WHEN speaker1_role IS NULL THEN 1 END) as missing_speaker1,
    COUNT(CASE WHEN podcast_format = 'multi-speaker' AND speaker2_role IS NULL THEN 1 END) as multi_missing_speaker2,
    COUNT(CASE WHEN podcast_format = 'single-speaker' AND speaker2_role IS NOT NULL THEN 1 END) as single_has_speaker2
FROM podcast_configs
GROUP BY podcast_format;
-- Expected:
-- - missing_speaker1 = 0 (all must have speaker1)
-- - multi_missing_speaker2 = 0 (multi-speaker must have speaker2)
-- - single_has_speaker2 = 0 (single-speaker should not have speaker2)


-- ============================================================================
-- SECTION 10: PERFORMANCE & STATISTICS
-- ============================================================================

-- Query 10.1: Episode duration comparison by format
-- Check if single-speaker episodes have different durations
SELECT
    pc.podcast_format,
    COUNT(e.id) as episodes_with_audio,
    AVG(e.duration) as avg_duration_seconds,
    MIN(e.duration) as min_duration_seconds,
    MAX(e.duration) as max_duration_seconds,
    STDDEV(e.duration) as stddev_duration
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.duration IS NOT NULL
  AND e.status = 'completed'
  AND e.created_at > NOW() - INTERVAL '30 days'
GROUP BY pc.podcast_format;


-- Query 10.2: Audio file size comparison
-- Check S3 storage patterns by format
SELECT
    pc.podcast_format,
    COUNT(e.id) as episodes,
    AVG(CAST(e.metadata->>'audio_size_bytes' AS BIGINT)) / 1024 / 1024 as avg_size_mb
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.metadata->>'audio_size_bytes' IS NOT NULL
  AND e.created_at > NOW() - INTERVAL '30 days'
GROUP BY pc.podcast_format;


-- Query 10.3: Feature adoption tracking
-- Track how quickly single-speaker format is adopted
SELECT
    DATE_TRUNC('day', created_at) as date,
    podcast_format,
    COUNT(*) as podcasts_created
FROM podcast_configs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), podcast_format
ORDER BY date DESC, podcast_format;


-- ============================================================================
-- SECTION 11: CLEANUP & MAINTENANCE QUERIES
-- ============================================================================

-- Query 11.1: Find test podcasts (for cleanup in dev environment)
-- WARNING: Do NOT run DELETE in production without verification
SELECT
    id,
    podcast_name,
    podcast_format,
    created_at
FROM podcast_configs
WHERE podcast_name ILIKE '%test%'
   OR podcast_name ILIKE '%demo%'
ORDER BY created_at DESC;


-- Query 11.2: Find incomplete episodes older than 24 hours
-- Identify stuck episodes that may need manual intervention
SELECT
    e.id,
    p.podcast_name,
    pc.podcast_format,
    e.status,
    e.created_at,
    NOW() - e.created_at as age
FROM episodes e
JOIN podcasts p ON e.podcast_id = p.id
JOIN podcast_configs pc ON p.id = pc.podcast_id
WHERE e.status IN ('pending', 'processing')
  AND e.created_at < NOW() - INTERVAL '24 hours'
ORDER BY e.created_at;


-- ============================================================================
-- SECTION 12: VALIDATION SUMMARY REPORT
-- ============================================================================

-- Query 12.1: Overall health check
-- Single query to get system-wide validation status
WITH format_counts AS (
    SELECT
        podcast_format,
        COUNT(*) as total_podcasts
    FROM podcast_configs
    GROUP BY podcast_format
),
integrity_checks AS (
    SELECT
        COUNT(CASE WHEN podcast_format IS NULL THEN 1 END) as null_formats,
        COUNT(CASE WHEN podcast_format NOT IN ('single-speaker', 'multi-speaker') THEN 1 END) as invalid_formats,
        COUNT(CASE WHEN podcast_format = 'single-speaker' AND speaker2_role IS NOT NULL THEN 1 END) as single_with_speaker2,
        COUNT(CASE WHEN podcast_format = 'multi-speaker' AND speaker2_role IS NULL THEN 1 END) as multi_without_speaker2
    FROM podcast_configs
),
recent_episodes AS (
    SELECT
        pc.podcast_format,
        COUNT(e.id) as episodes_last_7_days,
        COUNT(CASE WHEN e.status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN e.status = 'failed' THEN 1 END) as failed
    FROM episodes e
    JOIN podcasts p ON e.podcast_id = p.id
    JOIN podcast_configs pc ON p.id = pc.podcast_id
    WHERE e.created_at > NOW() - INTERVAL '7 days'
    GROUP BY pc.podcast_format
)
SELECT
    'Format Counts' as check_category,
    json_build_object(
        'single-speaker', (SELECT total_podcasts FROM format_counts WHERE podcast_format = 'single-speaker'),
        'multi-speaker', (SELECT total_podcasts FROM format_counts WHERE podcast_format = 'multi-speaker')
    ) as results
UNION ALL
SELECT
    'Data Integrity' as check_category,
    json_build_object(
        'null_formats', null_formats,
        'invalid_formats', invalid_formats,
        'single_with_speaker2', single_with_speaker2,
        'multi_without_speaker2', multi_without_speaker2,
        'status', CASE
            WHEN null_formats + invalid_formats + single_with_speaker2 + multi_without_speaker2 = 0
            THEN 'PASS'
            ELSE 'FAIL'
        END
    ) as results
FROM integrity_checks
UNION ALL
SELECT
    'Recent Episodes - Single-Speaker' as check_category,
    json_build_object(
        'total', episodes_last_7_days,
        'completed', completed,
        'failed', failed,
        'success_rate', ROUND(100.0 * completed / NULLIF(episodes_last_7_days, 0), 2)
    ) as results
FROM recent_episodes WHERE podcast_format = 'single-speaker'
UNION ALL
SELECT
    'Recent Episodes - Multi-Speaker' as check_category,
    json_build_object(
        'total', episodes_last_7_days,
        'completed', completed,
        'failed', failed,
        'success_rate', ROUND(100.0 * completed / NULLIF(episodes_last_7_days, 0), 2)
    ) as results
FROM recent_episodes WHERE podcast_format = 'multi-speaker';


-- ============================================================================
-- END OF VALIDATION QUERIES
-- ============================================================================
--
-- Recommended Usage:
-- 1. Run Section 1 (Schema Validation) immediately after deployment
-- 2. Run Section 2-4 (Data Integrity) to verify database state
-- 3. Run Section 5-8 after generating test episodes
-- 4. Run Section 9-11 periodically for ongoing monitoring
-- 5. Run Section 12 for quick health checks
--
-- Expected Outcomes:
-- - All integrity checks should return 0 inconsistencies
-- - Both formats should have similar success rates in episode generation
-- - Processing times should be comparable between formats
-- - No orphaned or corrupted data
-- ============================================================================
