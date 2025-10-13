# Authentication Error Handling - Usage Examples

This document provides practical examples of using the new unified error handling system.

## Basic Error Handling Pattern

### Example 1: Simple Sign-In Action

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import {
  handleSupabaseAuthError,
  authErrorToResult,
  logAuthError,
  type AuthResult,
  type User,
} from '@/lib/auth';

/**
 * Sign in with email and password
 * Returns standardized AuthResult with security-conscious error messages
 */
export async function signInAction(
  email: string,
  password: string
): Promise<AuthResult<User>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle Supabase errors
    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, {
        action: 'signIn',
        email, // OK to log email (not sensitive)
        // password never logged - automatically filtered
      });
      return authErrorToResult(authError);
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          message: 'Sign in failed. Please try again.',
          code: 'internal_error',
        },
      };
    }

    return {
      success: true,
      data: data.user,
    };
  } catch (error) {
    // Handle unexpected errors
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'signIn', unexpected: true });
    return authErrorToResult(authError);
  }
}
```

### Example 2: Sign-Up with Validation

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import {
  handleSupabaseAuthError,
  authErrorToResult,
  logAuthError,
  AUTH_ERROR_CODES,
  AuthenticationError,
  type AuthResult,
  type User,
} from '@/lib/auth';

/**
 * Sign up with email and password
 * Includes client-side validation before API call
 */
export async function signUpAction(
  email: string,
  password: string
): Promise<AuthResult<User>> {
  try {
    // Server-side validation (never trust client)
    if (!email || !password) {
      const error = new AuthenticationError(
        AUTH_ERROR_CODES.MISSING_CREDENTIALS,
        undefined,
        { providedEmail: !!email, providedPassword: false } // Never log password
      );
      logAuthError(error, { action: 'signUp' });
      return authErrorToResult(error);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const error = new AuthenticationError(
        AUTH_ERROR_CODES.INVALID_EMAIL,
        undefined,
        { action: 'signUp' }
      );
      logAuthError(error, { action: 'signUp' });
      return authErrorToResult(error);
    }

    // Password strength validation
    if (password.length < 8) {
      const error = new AuthenticationError(
        AUTH_ERROR_CODES.INVALID_PASSWORD_FORMAT,
        undefined,
        { action: 'signUp', passwordLength: password.length }
      );
      logAuthError(error, { action: 'signUp' });
      return authErrorToResult(error);
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, { action: 'signUp', email });
      return authErrorToResult(authError);
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          message: 'Sign up failed. Please try again.',
          code: 'internal_error',
        },
      };
    }

    return {
      success: true,
      data: data.user,
    };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'signUp', unexpected: true });
    return authErrorToResult(authError);
  }
}
```

### Example 3: Using the Error Wrapper

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { withAuthErrorHandling } from '@/lib/auth';

/**
 * Sign in using the error wrapper utility
 * Automatically handles error conversion and logging
 */
export const signInWithWrapper = withAuthErrorHandling(
  async (email: string, password: string) => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Throwing the error will be automatically caught and converted
    if (error) throw error;

    if (!data.user) {
      throw new Error('No user returned from sign in');
    }

    return data.user;
  }
);
```

## Client-Side Usage

### Example 4: React Component with Error Handling

```typescript
'use client';

import { useState } from 'react';
import { signInAction } from '@/lib/actions/auth-actions';
import { AUTH_ERROR_CODES } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await signInAction(email, password);

    if (!result.success) {
      // Handle specific error codes
      switch (result.error?.code) {
        case AUTH_ERROR_CODES.INVALID_CREDENTIALS:
          setError('Invalid email or password. Please try again.');
          break;
        case AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED:
          setError('Please verify your email address before signing in.');
          break;
        case AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED:
          setError('Too many sign-in attempts. Please try again in a few minutes.');
          break;
        default:
          setError(result.error?.message || 'An error occurred. Please try again.');
      }
      setIsLoading(false);
      return;
    }

    // Success - redirect
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

## Advanced Patterns

### Example 5: Custom Error Types

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import {
  AuthenticationError,
  AUTH_ERROR_CODES,
  logAuthError,
  authErrorToResult,
  type AuthResult,
} from '@/lib/auth';

/**
 * Password reset with custom error handling
 */
export async function requestPasswordReset(
  email: string
): Promise<AuthResult<void>> {
  try {
    // Validate email
    if (!email || !email.includes('@')) {
      const error = new AuthenticationError(
        AUTH_ERROR_CODES.INVALID_EMAIL,
        'Please enter a valid email address',
        { action: 'passwordReset' }
      );
      logAuthError(error);
      return authErrorToResult(error);
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    });

    if (error) {
      // For password reset, don't reveal if email exists
      // Always return success to prevent user enumeration
      logAuthError(
        new AuthenticationError(
          AUTH_ERROR_CODES.INTERNAL_ERROR,
          undefined,
          { originalError: error.message, email }
        ),
        { action: 'passwordReset', securityNote: 'Returning success to prevent enumeration' }
      );
    }

    // Always return success for security
    return {
      success: true,
    };
  } catch (error) {
    // Log but still return success to prevent user enumeration
    logAuthError(
      new AuthenticationError(
        AUTH_ERROR_CODES.INTERNAL_ERROR,
        undefined,
        { originalError: String(error) }
      ),
      { action: 'passwordReset', unexpected: true }
    );

    return {
      success: true, // Still return success
    };
  }
}
```

### Example 6: Session Validation with Errors

```typescript
'use server';

import { redirect } from 'next/navigation';
import {
  SessionService,
  SessionMissingError,
  SessionExpiredError,
  logAuthError,
} from '@/lib/auth';

/**
 * Require authenticated user or redirect
 */
export async function requireAuthenticatedUser() {
  const user = await SessionService.getUser();

  if (!user) {
    const error = new SessionMissingError({
      action: 'requireAuth',
      requestedPath: 'protected-resource',
    });
    logAuthError(error);
    redirect('/auth/login');
  }

  return user;
}

/**
 * Check if session is still valid
 */
export async function validateCurrentSession() {
  const validation = await SessionService.validateSession();

  if (validation.isExpired) {
    const error = new SessionExpiredError({
      action: 'validateSession',
      expiresAt: validation.expiresAt,
    });
    logAuthError(error);
    return {
      success: false,
      error: {
        message: 'Your session has expired. Please sign in again.',
        code: 'session_expired',
      },
    };
  }

  return {
    success: true,
  };
}
```

### Example 7: Error Type Checking

```typescript
'use server';

import {
  handleSupabaseAuthError,
  isAuthenticationError,
  InvalidCredentialsError,
  WeakPasswordError,
  RateLimitError,
  AUTH_ERROR_CODES,
  logAuthError,
} from '@/lib/auth';

export async function handleAuthOperation(operation: () => Promise<void>) {
  try {
    await operation();
    return { success: true };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);

    // Type-safe error handling
    if (authError instanceof InvalidCredentialsError) {
      // Handle invalid credentials specifically
      return {
        success: false,
        error: {
          message: 'Invalid credentials provided',
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          statusCode: 401,
        },
      };
    }

    if (authError instanceof WeakPasswordError) {
      // Handle weak password with reasons
      return {
        success: false,
        error: {
          message: authError.message,
          code: AUTH_ERROR_CODES.WEAK_PASSWORD,
          reasons: authError.reasons,
        },
      };
    }

    if (authError instanceof RateLimitError) {
      // Handle rate limiting
      return {
        success: false,
        error: {
          message: authError.message,
          code: AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          retryAfter: authError.retryAfter,
        },
      };
    }

    // Generic auth error
    if (isAuthenticationError(authError)) {
      logAuthError(authError);
      return {
        success: false,
        error: {
          message: authError.message,
          code: authError.code,
        },
      };
    }

    // Unexpected error
    logAuthError(authError, { unexpected: true });
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: AUTH_ERROR_CODES.INTERNAL_ERROR,
      },
    };
  }
}
```

## Migration Examples

### Before: Old Error Handling

```typescript
// ❌ OLD WAY - Direct error exposure
export async function oldSignIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Exposes Supabase error messages directly
  return { data, error: error ? { message: error.message } : null };
}
```

### After: New Error Handling

```typescript
// ✅ NEW WAY - Security-conscious error handling
export async function newSignIn(email: string, password: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const authError = handleSupabaseAuthError(error);
      logAuthError(authError, { action: 'signIn', email });
      return authErrorToResult(authError);
    }

    return {
      success: true,
      data: data.user,
    };
  } catch (error) {
    const authError = handleSupabaseAuthError(error);
    logAuthError(authError, { action: 'signIn', unexpected: true });
    return authErrorToResult(authError);
  }
}
```

## Security Best Practices

### ✅ DO

1. **Always convert Supabase errors using `handleSupabaseAuthError()`**
2. **Use generic error messages for authentication failures**
3. **Log detailed errors server-side with `logAuthError()`**
4. **Use error codes for programmatic handling, not messages**
5. **Filter sensitive data from context before logging**

### ❌ DON'T

1. **Don't expose user existence** - Use same message for "user not found" and "wrong password"
2. **Don't log passwords or tokens** - They're automatically filtered
3. **Don't trust client-side validation** - Always validate server-side
4. **Don't create custom error messages** - Use `CLIENT_ERROR_MESSAGES`
5. **Don't reveal system details** - Keep errors generic for clients

## Testing Examples

```typescript
import { describe, it, expect } from 'vitest';
import {
  handleSupabaseAuthError,
  AUTH_ERROR_CODES,
  InvalidCredentialsError,
  WeakPasswordError,
} from '@/lib/auth';

describe('Error Handling', () => {
  it('should convert invalid credentials error', () => {
    const supabaseError = new Error('Invalid login credentials');
    const authError = handleSupabaseAuthError(supabaseError);

    expect(authError.code).toBe(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    expect(authError.message).toBe('Invalid email or password. Please try again.');
    expect(authError.statusCode).toBe(401);
  });

  it('should not expose sensitive information', () => {
    const error = new InvalidCredentialsError({
      email: 'user@example.com',
      attemptNumber: 3,
    });

    const json = error.toJSON();

    // Should not contain context
    expect(json).not.toHaveProperty('context');
    expect(json).not.toHaveProperty('email');

    // Should contain safe info
    expect(json.code).toBe(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
    expect(json.message).not.toContain('user@example.com');
  });

  it('should preserve weak password reasons', () => {
    const error = new WeakPasswordError(['too_short', 'no_special_chars']);

    expect(error.reasons).toEqual(['too_short', 'no_special_chars']);
    expect(error.code).toBe(AUTH_ERROR_CODES.WEAK_PASSWORD);
  });
});
```

## Summary

The new error handling system provides:

- ✅ **Security**: Generic, user-friendly error messages
- ✅ **Consistency**: Standardized error codes and formats
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Debuggability**: Detailed server-side logging
- ✅ **Flexibility**: Multiple usage patterns
- ✅ **Maintainability**: Centralized error handling logic

Use these examples as templates for implementing authentication in your features!
