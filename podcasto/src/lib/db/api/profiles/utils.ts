import { profiles } from '../../schema';
import * as dbUtils from '../../utils';
import type { Profile, NewProfile, UpdateProfile } from './types';
import { getProfileById } from './queries';

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
