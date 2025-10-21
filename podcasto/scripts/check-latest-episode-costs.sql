-- Check costs for the most recent episode
-- Run this in Supabase SQL Editor or via psql

WITH latest_episode AS (
  SELECT id, title, created_at
  FROM episodes
  ORDER BY created_at DESC
  LIMIT 1
)
SELECT
  '=== EPISODE INFO ===' as section,
  le.title as episode_title,
  le.created_at::date as created_date,
  NULL::numeric as value,
  NULL as unit
FROM latest_episode le

UNION ALL

SELECT
  '=== COST SUMMARY ===' as section,
  'Total Cost' as metric,
  NULL as date,
  ec.total_cost_usd::numeric as value,
  'USD' as unit
FROM latest_episode le
JOIN episode_costs ec ON le.id = ec.episode_id

UNION ALL

SELECT
  '' as section,
  'AI Text Cost' as metric,
  NULL,
  ec.ai_text_cost_usd::numeric,
  'USD'
FROM latest_episode le
JOIN episode_costs ec ON le.id = ec.episode_id

UNION ALL

SELECT
  '' as section,
  'AI Image Cost' as metric,
  NULL,
  ec.ai_image_cost_usd::numeric,
  'USD'
FROM latest_episode le
JOIN episode_costs ec ON le.id = ec.episode_id

UNION ALL

SELECT
  '' as section,
  'Total Tokens' as metric,
  NULL,
  ec.total_tokens::numeric,
  'tokens'
FROM latest_episode le
JOIN episode_costs ec ON le.id = ec.episode_id

UNION ALL

SELECT
  '=== DETAILED EVENTS ===' as section,
  NULL as metric,
  NULL,
  NULL,
  NULL

UNION ALL

SELECT
  '' as section,
  cte.service as metric,
  NULL,
  cte.quantity::numeric as value,
  cte.unit
FROM latest_episode le
JOIN cost_tracking_events cte ON le.id = cte.episode_id
ORDER BY section DESC, metric;

-- Show all cost events for debugging
SELECT
  service,
  event_type,
  quantity::numeric,
  unit,
  unit_cost_usd::numeric,
  total_cost_usd::numeric,
  metadata,
  timestamp
FROM cost_tracking_events
WHERE episode_id = (SELECT id FROM episodes ORDER BY created_at DESC LIMIT 1)
ORDER BY timestamp DESC;
