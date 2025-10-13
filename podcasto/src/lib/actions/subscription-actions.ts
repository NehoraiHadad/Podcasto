/**
 * DEPRECATED: This file is maintained for backward compatibility.
 * Please import from '@/lib/actions/subscription' instead.
 *
 * This file re-exports all subscription actions from the new modular structure.
 *
 * Old structure (229 lines):
 * - All functions in one file
 * - Mixed concerns (subscriptions + email preferences)
 *
 * New structure (5 files, each < 120 lines):
 * - subscription/shared.ts: Shared types and utilities
 * - subscription/check-actions.ts: Subscription status checking
 * - subscription/toggle-actions.ts: Subscription toggling
 * - subscription/email-preferences-actions.ts: Email notification preferences
 * - subscription/index.ts: Consolidated exports
 *
 * @deprecated Import from '@/lib/actions/subscription' for better maintainability
 *
 * Note: This file does not have "use server" at the top because it only re-exports.
 * The actual server actions already have "use server" in their respective modules.
 */

export {
  isUserSubscribed,
  toggleSubscription,
  updateEmailNotificationPreference,
  toggleEmailNotifications
} from './subscription';

export type {
  SubscriptionParams
} from './subscription';
