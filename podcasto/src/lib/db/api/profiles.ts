import { profiles } from '../schema';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as dbUtils from '../utils';

// ============================================================================
// Types
// ============================================================================

/**
 * Profile model - represents a profiles record from the database
 */
export type Profile = InferSelectModel<typeof profiles>;

/**
 * New profile data for insertion
 */
export type NewProfile = InferInsertModel<typeof profiles>;

/**
 * Partial profile data for updates
 */
export type UpdateProfile = Partial<NewProfile>;

// ============================================================================
// Read Operations (Queries)
// ============================================================================

/**
 * Get profile by user ID
 *
 * @param userId - User ID (UUID)
 * @returns The profile if found, null otherwise
 *
 * @example
 * ```typescript
 * const profile = await getProfileById('user-123');
 * if (profile) {
 *   console.log(profile.email_notifications);
 * }
 * ```
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  return await dbUtils.findById<Profile>(profiles, profiles.id, userId);
}

/**
 * Get profile by unsubscribe token
 *
 * @param token - Unsubscribe token
 * @returns The profile if found, null otherwise
 *
 * @example
 * ```typescript
 * const profile = await getProfileByUnsubscribeToken('token-abc-123');
 * if (profile) {
 *   await updateEmailNotifications(profile.id, false);
 * }
 * ```
 */
export async function getProfileByUnsubscribeToken(token: string): Promise<Profile | null> {
  return await dbUtils.findBy<Profile>(
    profiles,
    eq(profiles.unsubscribe_token, token)
  ).then(results => results[0] || null);
}

/**
 * Get all profiles with email notifications enabled
 *
 * @returns Array of profiles with email notifications enabled
 *
 * @example
 * ```typescript
 * const enabledProfiles = await getProfilesWithEmailNotifications();
 * console.log(`${enabledProfiles.length} users have notifications enabled`);
 * ```
 */
export async function getProfilesWithEmailNotifications(): Promise<Profile[]> {
  return await dbUtils.findBy<Profile>(
    profiles,
    eq(profiles.email_notifications, true)
  );
}

/**
 * Get total count of profiles
 *
 * @returns The total number of profiles
 *
 * @example
 * ```typescript
 * const total = await getProfileCount();
 * console.log(`Total profiles: ${total}`);
 * ```
 */
export async function getProfileCount(): Promise<number> {
  return await dbUtils.count(profiles);
}

/**
 * Check if a user has email notifications enabled
 *
 * @param userId - User ID
 * @returns true if email notifications are enabled, false otherwise
 *
 * @example
 * ```typescript
 * const canSendEmail = await hasEmailNotificationsEnabled('user-123');
 * if (canSendEmail) {
 *   await sendEpisodeNotification(userId, episodeId);
 * }
 * ```
 */
export async function hasEmailNotificationsEnabled(userId: string): Promise<boolean> {
  const profile = await getProfileById(userId);
  return profile?.email_notifications ?? false;
}

// ============================================================================
// Write Operations (Mutations)
// ============================================================================

/**
 * Create a new profile
 *
 * @param data - Profile data to insert
 * @returns The created profile
 *
 * @example
 * ```typescript
 * const profile = await createProfile({
 *   id: 'user-123',
 *   email_notifications: true
 * });
 * ```
 */
export async function createProfile(data: NewProfile): Promise<Profile> {
  return await dbUtils.create<Profile, NewProfile>(profiles, data);
}

/**
 * Update a profile
 *
 * @param userId - User ID
 * @param data - Partial profile data to update
 * @returns The updated profile if found, null otherwise
 *
 * @example
 * ```typescript
 * const updated = await updateProfile('user-123', {
 *   email_notifications: false
 * });
 * ```
 */
export async function updateProfile(userId: string, data: UpdateProfile): Promise<Profile | null> {
  return await dbUtils.updateById<Profile, NewProfile>(
    profiles,
    profiles.id,
    userId,
    data
  );
}

/**
 * Update email notification preference for a user
 *
 * @param userId - User ID
 * @param enabled - Whether to enable or disable email notifications
 * @returns The updated profile if found, null otherwise
 *
 * @example
 * ```typescript
 * await updateEmailNotifications('user-123', false);
 * ```
 */
export async function updateEmailNotifications(
  userId: string,
  enabled: boolean
): Promise<Profile | null> {
  return await updateProfile(userId, {
    email_notifications: enabled,
    updated_at: new Date()
  });
}

/**
 * Update unsubscribe token for a user
 *
 * @param userId - User ID
 * @param token - New unsubscribe token
 * @returns The updated profile if found, null otherwise
 *
 * @example
 * ```typescript
 * const newToken = crypto.randomUUID();
 * await updateUnsubscribeToken('user-123', newToken);
 * ```
 */
export async function updateUnsubscribeToken(
  userId: string,
  token: string
): Promise<Profile | null> {
  return await updateProfile(userId, {
    unsubscribe_token: token,
    updated_at: new Date()
  });
}
