'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleSubscription } from '@/lib/actions/subscription-actions';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

interface SubscribeFormProps {
  podcastId: string;
  initialIsSubscribed: boolean;
}

// Define the state type to include the optional isSubscribed property
interface SubscriptionState {
  success: boolean;
  message: string;
  isSubscribed?: boolean;
}

// Button with loading state that's used inside the form
function SubmitButton({ isSubscribed }: { isSubscribed: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="submit"
      variant={isSubscribed ? 'outline' : 'default'}
      className="w-full"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isSubscribed ? 'Unsubscribing...' : 'Subscribing...'}
        </>
      ) : isSubscribed ? (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Unsubscribe from Updates
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 mr-2" />
          Subscribe to Updates
        </>
      )}
    </Button>
  );
}

export function SubscribeForm({ podcastId, initialIsSubscribed }: SubscribeFormProps) {
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  
  // Track if this is the initial render
  const isInitialMount = useRef(true);
  
  // Track the last state that triggered a notification to prevent duplicates
  const lastNotifiedStateRef = useRef<string | null>(null);
  
  // Initialize form state with server action using useActionState instead of useFormState
  const initialState: SubscriptionState = { success: true, message: '' };
  const [state, formAction] = useActionState(toggleSubscription, initialState);
  
  // Handle form submission result
  useEffect(() => {
    // Skip showing toasts on initial render
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (state && state !== initialState) {
      // Create a string representation of the current state to compare with the last notified state
      const stateKey = JSON.stringify(state);
      
      // Only process if this state hasn't been processed before
      if (lastNotifiedStateRef.current !== stateKey) {
        lastNotifiedStateRef.current = stateKey;
        
        if (state.success) {
          // Update local state if the server action was successful
          if (typeof state.isSubscribed === 'boolean') {
            setIsSubscribed(state.isSubscribed);
            
            // Only show toast notifications after user actions, not on initial load
            toast.success(state.isSubscribed ? 'Subscribed Successfully' : 'Unsubscribed', {
              description: state.message,
              id: `subscription-${podcastId}-${Date.now()}`, // Use a unique ID for each toast
            });
          }
        } else {
          // Show error toast
          toast.error('Error', {
            description: state.message,
            id: `subscription-error-${podcastId}-${Date.now()}`, // Use a unique ID for each toast
          });
          
          // Redirect to login if not authenticated
          if (state.message.includes('logged in')) {
            router.push('/auth/login?redirect=' + encodeURIComponent(`/podcasts/${podcastId}`));
          }
        }
      }
    }
  }, [state, initialState, router, podcastId]);
  
  return (
    <form action={formAction}>
      <input type="hidden" name="podcastId" value={podcastId} />
      <SubmitButton isSubscribed={isSubscribed} />
    </form>
  );
} 