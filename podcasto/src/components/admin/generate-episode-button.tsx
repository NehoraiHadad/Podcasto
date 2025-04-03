'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generatePodcastEpisode } from '@/lib/actions/podcast/generate';

interface GenerateEpisodeButtonProps {
  podcastId: string;
}

export function GenerateEpisodeButton({ podcastId }: GenerateEpisodeButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateEpisode = async () => {
    try {
      setIsGenerating(true);
      const result = await generatePodcastEpisode(podcastId);
      
      if (result.success) {
        toast.success('Episode generation started');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to generate episode');
      }
    } catch (error) {
      console.error('Error generating episode:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleGenerateEpisode} disabled={isGenerating} className="gap-1">
      <PlusCircle className="h-4 w-4" />
      {isGenerating ? 'Generating...' : 'Generate Episode Now'}
    </Button>
  );
} 