'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

type FormValues = {
  contentSource?: string;
  telegramChannel?: string;
  telegramHours?: number;
  urls?: (string | undefined)[];
  [key: string]: unknown;
};

interface ContentSourceFieldsProps<T extends FormValues> {
  form: UseFormReturn<T>;
}

export function ContentSourceFields<T extends FormValues>({ form }: ContentSourceFieldsProps<T>) {
  const contentSource = form.watch('contentSource' as Path<T>);

  return (
    <>
      <FormField
        control={form.control}
        name={"contentSource" as const as Path<T>}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Content Source Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={String(field.value || '')}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-3 border rounded-md p-3 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="telegram" id="telegram" className="h-5 w-5" />
                  <Label htmlFor="telegram" className="font-medium cursor-pointer flex-1">Telegram Channel</Label>
                </div>
                <div className="flex items-center space-x-3 border rounded-md p-3 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="urls" id="urls" className="h-5 w-5" />
                  <Label htmlFor="urls" className="font-medium cursor-pointer flex-1">URLs (up to 5)</Label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormDescription className="text-xs">
              Choose how you want to source content for your podcast
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {contentSource === 'telegram' ? (
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md border border-gray-100">
            <FormField
              control={form.control}
              name={"telegramChannel" as const as Path<T>}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telegram Channel Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="@channelname" 
                      {...field} 
                      value={String(field.value || '')}
                      className="bg-white" 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Enter the Telegram channel username without the @ symbol
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name={"telegramHours" as const as Path<T>}
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Hours to Fetch</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={72}
                      className="bg-white"
                      {...field}
                      value={String(field.value || '')}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Number of hours of content to fetch (1-72)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md border border-gray-100">
            {[0, 1, 2, 3, 4].map((index) => (
              <FormField
                key={index}
                control={form.control}
                name={`urls.${index}` as Path<T>}
                render={({ field }) => (
                  <FormItem className={index > 0 ? "mt-4" : ""}>
                    <FormLabel>URL {index + 1}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com" 
                        {...field} 
                        value={String(field.value || '')}
                        className="bg-white"
                      />
                    </FormControl>
                    {index === 0 && (
                      <FormDescription className="text-xs">
                        Enter up to 5 URLs to use as content sources
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
} 