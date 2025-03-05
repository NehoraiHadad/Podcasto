'use client';

import { useState } from 'react';
import { useAuthContext } from '@/lib/context/auth-context';
import Link from 'next/link';
import { AuthInput } from './auth-input';
import { AuthButton } from './auth-button';
import { AuthAlert } from './auth-alert';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { resetPassword } = useAuthContext();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Password reset instructions have been sent to your email.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <AuthAlert type="error" message={error} />}
      {successMessage && <AuthAlert type="success" message={successMessage} />}

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
          disabled={isLoading}
          autoComplete="email"
        />

        <AuthButton 
          type="submit" 
          isLoading={isLoading}
        >
          Send Reset Instructions
        </AuthButton>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
} 