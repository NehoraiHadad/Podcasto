import { z } from 'zod';

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
  
  // Basic Settings
  podcastName: z.string().min(3),
  outputLanguage: z.enum(['english', 'hebrew']),
  slogan: z.string().optional(),
  creativityLevel: z.number().min(0).max(1),
  
  // Advanced Settings
  isLongPodcast: z.boolean().default(false),
  discussionRounds: z.number().min(1).max(20).default(5),
  minCharsPerRound: z.number().min(100).max(2000).default(500),
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
});

export type PodcastCreationData = z.infer<typeof podcastCreationSchema>;

// Schema for simple podcast creation with basic fields
export const simplePodcastSchema = z.object({
  title: z.string().min(3),
  description: z.string().nullable(),
  cover_image: z.string().nullable(),
});

export type SimplePodcastData = z.infer<typeof simplePodcastSchema>;

// Schema for podcast update operations
export const podcastUpdateSchema = z.object({
  id: z.string(),
  title: z.string().min(3),
  description: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  // Content source fields (optional)
  contentSource: z.enum(['telegram', 'urls']).optional(),
  telegramChannel: z.string().optional(),
  telegramHours: z.number().optional(),
  urls: z.array(z.string().optional()).optional(),
  // Basic settings fields (optional)
  creator: z.string().optional(),
  podcastName: z.string().optional(),
  outputLanguage: z.enum(['english', 'hebrew']).optional(),
  slogan: z.string().optional(),
  creativityLevel: z.number().optional(),
  // Advanced settings fields (optional)
  isLongPodcast: z.boolean().optional(),
  discussionRounds: z.number().optional(),
  minCharsPerRound: z.number().optional(),
  episodeFrequency: z.number().optional(),
  // Style and roles fields (optional)
  conversationStyle: z.string().optional(),
  speaker1Role: z.string().optional(),
  speaker2Role: z.string().optional(),
  // Mixing techniques (optional)
  mixingTechniques: z.array(z.string().optional()).optional(),
  additionalInstructions: z.string().optional(),
});

export type PodcastUpdateData = z.infer<typeof podcastUpdateSchema>; 