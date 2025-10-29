import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { getUser, isAdmin } from '@/lib/auth';

export type EnsureAdminFailureReason = 'unauthorized' | 'forbidden';

export interface EnsureAdminOptions {
  unauthorizedMessage?: string;
  unauthorizedStatus?: number;
  forbiddenMessage?: string;
  forbiddenStatus?: number;
  /**
   * Prefix or context label that will be included in log statements when access is denied.
   * Defaults to "[EnsureAdmin]".
   */
  logContext?: string;
  /**
   * Optional callback that will be executed whenever an authorization check fails.
   * Can be used for custom logging or metrics.
   */
  onFailure?: (
    reason: EnsureAdminFailureReason,
    context: {
      user: User | null;
    }
  ) => void;
}

export interface EnsureAdminSuccess {
  ok: true;
  user: User;
}

export interface EnsureAdminFailure {
  ok: false;
  response: NextResponse;
  reason: EnsureAdminFailureReason;
}

export type EnsureAdminResult = EnsureAdminSuccess | EnsureAdminFailure;

/**
 * Ensure the current request is authenticated as an administrator.
 * Performs a `getUser()` lookup and verifies the admin role via `isAdmin()`.
 * Returns either a `NextResponse` ready to be returned from the route handler or the authenticated user.
 */
export async function ensureAdmin(options: EnsureAdminOptions = {}): Promise<EnsureAdminResult> {
  const {
    unauthorizedMessage = 'Unauthorized',
    unauthorizedStatus = 401,
    forbiddenMessage = 'Forbidden',
    forbiddenStatus = 403,
    logContext = '[EnsureAdmin]',
    onFailure,
  } = options;

  const user = await getUser();

  if (!user) {
    if (onFailure) {
      onFailure('unauthorized', { user: null });
    }
    console.warn(`${logContext} Admin access denied: no authenticated user`);

    return {
      ok: false,
      reason: 'unauthorized',
      response: NextResponse.json(
        { error: unauthorizedMessage },
        { status: unauthorizedStatus }
      ),
    };
  }

  const hasAdminAccess = await isAdmin(user.id);

  if (!hasAdminAccess) {
    if (onFailure) {
      onFailure('forbidden', { user });
    }
    console.warn(`${logContext} Admin access denied: insufficient privileges`, {
      userId: user.id,
    });

    return {
      ok: false,
      reason: 'forbidden',
      response: NextResponse.json(
        { error: forbiddenMessage },
        { status: forbiddenStatus }
      ),
    };
  }

  return {
    ok: true,
    user,
  };
}
