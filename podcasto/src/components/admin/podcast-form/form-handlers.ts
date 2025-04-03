'use client';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PodcastCreationValues, PodcastEditValues } from './types';
import { createPodcast } from '@/lib/actions/podcast/create';
import { updatePodcast } from '@/lib/actions/podcast/update';
import type { Podcast } from '@/lib/db/api';

export interface UseFormHandlersOptions {
  onSuccess?: () => void;
}

export interface FormHandlers {
  handleCreateSubmit: (data: PodcastCreationValues) => Promise<void>;
  handleEditSubmit: (data: PodcastEditValues) => Promise<void>;
}

export function useFormHandlers(podcast?: Podcast, options?: UseFormHandlersOptions): FormHandlers {
  const router = useRouter();
  const { onSuccess } = options || {};

  // Handle creation form submission
  const handleCreateSubmit = async (data: PodcastCreationValues) => {
    console.log("Submit button clicked");
    console.log("Form data:", JSON.stringify(data, null, 2));
    
    // Validate the form data with schema explicitly
    try {
      // Debug form state
      console.log("Form is valid");
      
      // Filter out empty URL fields if present
      if ('urls' in data && data.urls) {
        data.urls = data.urls.filter(url => url && url.trim() !== '');
      }
      
      console.log("Filtered data:", JSON.stringify(data, null, 2));
      
      // Call create podcast action
      console.log("Calling createPodcast API...");
      const result = await createPodcast(data);
      console.log("API result:", result);
      
      if (result.error) {
        console.error("API error:", result.error);
        toast.error(result.error);
      } else {
        toast.success('Podcast created successfully');
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/admin/podcasts');
        }
      }
    } catch (error) {
      console.error('Error in handleCreateSubmit:', error);
      toast.error('An unexpected error occurred while creating the podcast');
    }
  };
  
  // Handle edit form submission
  const handleEditSubmit = async (data: PodcastEditValues) => {
    if (!podcast) return;
    
    try {
      // Clean up empty strings to be null for the database
      const formData = {
        ...data,
        description: data.description || null,
        cover_image: data.cover_image || null,
      };
      
      // Filter out empty URL fields and undefined values
      if ('urls' in formData && formData.urls) {
        formData.urls = formData.urls.filter((url): url is string => url !== undefined && url.trim() !== '') as string[];
      }
      
      console.log("Submitting podcast edit with data:", JSON.stringify(formData, null, 2));
      
      try {
        // Call update podcast action with a try/catch specifically for the action
        const result = await updatePodcast({
          id: podcast.id,
          ...formData,
        } as Parameters<typeof updatePodcast>[0]);
        
        console.log("Update result:", result);
        
        // Add check for null result
        if (!result) {
          console.error('Update failed: Server returned null response');
          toast.error('Update failed: Server returned no response');
          return;
        }
        
        if (result.success) {
          toast.success('Podcast updated successfully');
          if (onSuccess) {
            onSuccess();
          } else {
            router.refresh(); // Refresh the page to show updated data
          }
        } else {
          const errorMessage = result.error || 'Failed to update podcast';
          console.error('Update error:', errorMessage);
          toast.error(errorMessage);
        }
      } catch (actionError) {
        // Handle server action specific errors
        console.error('Server action error:', actionError);
        let actionErrorMessage = 'Server error while updating podcast';
        
        if (actionError instanceof Error) {
          actionErrorMessage += `: ${actionError.message}`;
        }
        
        toast.error(actionErrorMessage);
      }
    } catch (error) {
      console.error('Error updating podcast:', error);
      let errorMessage = 'An unexpected error occurred while updating the podcast';
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  return {
    handleCreateSubmit,
    handleEditSubmit
  };
} 