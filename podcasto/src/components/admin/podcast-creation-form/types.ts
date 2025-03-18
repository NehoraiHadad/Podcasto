import { z } from 'zod';

// Define form schema with Zod
export const formSchema = z.discriminatedUnion('contentSource', [
  z.object({
    contentSource: z.literal('telegram'),
    telegramChannel: z.string().min(1, { message: 'Telegram channel is required' }),
    telegramHours: z.number().min(1).max(72),
    // For telegram option, URLs can be any strings or empty, no validation needed
    urls: z.array(z.string().optional()).optional(),
    
    // Metadata
    title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
    creator: z.string().min(2, { message: 'Creator name must be at least 2 characters' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
    coverImage: z.string().optional(),
    
    // Basic Settings
    podcastName: z.string().min(3, { message: 'Podcast name must be at least 3 characters' }),
    outputLanguage: z.enum(['english', 'hebrew']),
    slogan: z.string().optional(),
    creativityLevel: z.number().min(0).max(1).step(0.1).describe('A decimal value between 0 and 1 (will be converted to 0-100 for storage)'),
    
    // Advanced Settings
    isLongPodcast: z.boolean().default(false),
    discussionRounds: z.number().min(1).max(20).default(5),
    minCharsPerRound: z.number().min(100).max(2000).default(500),
    episodeFrequency: z.number().min(1).max(30).default(7).describe('How often a new episode should be created (in days)'),
    
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
    urls: z.array(z.string().url({ message: "Please enter a valid URL" }).optional())
      .refine((urls) => urls.some(url => url && url.trim() !== ''), {
        message: 'At least one URL is required',
        path: ['urls']
      }),
    
    // Metadata
    title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
    creator: z.string().min(2, { message: 'Creator name must be at least 2 characters' }),
    description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
    coverImage: z.string().optional(),
    
    // Basic Settings
    podcastName: z.string().min(3, { message: 'Podcast name must be at least 3 characters' }),
    outputLanguage: z.enum(['english', 'hebrew']),
    slogan: z.string().optional(),
    creativityLevel: z.number().min(0).max(1).step(0.1).describe('A decimal value between 0 and 1 (will be converted to 0-100 for storage)'),
    
    // Advanced Settings
    isLongPodcast: z.boolean().default(false),
    discussionRounds: z.number().min(1).max(20).default(5),
    minCharsPerRound: z.number().min(100).max(2000).default(500),
    episodeFrequency: z.number().min(1).max(30).default(7).describe('How often a new episode should be created (in days)'),
    
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

export type FormValues = z.infer<typeof formSchema>; 