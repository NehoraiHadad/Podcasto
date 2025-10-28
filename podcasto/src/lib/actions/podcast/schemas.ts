import { z } from 'zod';
import { SUPPORTED_OUTPUT_LANGUAGES } from '@/lib/constants/languages';
import { getSupportedLanguageCodes, type LanguageCode } from '@/lib/utils/language-mapper';

// Supported language codes for validation
const SUPPORTED_LANGUAGE_CODES = getSupportedLanguageCodes() as [LanguageCode, ...LanguageCode[]];

// Common response type for all podcast actions
export type ActionResponse = {
  success: boolean;
  error?: string;
  id?: string;
};

// Define the podcast creation schema
export const podcastCreationSchema = z.object({
  // Content Source
  contentSource: z.enum(['telegram', 'urls']),
  telegramChannel: z.string().optional(),
  telegramHours: z.number().min(1).max(72).optional(),
  urls: z.array(z.string().url().optional()).optional(),

  // Metadata
  title: z.string().min(3),
  creator: z.string().min(2),
  description: z.string().min(10),
  coverImage: z.string().optional(),
  imageStyle: z.string().optional(),

  // Basic Settings
  podcastName: z.string().min(3),
  languageCode: z.enum(SUPPORTED_LANGUAGE_CODES),
  slogan: z.string().optional(),
  creativityLevel: z.number().min(0).max(1),

  // Episode Settings
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
}).superRefine((data, ctx) => {
  // Validate speaker2Role is required for multi-speaker podcasts
  if (data.podcastFormat === 'multi-speaker' && !data.speaker2Role) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Speaker 2 role is required for multi-speaker podcasts",
      path: ["speaker2Role"]
    });
  }
});

export type PodcastCreationData = z.infer<typeof podcastCreationSchema>;

// Schema for simple podcast creation with basic fields
export const simplePodcastSchema = z.object({
  title: z.string().min(3),
  description: z.string().nullable(),
  cover_image: z.string().nullable(),
  image_style: z.string().nullable().optional(),
});

export type SimplePodcastData = z.infer<typeof simplePodcastSchema>;

// Schema for podcast update operations
export const podcastUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  description: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  image_style: z.string().nullable().optional(),
  // Content source fields (optional)
  contentSource: z.enum(['telegram', 'urls']).optional(),
  telegramChannel: z.string().optional(),
  telegramHours: z.number().optional(),
  urls: z.array(z.string().optional()).optional(),
  // Basic settings fields (optional)
  creator: z.string().optional(),
  podcastName: z.string().optional(),
  languageCode: z.enum(SUPPORTED_LANGUAGE_CODES).optional(),
  slogan: z.string().optional(),
  creativityLevel: z.number().optional(),
  // Episode settings fields (optional)
  episodeFrequency: z.number().optional(),
  // Podcast Format
  podcastFormat: z.enum(['single-speaker', 'multi-speaker']).optional(),
  // Style and roles fields (optional)
  conversationStyle: z.string().optional(),
  speaker1Role: z.string().optional(),
  speaker2Role: z.string().optional(),
  // Mixing techniques (optional)
  mixingTechniques: z.array(z.string().optional()).optional(),
  additionalInstructions: z.string().nullish(),
  // Intro/Outro prompts (optional)
  introPrompt: z.string().nullish(),
  outroPrompt: z.string().nullish(),
  // Auto-generation setting (optional)
  autoGeneration: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Only validate speaker2Role if podcastFormat is explicitly set to multi-speaker
  if (data.podcastFormat === 'multi-speaker' && data.speaker2Role === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Speaker 2 role is required for multi-speaker podcasts",
      path: ["speaker2Role"]
    });
  }
});

export type PodcastUpdateData = z.infer<typeof podcastUpdateSchema>; 