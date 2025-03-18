'use client';

import { useState, useEffect } from 'react';
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
      } else if (error.includes('Validation error')) {
        toast.error(error);
      } else {
        toast.error(`Error: ${error}`);
      }
    },
    onSubmitStart: () => setIsSubmitting(true),
    onSubmitEnd: () => setIsSubmitting(false)
  });

  // Debug form state
  useEffect(() => {
    const subscription = form.watch(() => {
      console.log('Form State:', {
        isValid: form.formState.isValid,
        errors: form.formState.errors,
        values: form.getValues(),
        isDirty: form.formState.isDirty,
        isSubmitting: form.formState.isSubmitting
      });
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <PodcastFormTabs form={form} />
        
        {incompleteTabsMessage && (
          <div className="text-red-500 text-sm mt-2 mb-4">
            {incompleteTabsMessage}
          </div>
        )}
        
        {/* Debug info */}
        <div className="text-sm text-gray-500">
          <p>Form Valid: {form.formState.isValid ? 'Yes' : 'No'}</p>
          <p>Form Dirty: {form.formState.isDirty ? 'Yes' : 'No'}</p>
          <p>Has Errors: {Object.keys(form.formState.errors).length > 0 ? 'Yes' : 'No'}</p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? 'Creating...' : 'Create Podcast'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 