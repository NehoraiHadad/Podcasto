'use client';

import { useRouter } from 'next/navigation';
import { PodcastFormBase } from './podcast-form/podcast-form-base';
import type { Podcast } from '@/lib/db/api';

interface PodcastEditFormProps {
  podcast: Podcast;
}

export function PodcastEditForm({ podcast }: PodcastEditFormProps) {
  const router = useRouter();
  
  return (
    <PodcastFormBase 
      mode="edit" 
      podcast={podcast} 
      onSuccess={() => router.refresh()}
    />
  );
} 