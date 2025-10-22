'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { unsubscribeByToken } from '@/lib/actions/unsubscribe-actions';
import { unsubscribeFromPodcastByToken } from '@/lib/actions/subscription-management-actions';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const podcastId = searchParams.get('podcast');

  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('Missing unsubscribe token');
      return;
    }

    const unsubscribe = async () => {
      // If podcast ID provided, unsubscribe from specific podcast only
      if (podcastId) {
        const result = await unsubscribeFromPodcastByToken(token, podcastId);

        if (result.success) {
          setState('success');
          setMessage(`You've been unsubscribed from ${result.podcastTitle || 'this podcast'}`);
        } else {
          setState('error');
          setErrorMessage(result.error || 'Failed to unsubscribe from podcast');
        }
      } else {
        // Global unsubscribe (all notifications)
        const result = await unsubscribeByToken(token);

        if (result.success) {
          setState('success');
          setMessage(`${result.email || 'You'} will no longer receive email notifications from Podcasto`);
        } else {
          setState('error');
          setErrorMessage(result.error || 'Failed to unsubscribe');
        }
      }
    };

    unsubscribe();
  }, [token, podcastId]);

  return (
    <div className="container max-w-2xl py-20">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Unsubscribe from Podcasto Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {state === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Processing your request...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <div>
                <h3 className="text-xl font-semibold">Successfully Unsubscribed</h3>
                <p className="text-muted-foreground mt-2">
                  {message}
                </p>
                {podcastId && (
                  <p className="text-sm text-muted-foreground mt-4">
                    You can still manage your other podcast subscriptions or re-enable notifications anytime.
                  </p>
                )}
              </div>
              <div className="flex gap-4 justify-center pt-4">
                <Button asChild variant="outline">
                  <Link href="/">Go to Homepage</Link>
                </Button>
                <Button asChild>
                  <Link href="/settings/notifications">Manage Subscriptions</Link>
                </Button>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center py-8 space-y-4">
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
              <div>
                <h3 className="text-xl font-semibold">Unsubscribe Failed</h3>
                <p className="text-muted-foreground mt-2">
                  {errorMessage}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  The unsubscribe link may be invalid or expired.
                </p>
              </div>
              <div className="flex gap-4 justify-center pt-4">
                <Button asChild variant="outline">
                  <Link href="/">Go to Homepage</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/login">Log in to manage settings</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl py-20">
        <Card>
          <CardContent className="py-20">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
