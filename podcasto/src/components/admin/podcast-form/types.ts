import { z } from 'zod';
import { SUPPORTED_OUTPUT_LANGUAGES } from '@/lib/constants/languages';

// Define base schema for shared fields
export const podcastBaseSchema = z.object({
  // Basic metadata fields (always required)
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }).max(100, 'Title must be less than 100 characters'),
  description: z.string().optional().nullable(),
  cover_image: z.string().optional().nullable(),
  image_style: z.string().optional().nullable(), // Style ID for podcast cover (e.g., 'modern-professional')
});

// Define base schemas without refinements for discriminated union
const telegramSchema = z.object({
  contentSource: z.literal('telegram'),
  telegramChannel: z.string().min(1, { message: 'Telegram channel is required' }),
  telegramHours: z.number().min(1).max(72),
  // For telegram option, URLs can be any strings or empty, no validation needed
  urls: z.array(z.string().optional()).optional(),

  // Metadata
  title: z.string()
    .min(3, { message: 'Podcast title must be at least 3 characters' })
    .max(100, { message: 'Podcast title must be less than 100 characters' }),
  creator: z.string()
    .min(2, { message: 'Creator name must be at least 2 characters' })
    .max(100, { message: 'Creator name must be less than 100 characters' }),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(1000, { message: 'Description must be less than 1000 characters' }),
  cover_image: z.string().optional(),
  image_style: z.string().optional(),

  // Basic Settings
  podcastName: z.string()
    .min(3, { message: 'Technical name must be at least 3 characters' })
    .max(50, { message: 'Technical name must be at most 50 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Technical name can only contain lowercase letters, numbers, and hyphens' }),
  outputLanguage: z.enum(SUPPORTED_OUTPUT_LANGUAGES),
  slogan: z.string().optional(),
  creativityLevel: z.number().min(0).max(1).step(0.1),
  episodeFrequency: z.number().min(1).max(30).default(7),

  // Podcast Format
  podcastFormat: z.enum(['single-speaker', 'multi-speaker']).default('multi-speaker'),

  // Style and Roles
  conversationStyle: z.enum([
    'engaging', 'dynamic', 'enthusiastic', 'educational',
    'casual', 'professional', 'friendly', 'formal'
  ]),
  speaker1Role: z.string().min(1, "Speaker 1 role is required"),
  speaker2Role: z.string().optional(),

  // Mixing Techniques
  mixingTechniques: z.array(z.string()),

  // Additional Instructions
  additionalInstructions: z.string().optional(),
});

const urlsSchema = z.object({
  contentSource: z.literal('urls'),
  telegramChannel: z.string().optional(),
  telegramHours: z.number().min(1).max(72).optional(),
  urls: z.array(z.string().optional())
    .refine((urls) => urls.some(url => url && url.trim() !== ''), {
      message: 'At least one URL is required',
      path: ['urls']
    }),

  // Metadata
  title: z.string()
    .min(3, { message: 'Podcast title must be at least 3 characters' })
    .max(100, { message: 'Podcast title must be less than 100 characters' }),
  creator: z.string()
    .min(2, { message: 'Creator name must be at least 2 characters' })
    .max(100, { message: 'Creator name must be less than 100 characters' }),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(1000, { message: 'Description must be less than 1000 characters' }),
  cover_image: z.string().optional(),
  image_style: z.string().optional(),

  // Basic Settings
  podcastName: z.string()
    .min(3, { message: 'Technical name must be at least 3 characters' })
    .max(50, { message: 'Technical name must be at most 50 characters' })
    .regex(/^[a-z0-9-]+$/, { message: 'Technical name can only contain lowercase letters, numbers, and hyphens' }),
  outputLanguage: z.enum(SUPPORTED_OUTPUT_LANGUAGES),
  slogan: z.string().optional(),
  creativityLevel: z.number().min(0).max(1).step(0.1),
  episodeFrequency: z.number().min(1).max(30).default(7),

  // Podcast Format
  podcastFormat: z.enum(['single-speaker', 'multi-speaker']).default('multi-speaker'),

  // Style and Roles
  conversationStyle: z.enum([
    'engaging', 'dynamic', 'enthusiastic', 'educational',
    'casual', 'professional', 'friendly', 'formal'
  ]),
  speaker1Role: z.string().min(1, "Speaker 1 role is required"),
  speaker2Role: z.string().optional(),

  // Mixing Techniques
  mixingTechniques: z.array(z.string()),

  // Additional Instructions
  additionalInstructions: z.string().optional(),
});

// Define creation form schema with additional fields
export const podcastCreationSchema = z.discriminatedUnion('contentSource', [
  telegramSchema,
  urlsSchema
]).superRefine((data, ctx) => {
  // Validate speaker2Role is required for multi-speaker podcasts
  if (data.podcastFormat === 'multi-speaker' && !data.speaker2Role) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Speaker 2 role is required for multi-speaker podcasts",
      path: ["speaker2Role"]
    });
  }
});

// Define edit form schema
export const podcastEditSchema = podcastBaseSchema.extend({
  // Optional fields for editing an existing podcast
  creator: z.string().optional(),
  podcastName: z.string().optional(),
  slogan: z.string().optional(),

  // Configuration fields
  contentSource: z.enum(['telegram', 'urls']).optional(),
  telegramChannel: z.string().optional(),
  telegramHours: z.number().min(1).max(72).optional(),
  urls: z.array(z.string().optional()).optional(),
  outputLanguage: z.enum(['english', 'hebrew']).optional(),
  creativityLevel: z.number().min(0).max(1).optional(),
  episodeFrequency: z.number().min(1).max(30).optional(),

  // Podcast Format
  podcastFormat: z.enum(['single-speaker', 'multi-speaker']).optional(),

  // Style and roles
  conversationStyle: z.enum([
    'engaging', 'dynamic', 'enthusiastic', 'educational',
    'casual', 'professional', 'friendly', 'formal'
  ]).optional(),
  speaker1Role: z.string().optional(),
  speaker2Role: z.string().optional(),

  mixingTechniques: z.array(z.string()).optional(),
  additionalInstructions: z.string().optional(),
}).partial().refine((data) => {
  // Only validate speaker2Role if podcastFormat is explicitly set
  if (data.podcastFormat === 'multi-speaker' && data.speaker2Role === undefined) {
    return false;
  }
  return true;
}, {
  message: "Speaker 2 role is required for multi-speaker podcasts",
  path: ["speaker2Role"]
}); // Make all fields partial to allow updating only specific fields

// Type for the creation form
export type PodcastCreationValues = z.infer<typeof podcastCreationSchema>;

// Type for the edit form
export type PodcastEditValues = z.infer<typeof podcastEditSchema>;

// Mode of the form
export type PodcastFormMode = 'create' | 'edit'; 