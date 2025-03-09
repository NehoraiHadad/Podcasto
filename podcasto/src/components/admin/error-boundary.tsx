'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: (Error & { digest?: string }) | null;
  hasError: boolean;
}

/**
 * Client component for handling errors in the admin section
 * This follows Next.js 15 error handling patterns
 */
export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error & { digest?: string }): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Admin UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h2>
          <p className="text-red-600 mb-6 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred in the admin interface.'}
          </p>
          {this.state.error?.digest && (
            <p className="text-xs text-red-500 mb-4">
              Error ID: {this.state.error.digest}
            </p>
          )}
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/admin'}
            >
              Go to Dashboard
            </Button>
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 