'use client';

import { UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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
      <FormField
        control={form.control}
        name="conversationStyle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Conversation Style</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="engaging">Engaging</SelectItem>
                <SelectItem value="dynamic">Dynamic</SelectItem>
                <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="speaker1Role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Speaker 1 Role</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="interviewer">Interviewer</SelectItem>
                <SelectItem value="host">Host</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="speaker2Role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Speaker 2 Role</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="domain-expert">Domain Expert</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
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
      
      <FormField
        control={form.control}
        name="additionalInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Additional Instructions (Optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter any additional instructions for podcast generation" 
                className="min-h-[100px]"
                {...field} 
                value={String(field.value || '')}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
} 