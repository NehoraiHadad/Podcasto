'use server';

import { revalidatePath } from 'next/cache';
import { getUser, createServerClient } from '@/lib/auth';
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

    const supabase = await createServerClient();

    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email_notifications')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching current email notifications preference:', profileError);
      return {
        success: false,
        message: 'Failed to load current preferences'
      };
    }

    const currentEnabled = currentProfile?.email_notifications ?? true;
    const newEnabled = !currentEnabled;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_notifications: newEnabled })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating email notification preference:', updateError);
      return {
        success: false,
        message: 'Failed to update preference'
      };
    }

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

    const supabase = await createServerClient();

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_notifications: enabled })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating email notification preference:', updateError);
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
