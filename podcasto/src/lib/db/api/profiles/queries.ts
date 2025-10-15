import { profiles } from '../../schema';
import { eq } from 'drizzle-orm';
import * as dbUtils from '../../utils';
import type { Profile } from './types';

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
