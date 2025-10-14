'use client';

import { UseFormReturn } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormSelectField, FormTextareaField } from '@/components/ui/form-fields';

export interface FormValues {
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
  return (
    <>
      <FormSelectField
        control={form.control}
        name="conversationStyle"
        label="Conversation Style"
        placeholder="Select style"
        options={[
          { value: 'engaging', label: 'Engaging' },
          { value: 'dynamic', label: 'Dynamic' },
          { value: 'enthusiastic', label: 'Enthusiastic' },
          { value: 'educational', label: 'Educational' },
          { value: 'casual', label: 'Casual' },
          { value: 'professional', label: 'Professional' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'formal', label: 'Formal' },
        ]}
      />

      <FormSelectField
        control={form.control}
        name="speaker1Role"
        label="Speaker 1 Role"
        placeholder="Select role"
        options={[
          { value: 'interviewer', label: 'Interviewer' },
          { value: 'host', label: 'Host' },
          { value: 'moderator', label: 'Moderator' },
          { value: 'guide', label: 'Guide' },
        ]}
      />

      <FormSelectField
        control={form.control}
        name="speaker2Role"
        label="Speaker 2 Role"
        placeholder="Select role"
        options={[
          { value: 'domain-expert', label: 'Domain Expert' },
          { value: 'guest', label: 'Guest' },
          { value: 'expert', label: 'Expert' },
          { value: 'analyst', label: 'Analyst' },
        ]}
      />
      
      <FormField
        control={form.control}
        name="mixingTechniques"
        render={() => (
          <FormItem>
            <div className="mb-4">
              <FormLabel className="text-base">Mixing Techniques</FormLabel>
              <FormDescription>
                Select the techniques to use in the podcast
              </FormDescription>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'rhetorical-questions', label: 'Rhetorical Questions' },
                { id: 'personal-anecdotes', label: 'Personal Anecdotes' },
                { id: 'quotes', label: 'Quotes' },
                { id: 'short-stories', label: 'Short Stories' },
                { id: 'analogies', label: 'Analogies' },
                { id: 'humor', label: 'Humor' },
                { id: 'statistics', label: 'Statistics' },
                { id: 'expert-opinions', label: 'Expert Opinions' },
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
                        className="flex flex-row items-start space-x-3 space-y-0"
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
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
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


      <FormTextareaField
        control={form.control}
        name="additionalInstructions"
        label="Additional Instructions (Optional)"
        placeholder="Enter any additional instructions for podcast generation"
        className="min-h-[100px]"
      />
    </>
  );
} 