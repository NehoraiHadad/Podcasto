'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import { usePodcastCreationForm } from '@/lib/hooks/use-podcast-creation-form';
import { PodcastFormTabs } from './podcast-form-tabs';

export function PodcastCreationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    form,
    incompleteTabsMessage,
    handleSubmit
  } = usePodcastCreationForm({
    onSuccess: () => {
      toast.success('Podcast created successfully!');
      router.push('/admin/podcasts');
    },
    onError: (error) => {
      if (error.includes('permission')) {
        toast.error('You do not have permission to create podcasts. Please login as admin.');
      } else if (error.includes('logged in')) {
        toast.error('Please login to create a podcast.');
      } else {
        toast.error(`Error: ${error}`);
      }
    },
    onSubmitStart: () => setIsSubmitting(true),
    onSubmitEnd: () => setIsSubmitting(false)
  });
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <PodcastFormTabs form={form} />
        
        {incompleteTabsMessage && (
          <div className="text-red-500 text-sm mt-2 mb-4">
            {incompleteTabsMessage}
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Podcast'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 