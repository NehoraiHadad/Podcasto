/**
 * Shared types for subscription actions
 *
 * This module contains type definitions used across subscription action modules.
 * Authentication is now handled by the centralized SessionService from @/lib/auth.
 */

export interface SubscriptionParams {
  podcastId: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface SubscriptionActionResult extends ActionResult {
  isSubscribed?: boolean;
}

export interface EmailNotificationResult extends ActionResult {
  enabled?: boolean;
}
