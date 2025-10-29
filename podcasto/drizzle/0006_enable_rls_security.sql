-- Migration: Enable Row Level Security (RLS) on 13 tables
-- Description: Adds database-level security to prevent unauthorized access
-- Created: 2025-10-29
-- Issue: Supabase linter detected RLS disabled on public tables
-- Impact: Service role (Lambda functions) will continue to work via bypass policies

-- =============================================================================
-- PHASE 1: Enable RLS on all tables
-- =============================================================================
-- This enables the RLS flag but doesn't block access until policies are created

-- Critical: User financial data
ALTER TABLE "user_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credit_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_costs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_subscriptions" ENABLE ROW LEVEL SECURITY;

-- High: Analytics and tracking
ALTER TABLE "cost_tracking_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "episode_costs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "episode_generation_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_bounces" ENABLE ROW LEVEL SECURITY;

-- Medium: System configuration
ALTER TABLE "cost_pricing_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "system_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credit_packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_cost_summary" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "monthly_cost_summary" ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PHASE 2: Create service_role bypass policies
-- =============================================================================
-- Service role (used by Lambda functions) must have full access to all tables
-- These policies ensure backend operations continue to work

-- user_credits
CREATE POLICY "service_role_all_user_credits"
ON "user_credits"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- credit_transactions
CREATE POLICY "service_role_all_credit_transactions"
ON "credit_transactions"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- user_costs
CREATE POLICY "service_role_all_user_costs"
ON "user_costs"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- user_subscriptions
CREATE POLICY "service_role_all_user_subscriptions"
ON "user_subscriptions"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- cost_tracking_events
CREATE POLICY "service_role_all_cost_tracking_events"
ON "cost_tracking_events"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- episode_costs
CREATE POLICY "service_role_all_episode_costs"
ON "episode_costs"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- episode_generation_attempts
CREATE POLICY "service_role_all_episode_generation_attempts"
ON "episode_generation_attempts"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- email_bounces
CREATE POLICY "service_role_all_email_bounces"
ON "email_bounces"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- cost_pricing_config
CREATE POLICY "service_role_all_cost_pricing_config"
ON "cost_pricing_config"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- system_settings
CREATE POLICY "service_role_all_system_settings"
ON "system_settings"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- credit_packages
CREATE POLICY "service_role_all_credit_packages"
ON "credit_packages"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- daily_cost_summary
CREATE POLICY "service_role_all_daily_cost_summary"
ON "daily_cost_summary"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- monthly_cost_summary
CREATE POLICY "service_role_all_monthly_cost_summary"
ON "monthly_cost_summary"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- PHASE 3: Create helper function for admin checks
-- =============================================================================
-- This function will be used by admin-only policies

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================================================
-- PHASE 4: User-specific policies (CRITICAL TABLES)
-- =============================================================================

-- ==================== user_credits ====================
-- Users can view their own credits
CREATE POLICY "user_credits_select_own"
ON "user_credits"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all credits
CREATE POLICY "user_credits_select_admin"
ON "user_credits"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Users can update their own credits (for application-managed transactions)
CREATE POLICY "user_credits_update_own"
ON "user_credits"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can update all credits
CREATE POLICY "user_credits_update_admin"
ON "user_credits"
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Only service role can insert credits (no user insert policy)

-- ==================== credit_transactions ====================
-- Users can view their own transactions
CREATE POLICY "credit_transactions_select_own"
ON "credit_transactions"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "credit_transactions_select_admin"
ON "credit_transactions"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only service role can insert/update transactions (no user policies)

-- ==================== user_costs ====================
-- Users can view their own costs
CREATE POLICY "user_costs_select_own"
ON "user_costs"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all costs
CREATE POLICY "user_costs_select_admin"
ON "user_costs"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only service role can insert/update costs (no user policies)

-- ==================== user_subscriptions ====================
-- Users can view their own subscriptions
CREATE POLICY "user_subscriptions_select_own"
ON "user_subscriptions"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "user_subscriptions_select_admin"
ON "user_subscriptions"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Users can update their own subscriptions (for cancellations, etc.)
CREATE POLICY "user_subscriptions_update_own"
ON "user_subscriptions"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can update all subscriptions
CREATE POLICY "user_subscriptions_update_admin"
ON "user_subscriptions"
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================================================
-- PHASE 5: Analytics tables (HIGH PRIORITY)
-- =============================================================================

-- ==================== cost_tracking_events ====================
-- Users can view events for their own episodes/podcasts
CREATE POLICY "cost_tracking_events_select_own"
ON "cost_tracking_events"
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM episodes
    WHERE episodes.id = episode_id AND episodes.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM podcasts
    WHERE podcasts.id = podcast_id AND podcasts.created_by = auth.uid()
  )
);

-- Admins can view all tracking events
CREATE POLICY "cost_tracking_events_select_admin"
ON "cost_tracking_events"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- ==================== episode_costs ====================
-- Users can view costs for their own episodes
CREATE POLICY "episode_costs_select_own"
ON "episode_costs"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM episodes
    WHERE episodes.id = episode_id AND episodes.created_by = auth.uid()
  )
);

-- Admins can view all episode costs
CREATE POLICY "episode_costs_select_admin"
ON "episode_costs"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- ==================== episode_generation_attempts ====================
-- Users can view attempts for their own podcasts
CREATE POLICY "episode_generation_attempts_select_own"
ON "episode_generation_attempts"
FOR SELECT
TO authenticated
USING (
  triggered_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM podcasts
    WHERE podcasts.id = podcast_id AND podcasts.created_by = auth.uid()
  )
);

-- Admins can view all attempts
CREATE POLICY "episode_generation_attempts_select_admin"
ON "episode_generation_attempts"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- ==================== email_bounces ====================
-- Users can view their own email bounces
CREATE POLICY "email_bounces_select_own"
ON "email_bounces"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all bounces
CREATE POLICY "email_bounces_select_admin"
ON "email_bounces"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- =============================================================================
-- PHASE 6: System configuration tables (MEDIUM PRIORITY)
-- =============================================================================

-- ==================== cost_pricing_config ====================
-- Only admins can view pricing config
CREATE POLICY "cost_pricing_config_select_admin"
ON "cost_pricing_config"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can manage pricing config
CREATE POLICY "cost_pricing_config_all_admin"
ON "cost_pricing_config"
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==================== system_settings ====================
-- Only admins can view/modify system settings
CREATE POLICY "system_settings_admin_only"
ON "system_settings"
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==================== credit_packages ====================
-- Everyone can view active packages (needed for purchase UI)
CREATE POLICY "credit_packages_select_active"
ON "credit_packages"
FOR SELECT
TO authenticated
USING (is_active = true);

-- Admins can view all packages (including inactive)
CREATE POLICY "credit_packages_select_admin"
ON "credit_packages"
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can modify packages
CREATE POLICY "credit_packages_modify_admin"
ON "credit_packages"
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "credit_packages_update_admin"
ON "credit_packages"
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "credit_packages_delete_admin"
ON "credit_packages"
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ==================== daily_cost_summary ====================
-- Only admins can view/manage daily summaries
CREATE POLICY "daily_cost_summary_admin_only"
ON "daily_cost_summary"
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==================== monthly_cost_summary ====================
-- Only admins can view/manage monthly summaries
CREATE POLICY "monthly_cost_summary_admin_only"
ON "monthly_cost_summary"
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- =============================================================================
-- VERIFICATION QUERIES (commented out - for manual testing)
-- =============================================================================

-- Test 1: Verify RLS is enabled
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN (
--   'user_credits', 'credit_transactions', 'user_costs', 'user_subscriptions',
--   'cost_tracking_events', 'episode_costs', 'episode_generation_attempts',
--   'email_bounces', 'cost_pricing_config', 'system_settings', 'credit_packages',
--   'daily_cost_summary', 'monthly_cost_summary'
-- );

-- Test 2: Count policies created
-- SELECT COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN (
--   'user_credits', 'credit_transactions', 'user_costs', 'user_subscriptions',
--   'cost_tracking_events', 'episode_costs', 'episode_generation_attempts',
--   'email_bounces', 'cost_pricing_config', 'system_settings', 'credit_packages',
--   'daily_cost_summary', 'monthly_cost_summary'
-- );

-- Expected: 13 tables with rowsecurity = true, ~50 policies created

-- =============================================================================
-- ROLLBACK (if needed)
-- =============================================================================
-- DROP POLICY IF EXISTS "service_role_all_user_credits" ON "user_credits";
-- ... (repeat for all policies)
-- ALTER TABLE "user_credits" DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)
-- DROP FUNCTION IF EXISTS public.is_admin();
