'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormValues } from './types';

interface ContentSourceTabClientProps {
  form: UseFormReturn<FormValues>;
}

export function ContentSourceTabClient({ form }: ContentSourceTabClientProps) {
  const contentSource = form.watch('contentSource');

  return (
    <>
      <FormField
        control={form.control}
        name="contentSource"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Content Source Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="telegram" id="telegram" />
                  <Label htmlFor="telegram">Telegram Channel</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urls" id="urls" />
                  <Label htmlFor="urls">URLs (up to 5)</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {contentSource === 'telegram' ? (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="telegramChannel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telegram Channel Username</FormLabel>
                <FormControl>
                  <Input placeholder="@channelname" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the Telegram channel username without the @ symbol
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="telegramHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hours to Fetch</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    max={72} 
                    {...field}
                    onChange={e => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Number of hours of content to fetch (1-72)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((index) => (
            <FormField
              key={index}
              control={form.control}
              name={`urls.${index}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL {index + 1}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  {index === 0 && (
                    <FormDescription>
                      Enter up to 5 URLs to use as content sources
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      )}
    </>
  );
} 