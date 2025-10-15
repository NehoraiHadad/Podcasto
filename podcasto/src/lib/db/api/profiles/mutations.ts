import { profiles } from '../../schema';
import * as dbUtils from '../../utils';
import type { Profile, NewProfile } from './types';
import { updateProfile } from './utils';

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
