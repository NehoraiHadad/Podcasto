'use client';

import { useState } from 'react';
import { useAuthContext } from '@/lib/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthInput } from './auth-input';
import { AuthButton } from './auth-button';
import { AuthAlert } from './auth-alert';
import { AuthDivider } from './auth-divider';
import { SocialButton } from './social-button';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn, signInWithGoogle } = useAuthContext();
  const _router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn({ email, password });
      
      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'An error occurred during login');
        setIsLoading(false);
        return;
      }
      
      // Redirect is handled by the auth state change in useAuth
    } catch {
      setError('An unexpected error occurred. Please try again.');
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
        setIsLoading(false);
        return;
      }
      
      // Redirect to the URL returned by the server action
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to get authentication URL');
        setIsLoading(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <AuthAlert type="error" message={error} />}

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