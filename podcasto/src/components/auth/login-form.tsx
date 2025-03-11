'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthInput } from './auth-input';
import { AuthButton } from './auth-button';
import { AuthAlert } from './auth-alert';
import { AuthDivider } from './auth-divider';
import { SocialButton } from './social-button';
import { signInWithPassword, signInWithGoogle } from '@/lib/actions/auth-actions';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signInWithPassword(email, password);
      
      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'An error occurred during login');
        return;
      }
      
      // Refresh the page to reflect the new authentication state
      // and redirect to the requested page
      router.push(redirectPath);
    } catch (_error) {
      console.error('Error in handleEmailLogin:', _error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use server action for Google sign in
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'An error occurred during Google login');
        return;
      }
      
      // Redirect to the URL returned by the server action
      if (data?.url) {
        // Add the redirect path to the URL if it exists
        const url = new URL(data.url);
        if (redirectPath !== '/') {
          url.searchParams.set('redirect', redirectPath);
        }
        window.location.href = url.toString();
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