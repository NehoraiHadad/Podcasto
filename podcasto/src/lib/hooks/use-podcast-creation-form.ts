import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormValues, formSchema } from '@/components/admin/podcast-creation-form/types';
import { createPodcast } from '@/lib/actions/podcast-actions';

type PodcastCreationFormProps = {
  onSuccess: () => void;
  onError: (error: string) => void;
  onSubmitStart: () => void;
  onSubmitEnd: () => void;
};

export function usePodcastCreationForm({
  onSuccess,
  onError,
  onSubmitStart,
  onSubmitEnd
}: PodcastCreationFormProps) {
  const [incompleteTabsMessage, setIncompleteTabsMessage] = useState<string>('');
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentSource: 'telegram',
      telegramChannel: '',
      telegramHours: 24,
      urls: ['', '', '', '', ''],
      title: '',
      creator: '',
      description: '',
      podcastName: '',
      outputLanguage: 'english',
      creativityLevel: 0.7,
      isLongPodcast: false,
      discussionRounds: 5,
      minCharsPerRound: 500,
      conversationStyle: 'engaging',
      speaker1Role: 'host',
      speaker2Role: 'expert',
      mixingTechniques: ['rhetorical-questions', 'personal-anecdotes'],
      additionalInstructions: '',
    },
    mode: 'onChange', // Enable real-time validation
  });
  
  // Check which tabs are incomplete - wrapped in useCallback
  const checkIncompleteTabs = useCallback(() => {
    const formValues = form.getValues();
    const incompleteTabs: string[] = [];

    // Content Source validation
    if (formValues.contentSource === 'telegram' && (!formValues.telegramChannel || !formValues.telegramHours)) {
      incompleteTabs.push('Content Source');
    } else if (formValues.contentSource === 'urls' && (!formValues.urls || !formValues.urls.some(url => url))) {
      incompleteTabs.push('Content Source');
    }

    // Metadata validation
    if (!formValues.title || !formValues.creator || !formValues.description) {
      incompleteTabs.push('Metadata');
    }

    // Basic Settings validation
    if (!formValues.podcastName || !formValues.outputLanguage) {
      incompleteTabs.push('Basic Settings');
    }

    // Style & Roles validation
    if (!formValues.conversationStyle || !formValues.speaker1Role || !formValues.speaker2Role || 
        !formValues.mixingTechniques || formValues.mixingTechniques.length === 0) {
      incompleteTabs.push('Style & Roles');
    }

    if (incompleteTabs.length > 0) {
      setIncompleteTabsMessage(`Please complete the following tabs: ${incompleteTabs.join(', ')}`);
    } else {
      setIncompleteTabsMessage('');
    }

    return incompleteTabs.length === 0;
  }, [form]);

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data: FormValues) => {
    // First check if all required fields are filled
    if (!checkIncompleteTabs()) {
      return;
    }

    onSubmitStart();
    
    try {
      // Filter out empty URL fields
      if (data.urls) {
        data.urls = data.urls.filter(url => url && url.trim() !== '');
      }
      
      // Call the server action to create the podcast
      const result = await createPodcast(data);
      
      if (result.error) {
        onError(result.error);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating podcast:', error);
      onError('Failed to create podcast. Please try again.');
    } finally {
      onSubmitEnd();
    }
  });

  // Effect to check incomplete tabs when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      checkIncompleteTabs();
      // Trigger validation on every change
      form.trigger();
    });
    return () => subscription.unsubscribe();
  }, [form.watch, checkIncompleteTabs, form]);

  return {
    form,
    incompleteTabsMessage,
    handleSubmit
  };
} 