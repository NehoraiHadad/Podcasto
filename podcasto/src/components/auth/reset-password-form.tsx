'use client';

import { useState } from 'react';
import { AuthInput } from './auth-input';
import { AuthButton } from './auth-button';
import { AuthAlert } from './auth-alert';
import Link from 'next/link';
import { resetPassword } from '@/lib/actions/auth-password-actions';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : 'An error occurred while sending the reset password email');
        return;
      }
      
      setSuccess('Password reset instructions have been sent to your email');
    } catch (_error) {
      console.error('Error in handleResetPassword:', _error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <AuthAlert type="error" message={error} />}
      {success && <AuthAlert type="success" message={success} />}

      <form onSubmit={handleResetPassword} className="space-y-4">
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

        <AuthButton 
          type="submit" 
          isLoading={isLoading}
          disabled={!!success}
        >
          Send Reset Instructions
        </AuthButton>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Remember your password?{' '}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
} 