'use server';

import { revalidatePath } from 'next/cache';
import { profilesApi } from '@/lib/db/api';
import { getUser } from '@/lib/auth';
import type { EmailNotificationResult } from './shared';

/**
 * Simple toggle for email notifications (for settings page)
 *
 * Gets the current preference and toggles it.
 * Does not require form data.
 *
 * @returns Action result with success status and new enabled state
 *
 * @example
 * const result = await updateEmailNotificationPreference();
 * if (result.success) {
 *   console.log('Notifications are now:', result.enabled ? 'enabled' : 'disabled');
 * }
 */
export async function updateEmailNotificationPreference(): Promise<EmailNotificationResult> {
  try {
    const user = await getUser();

    if (!user) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }

    // Get current preference
    const currentProfile = await profilesApi.getProfileById(user.id);
    const currentEnabled = currentProfile?.email_notifications ?? true;
    const newEnabled = !currentEnabled;

    // Update preference
    await profilesApi.updateEmailNotifications(user.id, newEnabled);

    revalidatePath('/settings');
    revalidatePath('/profile');

    return {
      success: true,
      message: newEnabled
        ? 'Email notifications enabled'
        : 'Email notifications disabled',
      enabled: newEnabled
    };
  } catch (error) {
    console.error('Error updating email notification preference:', error);
    return {
      success: false,
      message: 'Failed to update preference'
    };
  }
}

/**
 * Toggle email notifications with explicit enabled value from form data
 *
 * Sets email notifications to the specified state.
 * Used with forms that have an explicit enabled/disabled choice.
 *
 * @param prevState - Previous action state (for useActionState)
 * @param formData - Form data containing 'enabled' boolean as string
 * @returns Action result with success status, message, and enabled state
 *
 * @example
 * // In a component:
 * const [state, formAction] = useActionState(toggleEmailNotifications, null);
 * <form action={formAction}>
 *   <input type="hidden" name="enabled" value="true" />
 *   <button type="submit">Enable Notifications</button>
 * </form>
 */
export async function toggleEmailNotifications(
  prevState: { success: boolean; message: string } | null,
  formData: FormData
): Promise<EmailNotificationResult> {
  try {
    const user = await getUser();

    if (!user) {
      return {
        success: false,
        message: 'You need to be logged in to update preferences'
      };
    }

    const enabled = formData.get('enabled') === 'true';

    // Update email notifications preference
    const updatedProfile = await profilesApi.updateEmailNotifications(user.id, enabled);

    if (!updatedProfile) {
      return {
        success: false,
        message: 'Failed to update email notification preferences'
      };
    }

    revalidatePath('/settings');
    revalidatePath('/profile');

    return {
      success: true,
      message: enabled
        ? 'You will now receive email notifications for new episodes'
        : 'Email notifications have been disabled',
      enabled
    };
  } catch (error) {
    console.error('Error toggling email notifications:', error);
    return {
      success: false,
      message: 'An error occurred while updating your preferences'
    };
  }
}
