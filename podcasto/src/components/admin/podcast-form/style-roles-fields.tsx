'use client';

import { UseFormReturn, Controller } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormSelectField, FormTextareaField } from '@/components/ui/form-fields';
import { TooltipLabel } from '@/components/ui/tooltip-label';
import { FormatSelector } from './format-selector';
import { useEffect } from 'react';

export interface FormValues {
  podcastFormat?: 'single-speaker' | 'multi-speaker';
  conversationStyle?: string;
  speaker1Role?: string;
  speaker2Role?: string;
  mixingTechniques?: string[];
  additionalInstructions?: string;
}

interface StyleRolesFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function StyleRolesFields({ form }: StyleRolesFieldsProps) {
  // Watch the podcast format to conditionally show/hide speaker2 field
  const podcastFormat = form.watch('podcastFormat');

  // Clear speaker2Role when switching to single-speaker format
  useEffect(() => {
    if (podcastFormat === 'single-speaker') {
      form.setValue('speaker2Role', '');
    }
  }, [podcastFormat, form]);

  return (
    <>
      {/* Podcast Format Selector */}
      <Controller
        name="podcastFormat"
        control={form.control}
        render={({ field }) => (
          <FormatSelector
            value={field.value || 'multi-speaker'}
            onChange={field.onChange}
          />
        )}
      />

      <div className="space-y-2">
        <TooltipLabel
          label="Conversation Style"
          tooltip="The overall tone and approach of the podcast conversation. This sets the mood and personality of your podcast."
          required
        />
        <FormSelectField
          control={form.control}
          name="conversationStyle"
          label=""
          placeholder="Select a conversation style"
          options={[
            { value: 'engaging', label: 'Engaging - Captivating and interesting' },
            { value: 'dynamic', label: 'Dynamic - Energetic and varied' },
            { value: 'enthusiastic', label: 'Enthusiastic - Passionate and excited' },
            { value: 'educational', label: 'Educational - Informative and teaching' },
            { value: 'casual', label: 'Casual - Relaxed and informal' },
            { value: 'professional', label: 'Professional - Formal and business-like' },
            { value: 'friendly', label: 'Friendly - Warm and approachable' },
            { value: 'formal', label: 'Formal - Structured and traditional' },
          ]}
        />
      </div>

      <div className="space-y-2">
        <TooltipLabel
          label={podcastFormat === 'single-speaker' ? 'Speaker Role' : 'Speaker 1 Role'}
          tooltip={
            podcastFormat === 'single-speaker'
              ? 'The role of the speaker in the podcast. This person guides the entire episode.'
              : 'The role of the first speaker in the conversation. This person typically leads the discussion and asks questions.'
          }
          required
        />
        <FormSelectField
          control={form.control}
          name="speaker1Role"
          label=""
          placeholder={podcastFormat === 'single-speaker' ? "Select speaker's role" : "Select Speaker 1's role"}
          options={[
            { value: 'host', label: 'Host - Leads and facilitates the conversation' },
            { value: 'interviewer', label: 'Interviewer - Asks probing questions' },
            { value: 'moderator', label: 'Moderator - Guides and manages the discussion' },
            { value: 'guide', label: 'Guide - Explains and educates' },
          ]}
        />
      </div>

      {/* Conditionally render Speaker 2 Role only for multi-speaker format */}
      {podcastFormat === 'multi-speaker' && (
        <div className="space-y-2">
          <TooltipLabel
            label="Speaker 2 Role"
            tooltip="The role of the second speaker. This person typically provides expertise and detailed information."
            required
          />
          <FormSelectField
            control={form.control}
            name="speaker2Role"
            label=""
            placeholder="Select Speaker 2's role"
            options={[
              { value: 'expert', label: 'Expert - Provides specialized knowledge' },
              { value: 'domain-expert', label: 'Domain Expert - Deep expertise in specific field' },
              { value: 'guest', label: 'Guest - Shares experiences and insights' },
              { value: 'analyst', label: 'Analyst - Analyzes and interprets information' },
            ]}
          />
        </div>
      )}
      
      <FormField
        control={form.control}
        name="mixingTechniques"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <TooltipLabel
                label="Mixing Techniques"
                tooltip="Techniques that will be used to make your podcast more engaging and interesting. Select multiple options to create a richer listening experience."
                required
              />
              <FormDescription className="mt-2">
                Choose the storytelling and engagement techniques for your podcast
              </FormDescription>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'rhetorical-questions', label: 'Rhetorical Questions', desc: 'Pose thought-provoking questions' },
                { id: 'personal-anecdotes', label: 'Personal Anecdotes', desc: 'Share relatable stories' },
                { id: 'quotes', label: 'Quotes', desc: 'Include relevant quotations' },
                { id: 'short-stories', label: 'Short Stories', desc: 'Tell illustrative narratives' },
                { id: 'analogies', label: 'Analogies', desc: 'Explain using comparisons' },
                { id: 'humor', label: 'Humor', desc: 'Add light-hearted moments' },
                { id: 'statistics', label: 'Statistics', desc: 'Use data and numbers' },
                { id: 'expert-opinions', label: 'Expert Opinions', desc: 'Reference authoritative views' },
              ].map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="mixingTechniques"
                  render={({ field }) => {
                    const values = field.value as string[] || [];
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0 border rounded-md p-3 hover:bg-gray-50 transition-colors"
                      >
                        <FormControl>
                          <Checkbox
                            checked={values.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...values, item.id])
                                : field.onChange(
                                    values.filter(
                                      (value) => value !== item.id
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <div className="flex-1">
                          <FormLabel className="font-normal cursor-pointer">
                            {item.label}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <TooltipLabel
          label="Additional Instructions (Optional)"
          tooltip="Any specific guidance or requirements for the AI when generating your podcast. For example, tone preferences, topics to avoid, or specific formats to follow."
        />
        <FormTextareaField
          control={form.control}
          name="additionalInstructions"
          label=""
          placeholder="Example: Focus on beginner-friendly explanations, avoid technical jargon, include actionable takeaways at the end of each episode..."
          className="min-h-[100px]"
        />
      </div>
    </>
  );
} 