import { z } from 'zod';

// Define form schema with Zod
export const formSchema = z.object({
  // Content Source
  contentSource: z.enum(['telegram', 'urls']),
  telegramChannel: z.string().optional(),
  telegramHours: z.number().min(1).max(72).optional(),
  urls: z.array(z.string().url().optional()).optional(),
  
  // Metadata
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  creator: z.string().min(2, { message: 'Creator name must be at least 2 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  coverImage: z.string().optional(),
  
  // Basic Settings
  podcastName: z.string().min(3, { message: 'Podcast name must be at least 3 characters' }),
  outputLanguage: z.enum(['english', 'hebrew']),
  slogan: z.string().optional(),
  creativityLevel: z.number().min(0).max(1),
  
  // Advanced Settings
  isLongPodcast: z.boolean().default(false),
  discussionRounds: z.number().min(1).max(20).default(5),
  minCharsPerRound: z.number().min(100).max(2000).default(500),
  
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

export type FormValues = z.infer<typeof formSchema>; 