'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-800">Something went wrong</h3>
          <p className="text-red-600">{this.state.error?.message || 'An unexpected error occurred'}</p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            variant="outline" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
} 