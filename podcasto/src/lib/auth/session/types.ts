/**
 * Session Module Types
 *
 * Type definitions for session management.
 */

import type { User, Session } from '@supabase/supabase-js';

/**
 * Re-export Supabase types for consistency
 */
export type { User, Session } from '@supabase/supabase-js';

/**
 * Authentication state for the current session
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
}

/**
 * Session validation result
 */
export interface SessionValidation {
  isValid: boolean;
  isExpired: boolean;
  expiresAt: number | null;
  expiresIn: number | null;
}

/**
 * Session refresh options
 */
export interface RefreshSessionOptions {
  forceRefresh?: boolean;
}
