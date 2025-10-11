import { profiles } from '../schema';
import { eq } from 'drizzle-orm';
import * as dbUtils from '../utils';

// Types
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type UpdateProfile = Partial<NewProfile>;

/**
 * Returns a profile by user ID
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  return await dbUtils.findById<Profile>(profiles, profiles.id, userId);
}

/**
 * Creates a new profile
 */
export async function createProfile(data: NewProfile): Promise<Profile> {
  return await dbUtils.create<Profile, NewProfile>(profiles, data);
}

/**
 * Updates a profile
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
 * Updates email notification preference for a user
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
 * Returns all profiles with email notifications enabled
 */
export async function getProfilesWithEmailNotifications(): Promise<Profile[]> {
  return await dbUtils.findBy<Profile>(
    profiles,
    eq(profiles.email_notifications, true)
  );
}

/**
 * Checks if a user has email notifications enabled
 */
export async function hasEmailNotificationsEnabled(userId: string): Promise<boolean> {
  const profile = await getProfileById(userId);
  return profile?.email_notifications ?? false;
}

/**
 * Returns the total count of profiles
 */
export async function getProfileCount(): Promise<number> {
  return await dbUtils.count(profiles);
}
