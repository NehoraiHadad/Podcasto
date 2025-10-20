-- Enable RLS on podcast-related tables
-- This migration adds Row Level Security to ensure proper access control

-- Enable RLS on episode_processing_logs
ALTER TABLE "episode_processing_logs" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on podcast_groups
ALTER TABLE "podcast_groups" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on podcast_languages
ALTER TABLE "podcast_languages" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES FOR episode_processing_logs
-- ============================================

-- Allow authenticated users to read all processing logs
CREATE POLICY "episode_processing_logs_select_authenticated"
  ON "episode_processing_logs"
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow anonymous users to read all processing logs (for public error displays)
CREATE POLICY "episode_processing_logs_select_anon"
  ON "episode_processing_logs"
  FOR SELECT
  TO anon
  USING (true);

-- Only admins can insert/update/delete processing logs
-- Note: service_role bypasses RLS, so Lambda functions can still write
CREATE POLICY "episode_processing_logs_admin_all"
  ON "episode_processing_logs"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ============================================
-- POLICIES FOR podcast_groups
-- ============================================

-- Allow everyone to read podcast groups
CREATE POLICY "podcast_groups_select_all"
  ON "podcast_groups"
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can create/update/delete podcast groups
CREATE POLICY "podcast_groups_admin_all"
  ON "podcast_groups"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ============================================
-- POLICIES FOR podcast_languages
-- ============================================

-- Allow everyone to read podcast languages
CREATE POLICY "podcast_languages_select_all"
  ON "podcast_languages"
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only admins can create/update/delete podcast languages
CREATE POLICY "podcast_languages_admin_all"
  ON "podcast_languages"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
