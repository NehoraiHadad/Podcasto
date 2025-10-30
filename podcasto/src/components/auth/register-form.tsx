'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthInput } from './auth-input';
import { AuthButton } from './auth-button';
import { AuthAlert } from './auth-alert';
import { AuthDivider } from './auth-divider';
import { SocialButton } from './social-button';
import { useGoogleAuth } from './use-google-auth';
import { signUpWithPassword } from '@/lib/actions/auth-actions';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  const {
    signIn: signInWithGoogle,
    isLoading: isGoogleLoading,
    resetError: resetGoogleError,
  } = useGoogleAuth({
    onSuccess: () => {
      setFormError(null);
      setSuccess(null);
    },
    onError: (message) => {
      setFormError(message);
      setSuccess(null);
    },
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisterLoading(true);
    setFormError(null);
    setSuccess(null);
    resetGoogleError();

    try {
      const result = await signUpWithPassword(email, password);

      if (!result.success) {
        const message =
          result.errors?.[0]?.message ??
          result.error ??
          'An error occurred during registration';
        setFormError(message);
        return;
      }

      if (result.data?.user && !result.data.user.email_confirmed_at) {
        setSuccess('Registration successful! Please check your email to confirm your account.');
      } else {
        router.refresh();
      }
    } catch (_error) {
      console.error('Error in handleRegister:', _error);
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    setSuccess(null);
    await signInWithGoogle();
  };

  const isLoading = isRegisterLoading || isGoogleLoading;

  return (
    <div className="space-y-4">
      {formError && <AuthAlert type="error" message={formError} />}
      {success && <AuthAlert type="success" message={success} />}

      <form onSubmit={handleRegister} className="space-y-4">
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          disabled={isLoading || !!success}
          autoComplete="email"
        />

        <AuthInput
          id="password"
          name="password"
          type="password"
          label="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading || !!success}
          autoComplete="new-password"
        />

        <AuthButton
          type="submit"
          isLoading={isLoading}
          disabled={!!success}
        >
          Sign Up
        </AuthButton>
      </form>

      <AuthDivider text="or continue with" />

      <SocialButton
        provider="google"
        onClick={handleGoogleLogin}
        isLoading={isLoading}
        disabled={!!success}
      />

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
