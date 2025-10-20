import { z } from 'zod';

/**
 * Language variant schema for form validation
 */
export const languageVariantSchema = z.object({
  language_code: z.string().min(2, 'Language is required'),
  podcast_id: z.string().uuid('Valid podcast must be selected'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  is_primary: z.boolean().default(false),
});

/**
 * Podcast group form schema
 */
export const podcastGroupSchema = z.object({
  base_title: z.string().min(1, 'Base title is required'),
  base_description: z.string().optional(),
  base_cover_image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  languages: z.array(languageVariantSchema).min(1, 'At least one language variant required'),
}).refine(
  (data) => data.languages.some((lang) => lang.is_primary),
  {
    message: 'At least one language must be marked as primary',
    path: ['languages'],
  }
);

/**
 * Type for podcast group form values
 */
export type PodcastGroupFormValues = z.infer<typeof podcastGroupSchema>;
