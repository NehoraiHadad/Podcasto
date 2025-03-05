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

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { signUp, signInWithGoogle } = useAuthContext();
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp({ email, password });
      
      if (error) {
        setErrorMessage(typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'An error occurred during registration');
        return;
      }
      
      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        setSuccessMessage('Verification email sent. Please check your inbox.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setErrorMessage(typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'An error occurred during Google sign up');
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && <AuthAlert type="error" message={errorMessage} />}
      {successMessage && <AuthAlert type="success" message={successMessage} />}

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
          disabled={isLoading}
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
          disabled={isLoading}
          autoComplete="new-password"
          hint="Password must be at least 8 characters"
        />

        <AuthInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="new-password"
        />

        <AuthButton 
          type="submit" 
          isLoading={isLoading}
        >
          Register
        </AuthButton>
      </form>

      <AuthDivider text="or continue with" />

      <SocialButton
        provider="google"
        onClick={handleGoogleSignUp}
        isLoading={isLoading}
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