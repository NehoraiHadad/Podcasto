'use server';

import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * Shared types for subscription actions
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

/**
 * Get the currently authenticated user
 * Shared helper to reduce duplication across subscription actions
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting authenticated user:', userError);
      return {
        user: null,
        error: 'Authentication error occurred'
      };
    }

    if (!user) {
      return {
        user: null,
        error: 'Not authenticated'
      };
    }

    return {
      user,
      error: null
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return {
      user: null,
      error: 'Failed to get current user'
    };
  }
}
