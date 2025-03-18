'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormValues } from './types';

interface BasicSettingsTabClientProps {
  form: UseFormReturn<FormValues>;
}

export function BasicSettingsTabClient({ form }: BasicSettingsTabClientProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="podcastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Podcast Name
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter podcast name" 
                {...field}
                className={form.formState.errors.podcastName ? 'border-red-500' : ''}
              />
            </FormControl>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="outputLanguage"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Output Language
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger className={form.formState.errors.outputLanguage ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hebrew">Hebrew</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="episodeFrequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Episode Frequency: {field.value} days
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Slider
                  min={1}
                  max={30}
                  step={1}
                  defaultValue={[7]}
                  value={[field.value]}
                  onValueChange={(values) => field.onChange(values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Daily</span>
                  <span>Weekly</span>
                  <span>Monthly</span>
                </div>
              </div>
            </FormControl>
            <FormDescription>
              How often a new episode should be created (1-30 days)
            </FormDescription>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="slogan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Slogan</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter podcast slogan" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Optional - Add a short slogan for your podcast
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="creativityLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Creativity Level
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                  className={form.formState.errors.creativityLevel ? 'border-red-500' : ''}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Factual</span>
                  <span>Creative</span>
                </div>
              </div>
            </FormControl>
            <FormMessage className="text-red-500" />
          </FormItem>
        )}
      />
    </>
  );
} 