'use client';

import { Path, UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormTextField, FormNumberField } from '@/components/ui/form-fields';
import { TooltipLabel } from '@/components/ui/tooltip-label';

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
            <TooltipLabel
              label="Content Source Type"
              tooltip="Choose where your podcast content will come from. Telegram channels are great for news and updates, while URLs work well for blog posts and articles."
              required
            />
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={String(field.value || '')}
                className="flex flex-col space-y-3"
              >
                <div className="flex items-center space-x-3 border rounded-md p-3 hover:bg-gray-50 transition-colors">
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
                <div className="flex items-center space-x-3 border rounded-md p-3 hover:bg-gray-50 transition-colors">
                  <RadioGroupItem value="urls" id="urls" className="h-5 w-5" />
                  <div className="flex-1">
                    <Label htmlFor="urls" className="font-medium cursor-pointer block">
                      URLs (up to 5)
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use content from specific web pages or RSS feeds
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {contentSource === 'telegram' ? (
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md border border-gray-100 space-y-4">
            <div className="space-y-2">
              <TooltipLabel
                label="Telegram Channel Username"
                tooltip="The username of the public Telegram channel. You can find this in the channel info. For example, if the channel URL is t.me/mychannel, enter 'mychannel' (without the @ symbol)."
                required
              />
              <FormTextField
                control={form.control}
                name={"telegramChannel" as const as Path<T>}
                label=""
                placeholder="channelname"
                className="bg-white"
                description="Channel username without the @ symbol (e.g., 'technews')"
              />
            </div>

            <div className="space-y-2">
              <TooltipLabel
                label="Hours to Fetch"
                tooltip="How many hours of recent content to fetch from the channel. For example, 24 hours will get all posts from the last day."
                required
              />
              <FormNumberField
                control={form.control}
                name={"telegramHours" as const as Path<T>}
                label=""
                min={1}
                max={72}
                className="bg-white"
                description="Fetch posts from the last 1-72 hours (default: 24)"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <div className="bg-gray-50 p-3 md:p-4 rounded-md border border-gray-100">
            <p className="text-sm text-muted-foreground mb-4">
              Add up to 5 URLs to use as content sources. These can be blog posts, news articles, or RSS feed URLs.
            </p>
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className={index > 0 ? 'mt-4' : ''}>
                <FormTextField
                  control={form.control}
                  name={`urls.${index}` as Path<T>}
                  label={index === 0 ? 'URL 1 (required)' : `URL ${index + 1} (optional)`}
                  type="url"
                  placeholder="https://example.com/article"
                  className="bg-white"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
} 