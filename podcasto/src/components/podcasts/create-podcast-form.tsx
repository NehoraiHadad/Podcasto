'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createPodcastAction } from '@/lib/actions/podcast-group-actions';

const createPodcastSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  telegramChannel: z.string().min(1, 'Telegram channel is required'),
  language: z.enum(['english', 'hebrew']),
  episodeFrequency: z.number().int().min(1).max(30),
  autoGeneration: z.boolean(),
});

type CreatePodcastFormValues = z.infer<typeof createPodcastSchema>;

interface CreatePodcastFormProps {
  userCredits: number;
}

export function CreatePodcastForm({ userCredits }: CreatePodcastFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CreatePodcastFormValues>({
    resolver: zodResolver(createPodcastSchema),
    defaultValues: {
      title: '',
      description: '',
      coverImage: '',
      telegramChannel: '',
      language: 'english',
      episodeFrequency: 7,
      autoGeneration: false,
    },
  });

  const onSubmit = async (values: CreatePodcastFormValues) => {
    setIsSubmitting(true);

    try {
      // Transform form values to match the createPodcastAction interface
      const coverImageUrl = values.coverImage || 'https://picsum.photos/400/300';

      const result = await createPodcastAction({
        base_title: values.title,
        base_description: values.description || '',
        base_cover_image: coverImageUrl,
        languages: [
          {
            language_code: values.language === 'english' ? 'en' : 'he',
            is_primary: true,
            title: values.title,
            description: values.description || '',
            cover_image: coverImageUrl,

            // Content source
            contentSource: 'telegram',
            telegramChannel: values.telegramChannel,
            telegramHours: 24,

            // Sensible defaults for user podcast
            creator: 'User',
            podcastName: values.title,
            outputLanguage: values.language,
            creativityLevel: 0.5,
            episodeFrequency: values.episodeFrequency,
            conversationStyle: 'conversational',
            speaker1Role: 'Host',
            speaker2Role: 'Co-host',
            mixingTechniques: ['casual_banter'],
          },
        ],
      });

      if (result.success) {
        toast({
          title: 'Podcast created',
          description: 'Your podcast has been created successfully.',
        });

        // Redirect to my podcasts
        router.push('/podcasts/my');
      } else {
        toast({
          title: 'Creation failed',
          description: result.error || 'Failed to create podcast',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating podcast:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Podcast Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Daily Tech News"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Give your podcast a descriptive name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A daily podcast covering the latest technology news..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional description for your podcast
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cover Image URL */}
        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/podcast-cover.jpg"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional: Provide a URL to your podcast cover image. We'll fetch the channel image from Telegram if left empty.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Telegram Channel */}
        <FormField
          control={form.control}
          name="telegramChannel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telegram Channel *</FormLabel>
              <FormControl>
                <Input
                  placeholder="@technews"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The Telegram channel to fetch content from (e.g., @channelname)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Language */}
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hebrew">Hebrew</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The language for generated episodes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Episode Frequency */}
        <FormField
          control={form.control}
          name="episodeFrequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Episode Frequency *</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">Daily</SelectItem>
                  <SelectItem value="7">Weekly</SelectItem>
                  <SelectItem value="14">Bi-weekly</SelectItem>
                  <SelectItem value="30">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How often should new episodes be generated
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Auto-generation Toggle */}
        <FormField
          control={form.control}
          name="autoGeneration"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Auto-generation</FormLabel>
                <FormDescription>
                  Automatically generate episodes based on the frequency above.
                  Requires sufficient credits.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={userCredits < 10}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Podcast
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
