'use client';

import { Control, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FormTextField } from '@/components/ui/form-fields';

interface ContentSourceSectionProps {
  control: Control<any>;
  disabled?: boolean;
}

/**
 * Content source selection section with conditional fields.
 * Allows users to choose between Telegram channel or RSS feed as content source.
 *
 * Fields:
 * - contentSource: Radio group for source type ('telegram' | 'rss')
 * - telegramChannelName: Shown when contentSource is 'telegram'
 * - rssUrl: Shown when contentSource is 'rss'
 */
export function ContentSourceSection({ control, disabled = false }: ContentSourceSectionProps) {
  const contentSource = useWatch({ control, name: 'contentSource' });

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="contentSource"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Content Source Type</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-3"
                disabled={disabled}
              >
                <div className="flex items-center space-x-3 border rounded-md p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="telegram" id="telegram" className="h-5 w-5" />
                  <div className="flex-1">
                    <Label htmlFor="telegram" className="font-medium cursor-pointer block">
                      Telegram Channel
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fetch content from a public Telegram channel
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 border rounded-md p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="rss" id="rss" className="h-5 w-5" />
                  <div className="flex-1">
                    <Label htmlFor="rss" className="font-medium cursor-pointer block">
                      RSS Feed
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use content from an RSS feed or blog
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {contentSource === 'telegram' && (
        <div className="bg-gray-50 p-3 sm:p-4 rounded-md border space-y-4">
          <FormTextField
            control={control}
            name="telegramChannelName"
            label="Telegram Channel Username"
            placeholder="channelname"
            description="Channel username without the @ symbol (e.g., 'technews')"
            required
            disabled={disabled}
          />

          <FormField
            control={control}
            name="telegramHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Look Back Hours</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    placeholder="24"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 24)}
                    disabled={disabled}
                  />
                </FormControl>
                <FormDescription>
                  How many hours to look back for messages (1-168 hours, default: 24)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {contentSource === 'rss' && (
        <div className="bg-gray-50 p-3 sm:p-4 rounded-md border">
          <FormTextField
            control={control}
            name="rssUrl"
            label="RSS Feed URL"
            type="url"
            placeholder="https://example.com/feed.xml"
            description="Full URL to your RSS feed"
            required
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
