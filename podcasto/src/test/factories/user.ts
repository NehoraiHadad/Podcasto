import type { User } from '@/lib/auth';

const DEFAULT_AUDIENCE = 'authenticated';
const DEFAULT_ROLE = 'authenticated';

function createBaseUser(overrides: Partial<User> = {}): User {
  const timestamp = new Date().toISOString();

  return {
    id: overrides.id ?? 'user-id',
    aud: overrides.aud ?? DEFAULT_AUDIENCE,
    role: overrides.role ?? DEFAULT_ROLE,
    app_metadata: overrides.app_metadata ?? {},
    user_metadata: overrides.user_metadata ?? {},
    created_at: overrides.created_at ?? timestamp,
    confirmation_sent_at: overrides.confirmation_sent_at,
    recovery_sent_at: overrides.recovery_sent_at,
    email_change_sent_at: overrides.email_change_sent_at,
    new_email: overrides.new_email,
    new_phone: overrides.new_phone,
    invited_at: overrides.invited_at,
    action_link: overrides.action_link,
    email: overrides.email,
    phone: overrides.phone,
    confirmed_at: overrides.confirmed_at,
    email_confirmed_at: overrides.email_confirmed_at,
    phone_confirmed_at: overrides.phone_confirmed_at,
    last_sign_in_at: overrides.last_sign_in_at,
    updated_at: overrides.updated_at,
    identities: overrides.identities ?? [],
    is_anonymous: overrides.is_anonymous,
    is_sso_user: overrides.is_sso_user,
    factors: overrides.factors ?? [],
    deleted_at: overrides.deleted_at,
  } satisfies User;
}

/**
 * Creates a fully typed Supabase user for tests.
 */
export function createSupabaseUser(overrides: Partial<User> = {}): User {
  return createBaseUser(overrides);
}

/**
 * Convenience helper for building admin users in tests.
 */
export function createAdminUser(overrides: Partial<User> = {}): User {
  return createBaseUser({
    ...overrides,
    role: overrides.role ?? 'admin',
  });
}
