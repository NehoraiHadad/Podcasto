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

// Define creation form schema with additional fields
export const podcastCreationSchema = z.discriminatedUnion('contentSource', [
  z.object({
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

    // Style and Roles
    conversationStyle: z.enum([
      'engaging', 'dynamic', 'enthusiastic', 'educational',
      'casual', 'professional', 'friendly', 'formal'
    ]),
    speaker1Role: z.enum(['interviewer', 'host', 'moderator', 'guide']),
    speaker2Role: z.enum(['domain-expert', 'guest', 'expert', 'analyst']),

    // Mixing Techniques
    mixingTechniques: z.array(z.string()),

    // Additional Instructions
    additionalInstructions: z.string().optional(),
  }),
  z.object({
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

    // Style and Roles
    conversationStyle: z.enum([
      'engaging', 'dynamic', 'enthusiastic', 'educational',
      'casual', 'professional', 'friendly', 'formal'
    ]),
    speaker1Role: z.enum(['interviewer', 'host', 'moderator', 'guide']),
    speaker2Role: z.enum(['domain-expert', 'guest', 'expert', 'analyst']),

    // Mixing Techniques
    mixingTechniques: z.array(z.string()),

    // Additional Instructions
    additionalInstructions: z.string().optional(),
  })
]);

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

  // Style and roles
  conversationStyle: z.enum([
    'engaging', 'dynamic', 'enthusiastic', 'educational', 
    'casual', 'professional', 'friendly', 'formal'
  ]).optional(),
  speaker1Role: z.enum(['interviewer', 'host', 'moderator', 'guide']).optional(),
  speaker2Role: z.enum(['domain-expert', 'guest', 'expert', 'analyst']).optional(),
  
  mixingTechniques: z.array(z.string()).optional(),
  additionalInstructions: z.string().optional(),
}).partial(); // Make all fields partial to allow updating only specific fields

// Type for the creation form
export type PodcastCreationValues = z.infer<typeof podcastCreationSchema>;

// Type for the edit form
export type PodcastEditValues = z.infer<typeof podcastEditSchema>;

// Mode of the form
export type PodcastFormMode = 'create' | 'edit'; 