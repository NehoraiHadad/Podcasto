'use client';

import { Control, FieldValues } from 'react-hook-form';
import { FormSelectField, FormTextareaField } from '@/components/ui/form-fields';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface StyleSectionProps {
  control: Control<FieldValues>;
  disabled?: boolean;
}

const CONVERSATION_STYLE_OPTIONS = [
  { value: 'professional', label: 'Professional - Formal and business-like' },
  { value: 'conversational', label: 'Conversational - Natural and flowing dialogue' },
  { value: 'educational', label: 'Educational - Informative and teaching' },
  { value: 'casual', label: 'Casual - Relaxed and informal' },
];

/**
 * Podcast style and customization section.
 * Allows configuration of conversation tone and custom intro/outro prompts.
 *
 * Fields:
 * - conversationStyle: Select dropdown for overall podcast tone
 * - introPrompt: Optional textarea for custom intro instructions
 * - outroPrompt: Optional textarea for custom outro instructions
 *
 * Intro/outro prompts are collapsed in an accordion to reduce visual clutter.
 */
export function StyleSection({ control, disabled = false }: StyleSectionProps) {
  return (
    <div className="space-y-4">
      <FormSelectField
        control={control}
        name="conversationStyle"
        label="Conversation Style"
        placeholder="Select a conversation style"
        description="The overall tone and approach of your podcast"
        options={CONVERSATION_STYLE_OPTIONS}
        required
        disabled={disabled}
      />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="custom-prompts">
          <AccordionTrigger className="text-sm font-medium">
            Custom Intro & Outro (Optional)
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <FormTextareaField
                control={control}
                name="introPrompt"
                label="Intro Prompt"
                placeholder="Example: Start with an engaging hook that connects to current events..."
                description="Custom instructions for how to start each episode"
                disabled={disabled}
                className="min-h-20"
              />

              <FormTextareaField
                control={control}
                name="outroPrompt"
                label="Outro Prompt"
                placeholder="Example: End with a call-to-action and tease the next episode..."
                description="Custom instructions for how to end each episode"
                disabled={disabled}
                className="min-h-20"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
