/**
 * Subscription actions module
 *
 * This module handles all subscription-related actions:
 * - Checking subscription status
 * - Toggling podcast subscriptions
 * - Managing email notification preferences
 *
 * @module subscription
 */

// Export types
export type {
  SubscriptionParams,
  ActionResult,
  SubscriptionActionResult,
  EmailNotificationResult
} from './shared';

// Export subscription check actions
export { isUserSubscribed } from './check-actions';

// Export subscription toggle actions
export { toggleSubscription } from './toggle-actions';

// Export email preference actions
export {
  updateEmailNotificationPreference,
  toggleEmailNotifications
} from './email-preferences-actions';
