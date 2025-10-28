ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles select self" ON profiles;
CREATE POLICY "Profiles select self"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles update self" ON profiles;
CREATE POLICY "Profiles update self"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Subscriptions select own" ON subscriptions;
CREATE POLICY "Subscriptions select own"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Subscriptions update own" ON subscriptions;
CREATE POLICY "Subscriptions update own"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Podcasts select own" ON podcasts;
CREATE POLICY "Podcasts select own"
  ON podcasts
  FOR SELECT
  USING (created_by = auth.uid());
