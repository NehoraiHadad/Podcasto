'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { 
  isUserSubscribedClient, 
  subscribeToNewEpisodesClient, 
  unsubscribeFromPodcastClient 
} from '@/lib/api/subscriptions';
import { createBrowserClient } from '@supabase/ssr';

interface SubscribeButtonProps {
  podcastId: string;
}

// Supabase subscription implementation
const useSupabaseSubscription = (podcastId: string) => {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Check if user is subscribed using Supabase
  const checkSubscription = async () => {
    try {
      // Get current session to check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        setIsSubscribed(false);
        return;
      }
      
      const userId = session.user.id;
      const isUserSubscribed = await isUserSubscribedClient({ userId, podcastId });
      
      setIsSubscribed(isUserSubscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  };

  // Toggle subscription status
  const toggleSubscription = async () => {
    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        toast.error('Login Required', {
          description: 'You need to be logged in to subscribe for updates',
        });
        return false;
      }
      
      const userId = session.user.id;
      
      if (isSubscribed) {
        // Unsubscribe using Supabase
        const success = await unsubscribeFromPodcastClient({ userId, podcastId });
        
        if (success) {
          setIsSubscribed(false);
          toast.success('Unsubscribed', {
            description: 'You will no longer receive updates for new episodes',
          });
        } else {
          toast.error('Error', {
            description: 'An error occurred while unsubscribing',
          });
          return false;
        }
      } else {
        // Subscribe using Supabase
        const success = await subscribeToNewEpisodesClient({ userId, podcastId });
        
        if (success) {
          setIsSubscribed(true);
          toast.success('Subscribed Successfully', {
            description: 'You will receive updates when new episodes are released',
          });
        } else {
          toast.error('Error', {
            description: 'An error occurred while subscribing',
          });
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error toggling subscription:', error);
      toast.error('Error', {
        description: 'An error occurred while subscribing',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, [podcastId]);

  return { isSubscribed, isLoading, toggleSubscription };
};

export function SubscribeButton({ podcastId }: SubscribeButtonProps) {
  const router = useRouter();
  const { isSubscribed, isLoading, toggleSubscription } = useSupabaseSubscription(podcastId);

  const handleSubscribe = async () => {
    const success = await toggleSubscription();
    if (!success) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/podcasts/${podcastId}`));
    }
  };

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isLoading || isSubscribed === null}
      variant={isSubscribed ? 'outline' : 'default'}
      className="w-full"
    >
      {isLoading ? (
        'Loading...'
      ) : isSubscribed ? (
        <>
          <BellOff className="w-4 h-4 ml-2" />
          Unsubscribe from Updates
        </>
      ) : (
        <>
          <Bell className="w-4 h-4 ml-2" />
          Subscribe to Updates
        </>
      )}
    </Button>
  );
} 