'use client';

import { useCallback, useState } from 'react';
import { signInWithGoogle } from '@/lib/actions/auth-actions';

export type GoogleAuthResult = Awaited<ReturnType<typeof signInWithGoogle>>;

export type UseGoogleAuthOptions = {
  redirectPath?: string | null;
  onSuccess?: (result: GoogleAuthResult) => void;
  onError?: (message: string, result?: GoogleAuthResult) => void;
};

export type UseGoogleAuthReturn = {
  signIn: () => Promise<GoogleAuthResult | undefined>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
};

function normalizeRedirectPath(redirectPath?: string | null) {
  if (!redirectPath || redirectPath === '/') {
    return undefined;
  }

  return redirectPath;
}

export function useGoogleAuth(options: UseGoogleAuthOptions = {}): UseGoogleAuthReturn {
  const { redirectPath, onSuccess, onError } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    resetError();

    try {
      const normalizedRedirect = normalizeRedirectPath(redirectPath);
      const result = await signInWithGoogle(normalizedRedirect);

      if (!result.success) {
        const message =
          result.errors?.[0]?.message ??
          result.error ??
          'An error occurred during Google sign in';

        setError(message);
        onError?.(message, result);
        return result;
      }

      const url = result.data?.url;

      if (!url) {
        const message = 'Failed to get authentication URL';
        const failureResult: GoogleAuthResult = { success: false, error: message };
        setError(message);
        onError?.(message, failureResult);
        return failureResult;
      }

      onSuccess?.(result);
      window.location.href = url;

      return result;
    } catch (_error) {
      console.error('Error during Google sign in:', _error);
      const message = 'An unexpected error occurred. Please try again.';
      const failureResult: GoogleAuthResult = { success: false, error: message };
      setError(message);
      onError?.(message, failureResult);
      return failureResult;
    } finally {
      setIsLoading(false);
    }
  }, [onError, onSuccess, redirectPath, resetError]);

  return {
    signIn,
    isLoading,
    error,
    resetError,
  };
}
