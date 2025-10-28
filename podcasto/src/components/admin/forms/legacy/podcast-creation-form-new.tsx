'use client';

import { useRouter } from 'next/navigation';
import { PodcastFormBase } from '../../podcast-form/podcast-form-base';

/**
 * New podcast creation form using the unified form architecture
 */
export function PodcastCreationForm() {
  const router = useRouter();
  
  return (
    <PodcastFormBase 
      mode="create" 
      onSuccess={() => router.push('/admin/podcasts')}
    />
  );
} 