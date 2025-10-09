'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Form } from '@/components/ui/form';
import type { Podcast } from '@/lib/db/api';
import { 
  PodcastCreationValues, 
  PodcastEditValues, 
  PodcastFormMode,
  podcastCreationSchema,
  podcastEditSchema
} from './types';

// Import components
import { PodcastFormTabs } from './podcast-form-tabs';
import { FormDebugInfo } from './debug/form-debug-info';
import { FormValidationErrors } from './debug/form-validation-errors';
import { FormActionButtons } from './form-action-buttons';
import { DebugModeToggle } from './debug/debug-mode-toggle';
import { useFormHandlers } from './form-handlers';

export interface PodcastFormBaseProps {
  mode: PodcastFormMode;
  podcast?: Podcast;
  onSuccess?: () => void;
}

export function PodcastFormBase({ mode, podcast, onSuccess }: PodcastFormBaseProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incompleteTabsMessage, _setIncompleteTabsMessage] = useState<string>('');
  const [debugMode, setDebugMode] = useState(false);
  
  // Initialize the correct form based on mode
  const creationForm = useForm<PodcastCreationValues>({
    resolver: zodResolver(podcastCreationSchema),
    defaultValues: {
      contentSource: 'telegram',
      telegramChannel: '',
      telegramHours: 24,
      urls: ['', '', '', '', ''],
      title: '',
      creator: '',
      description: '',
      cover_image: 'https://picsum.photos/400/300',
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
      scriptGenerationPrompt: '',
    },
    mode: 'onChange',
  });
  
  // Use all available podcast data for edit form
  const editForm = useForm<PodcastEditValues>({
    resolver: zodResolver(podcastEditSchema),
    defaultValues: {
      title: podcast?.title || '',
      description: podcast?.description || '',
      cover_image: podcast?.cover_image || '',
      
      // Content source settings
      contentSource: podcast?.content_source?.type || 'telegram',
      telegramChannel: podcast?.content_source?.config?.telegramChannel || '',
      telegramHours: podcast?.content_source?.config?.telegramHours || 24,
      urls: podcast?.content_source?.config?.urls || ['', '', '', '', ''],
      
      // Basic settings
      creator: podcast?.creator || '',
      podcastName: podcast?.podcast_name || '',
      outputLanguage: podcast?.output_language || 'english',
      slogan: podcast?.slogan || '',
      creativityLevel: podcast?.creativity_level || 0.7,
      
      // Advanced settings
      isLongPodcast: podcast?.is_long_podcast || false,
      discussionRounds: podcast?.discussion_rounds || 5,
      minCharsPerRound: podcast?.min_chars_per_round || 500,
      episodeFrequency: podcast?.episode_frequency || 7,
      
      // Style and roles
      conversationStyle: (podcast?.conversation_style as "engaging" | "dynamic" | "enthusiastic" | "educational" | "casual" | "professional" | "friendly" | "formal") || 'engaging',
      speaker1Role: (podcast?.speaker1_role as "interviewer" | "host" | "moderator" | "guide") || 'host',
      speaker2Role: (podcast?.speaker2_role as "domain-expert" | "guest" | "expert" | "analyst") || 'expert',
      
      // Mixing techniques
      mixingTechniques: podcast?.mixing_techniques || ['rhetorical-questions', 'personal-anecdotes'],
      additionalInstructions: podcast?.additional_instructions || '',
      scriptGenerationPrompt: podcast?.script_generation_prompt || '',
    },
    mode: 'onChange',
  });
  
  // Get form handlers
  const { handleCreateSubmit, handleEditSubmit } = useFormHandlers(podcast, { onSuccess });
  
  // Wrap handlers to manage loading state
  const onCreateSubmit = async (data: PodcastCreationValues) => {
    setIsSubmitting(true);
    await handleCreateSubmit(data);
    setIsSubmitting(false);
  };
  
  const onEditSubmit = async (data: PodcastEditValues) => {
    setIsSubmitting(true);
    await handleEditSubmit(data);
    setIsSubmitting(false);
  };
  
  // Render the create form
  if (mode === 'create') {
    // Log all form errors for debugging
    console.log("Form errors:", creationForm.formState.errors);
    
    return (
      <Form {...creationForm}>
        <form onSubmit={creationForm.handleSubmit(onCreateSubmit)} className="space-y-8">
          {/* Debug mode toggle */}
          <DebugModeToggle 
            debugMode={debugMode} 
            onToggle={() => setDebugMode(!debugMode)} 
          />
          
          {/* Debug info */}
          {debugMode && (
            <FormDebugInfo<PodcastCreationValues> form={creationForm} isSubmitting={isSubmitting} />
          )}
          
          {/* Display all validation errors */}
          {Object.keys(creationForm.formState.errors).length > 0 && (
            <FormValidationErrors<PodcastCreationValues> errors={creationForm.formState.errors} />
          )}
          
          <PodcastFormTabs<PodcastCreationValues>
            form={creationForm}
            mode={mode}
            incompleteTabsMessage={incompleteTabsMessage}
          />
          
          <FormActionButtons
            mode={mode}
            isSubmitting={isSubmitting}
          />
        </form>
      </Form>
    );
  }

  // Render the edit form
  return (
    <Form {...editForm}>
      <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-8">
        {/* Debug mode toggle */}
        <DebugModeToggle 
          debugMode={debugMode} 
          onToggle={() => setDebugMode(!debugMode)} 
        />
        
        {/* Debug info */}
        {debugMode && (
          <FormDebugInfo<PodcastEditValues> form={editForm} isSubmitting={isSubmitting} />
        )}
        
        {/* Display all validation errors */}
        {Object.keys(editForm.formState.errors).length > 0 && (
          <FormValidationErrors<PodcastEditValues> errors={editForm.formState.errors} />
        )}
        
        <PodcastFormTabs<PodcastEditValues>
          form={editForm}
          mode={mode}
          incompleteTabsMessage={incompleteTabsMessage}
        />
        
        <FormActionButtons
          mode={mode}
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  );
} 