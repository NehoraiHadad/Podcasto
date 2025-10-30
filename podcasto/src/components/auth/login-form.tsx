'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthInput } from './auth-input';
import { AuthButton } from './auth-button';
import { AuthAlert } from './auth-alert';
import { AuthDivider } from './auth-divider';
import { SocialButton } from './social-button';
import { useGoogleAuth } from './use-google-auth';
import { signInWithPassword } from '@/lib/actions/auth-actions';

export function LoginForm() {
  return (
    <Suspense fallback={<div className="space-y-4">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const {
    signIn: signInWithGoogle,
    isLoading: isGoogleLoading,
    resetError: resetGoogleError,
  } = useGoogleAuth({
    redirectPath,
    onSuccess: () => setFormError(null),
    onError: (message) => setFormError(message),
  });

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setFormError(null);
    resetGoogleError();

    try {
      const result = await signInWithPassword(email, password);

      if (!result.success) {
        const message =
          result.errors?.[0]?.message ??
          result.error ??
          'An error occurred during login';
        setFormError(message);
        return;
      }

      router.push(redirectPath);
    } catch (_error) {
      console.error('Error in handleEmailLogin:', _error);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    await signInWithGoogle();
  };

  const isLoading = isEmailLoading || isGoogleLoading;

  return (
    <div className="space-y-4">
      {formError && <AuthAlert type="error" message={formError} />}
      {redirectPath !== '/' && (
        <AuthAlert
          type="info"
          message={`You'll be redirected to ${redirectPath} after login.`}
        />
      )}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={isLoading}
          autoComplete="email"
        />

        <div className="space-y-1">
          <AuthInput
            id="password"
            name="password"
            type="password"
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              href="/auth/reset-password"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <AuthButton
          type="submit"
          isLoading={isLoading}
        >
          Sign In
        </AuthButton>
      </form>

      <AuthDivider text="or continue with" />

      <SocialButton
        provider="google"
        onClick={handleGoogleLogin}
        isLoading={isLoading}
      />

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
}
