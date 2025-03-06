import { isUserSubscribed } from '@/lib/actions/subscription-actions';
import { SubscribeForm } from './subscribe-form';

interface SubscribeButtonServerProps {
  podcastId: string;
}

export async function SubscribeButtonServer({ podcastId }: SubscribeButtonServerProps) {
  // Check subscription status server-side
  const isSubscribed = await isUserSubscribed({ podcastId });
  
  return (
    <SubscribeForm 
      podcastId={podcastId} 
      initialIsSubscribed={isSubscribed}
    />
  );
} 