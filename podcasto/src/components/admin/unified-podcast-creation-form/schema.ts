import { z } from 'zod';

/**
 * Schema for a language variant in creation mode
 * Includes all podcast creation fields plus language information
 */
export const languageVariantCreationSchema = z.discriminatedUnion('contentSource', [
  z.object({
    // Language info
    language_code: z.string().min(2, 'Language is required'),
    is_primary: z.boolean().default(false),

    // Podcast metadata (variant-specific)
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    cover_image: z.string().optional(),
    image_style: z.string().optional(),

    // Content source (Telegram)
    contentSource: z.literal('telegram'),
    telegramChannel: z.string().min(1, 'Telegram channel is required'),
    telegramHours: z.number().min(1).max(72),
    urls: z.array(z.string().optional()).optional(),

    // Podcast config
    creator: z.string().min(2, 'Creator name must be at least 2 characters'),
    podcastName: z.string().min(3, 'Podcast name must be at least 3 characters'),
    outputLanguage: z.enum(['english', 'hebrew']),
    slogan: z.string().optional(),
    creativityLevel: z.number().min(0).max(1).step(0.1),

    // Advanced settings
    isLongPodcast: z.boolean().default(false),
    discussionRounds: z.number().min(1).max(20).default(5),
    minCharsPerRound: z.number().min(100).max(2000).default(500),
    episodeFrequency: z.number().min(1).max(30).default(7),

    // Style and roles
    conversationStyle: z.enum([
      'engaging', 'dynamic', 'enthusiastic', 'educational',
      'casual', 'professional', 'friendly', 'formal'
    ]),
    speaker1Role: z.enum(['interviewer', 'host', 'moderator', 'guide']),
    speaker2Role: z.enum(['domain-expert', 'guest', 'expert', 'analyst']),

    // Mixing techniques
    mixingTechniques: z.array(z.string()),

    // Additional instructions
    additionalInstructions: z.string().optional(),
  }),
  z.object({
    // Language info
    language_code: z.string().min(2, 'Language is required'),
    is_primary: z.boolean().default(false),

    // Podcast metadata (variant-specific)
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    cover_image: z.string().optional(),
    image_style: z.string().optional(),

    // Content source (URLs)
    contentSource: z.literal('urls'),
    telegramChannel: z.string().optional(),
    telegramHours: z.number().min(1).max(72).optional(),
    urls: z.array(z.string().optional())
      .refine((urls) => urls.some(url => url && url.trim() !== ''), {
        message: 'At least one URL is required',
        path: ['urls']
      }),

    // Podcast config
    creator: z.string().min(2, 'Creator name must be at least 2 characters'),
    podcastName: z.string().min(3, 'Podcast name must be at least 3 characters'),
    outputLanguage: z.enum(['english', 'hebrew']),
    slogan: z.string().optional(),
    creativityLevel: z.number().min(0).max(1).step(0.1),

    // Advanced settings
    isLongPodcast: z.boolean().default(false),
    discussionRounds: z.number().min(1).max(20).default(5),
    minCharsPerRound: z.number().min(100).max(2000).default(500),
    episodeFrequency: z.number().min(1).max(30).default(7),

    // Style and roles
    conversationStyle: z.enum([
      'engaging', 'dynamic', 'enthusiastic', 'educational',
      'casual', 'professional', 'friendly', 'formal'
    ]),
    speaker1Role: z.enum(['interviewer', 'host', 'moderator', 'guide']),
    speaker2Role: z.enum(['domain-expert', 'guest', 'expert', 'analyst']),

    // Mixing techniques
    mixingTechniques: z.array(z.string()),

    // Additional instructions
    additionalInstructions: z.string().optional(),
  })
]);

/**
 * Podcast group creation form schema
 * Allows creating a group with new podcasts in one flow
 */
export const podcastGroupCreationSchema = z.object({
  // Base group information
  base_title: z.string().min(1, 'Base title is required'),
  base_description: z.string().optional(),
  base_cover_image: z.string().url('Must be a valid URL').optional().or(z.literal('')),

  // Language variants (each with full podcast creation data)
  languages: z.array(languageVariantCreationSchema).min(1, 'At least one language variant required'),
}).refine(
  (data) => data.languages.some((lang) => lang.is_primary),
  {
    message: 'At least one language must be marked as primary',
    path: ['languages'],
  }
);

/**
 * Type for podcast group creation form values
 */
export type PodcastGroupCreationFormValues = z.infer<typeof podcastGroupCreationSchema>;

/**
 * Type for language variant creation values
 */
export type LanguageVariantCreationValues = z.infer<typeof languageVariantCreationSchema>;
