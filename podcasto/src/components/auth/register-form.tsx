'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthInput } from './auth-input';
import { AuthButton } from './auth-button';
import { AuthAlert } from './auth-alert';
import { AuthDivider } from './auth-divider';
import { SocialButton } from './social-button';
import { signUpWithPassword, signInWithGoogle } from '@/lib/actions/auth-actions';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await signUpWithPassword(email, password);
      
      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'An error occurred during registration');
        return;
      }
      
      // Check if email confirmation is required
      if (data?.user && !data.user.email_confirmed_at) {
        setSuccess('Registration successful! Please check your email to confirm your account.');
      } else {
        // If no email confirmation is required, refresh the page
        router.refresh();
      }
    } catch (_error) {
      console.error('Error in handleRegister:', _error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'An error occurred during Google sign in');
        return;
      }
      
      // Redirect to the URL returned by the server action
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to get authentication URL');
      }
    } catch (_error) {
      console.error('Error in handleGoogleLogin:', _error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <AuthAlert type="error" message={error} />}
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