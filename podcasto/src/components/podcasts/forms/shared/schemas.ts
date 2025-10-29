import { z } from 'zod';
import { SUPPORTED_OUTPUT_LANGUAGES } from '@/lib/constants/languages';

/**
 * Consolidated Zod validation schemas for podcast forms
 *
 * This file consolidates all podcast form validation logic into reusable schemas
 * that can be composed for different form types (admin, premium, user, edit).
 *
 * Schema hierarchy:
 * - baseFields: Core podcast fields shared across all forms
 * - contentSourceSchemas: Telegram vs RSS/URLs validation
 * - formatValidation: Single-speaker vs multi-speaker rules
 * - Full schemas: basePodcast, adminPodcast, premiumPodcast, userPodcast, editPodcast
 */

// ============================================================================
// BASE FIELD SCHEMAS (reusable building blocks)
// ============================================================================

/**
 * Basic podcast metadata fields
 */
const basicInfoFields = z.object({
  title: z.string()
    .min(3, 'Podcast title must be at least 3 characters long')
    .max(100, 'Podcast title is too long (maximum 100 characters)'),
  description: z.string()
    .min(10, 'Please provide a more detailed description (at least 10 characters)')
    .max(1000, 'Description is too long (maximum 1000 characters)'),
  language: z.enum(SUPPORTED_OUTPUT_LANGUAGES, {
    errorMap: () => ({ message: 'Please select a valid language' })
  }),
});

/**
 * Cover image fields
 */
const imageFields = z.object({
  cover_image: z.string().url('Please enter a valid image URL').optional().or(z.literal('')).nullable(),
  image_style: z.string().optional().nullable(),
});

/**
 * Schedule and automation fields
 */
const scheduleFields = z.object({
  episodeFrequency: z.number().int().min(1).max(30).default(7),
  autoGeneration: z.boolean().default(false).optional(),
});

/**
 * Podcast format fields
 */
const formatFields = z.object({
  podcastFormat: z.enum(['single-speaker', 'multi-speaker'], {
    errorMap: () => ({ message: 'Please select a podcast format' })
  }).default('multi-speaker'),
  speaker1Role: z.string().min(1, 'Please select a role for the first speaker'),
  speaker2Role: z.string().optional().nullable(),
});

/**
 * Style and customization fields
 */
const styleFields = z.object({
  conversationStyle: z.enum([
    'engaging', 'dynamic', 'enthusiastic', 'educational',
    'casual', 'professional', 'friendly', 'formal'
  ]).default('casual'),
  introPrompt: z.string().optional().nullable(),
  outroPrompt: z.string().optional().nullable(),
});

/**
 * Advanced admin-only fields
 */
const adminFields = z.object({
  creator: z.string()
    .min(2, 'Creator name must be at least 2 characters long')
    .max(100, 'Creator name is too long (maximum 100 characters)'),
  podcastName: z.string()
    .min(3, 'Technical name must be at least 3 characters long')
    .max(50, 'Technical name is too long (maximum 50 characters)')
    .regex(/^[a-z0-9-]+$/, 'Technical name can only contain lowercase letters, numbers, and hyphens (e.g., my-podcast-123)'),
  slogan: z.string().optional().nullable(),
  creativityLevel: z.number()
    .min(0, 'Creativity level must be between 0 and 1')
    .max(1, 'Creativity level must be between 0 and 1')
    .step(0.1)
    .default(0.5),
  mixingTechniques: z.array(z.string()).default(['casual_banter']),
  additionalInstructions: z.string().optional().nullable(),
});

// ============================================================================
// CONTENT SOURCE SCHEMAS (discriminated union)
// ============================================================================

/**
 * Telegram content source validation
 */
const telegramContentSource = z.object({
  contentSource: z.literal('telegram'),
  telegramChannelName: z.string().min(1, 'Please enter a Telegram channel name'),
  telegramHours: z.number()
    .int('Hours must be a whole number')
    .min(1, 'Hours must be at least 1')
    .max(168, 'Hours cannot exceed 1 week (168 hours)')
    .default(24), // Up to 1 week (168 hours)
  rssUrl: z.string().optional().nullable(), // Not used for telegram
});

/**
 * RSS content source validation
 */
const rssContentSource = z.object({
  contentSource: z.literal('rss'),
  telegramChannelName: z.string().optional().nullable(), // Not used for RSS
  telegramHours: z.number().optional().nullable(),
  rssUrl: z.string()
    .url('Please enter a valid RSS feed URL (must start with http:// or https://)')
    .min(1, 'RSS URL is required'),
});

/**
 * Content source discriminated union
 */
const contentSourceSchema = z.discriminatedUnion('contentSource', [
  telegramContentSource,
  rssContentSource,
]);

// ============================================================================
// COMPLETE FORM SCHEMAS
// ============================================================================

/**
 * Base podcast schema - includes all fields except admin-only
 * Used as foundation for user and premium forms
 */
export const basePodcastSchema = z.intersection(
  z.intersection(
    z.intersection(
      z.intersection(
        basicInfoFields,
        imageFields
      ),
      scheduleFields
    ),
    formatFields
  ),
  styleFields
).and(contentSourceSchema);

/**
 * Premium podcast schema - base + format selection
 * Used for premium users who get format selection but not full admin features
 */
export const premiumPodcastSchema = basePodcastSchema;

/**
 * User podcast schema - simplified for regular users
 * Hardcoded format, no style customization
 */
export const userPodcastSchema = z.intersection(
  z.intersection(
    z.intersection(
      basicInfoFields,
      imageFields
    ),
    scheduleFields
  ),
  contentSourceSchema
).and(
  z.object({
    // Hardcoded format for regular users (no selection UI)
    podcastFormat: z.literal('multi-speaker').default('multi-speaker'),
    speaker1Role: z.literal('Host').default('Host'),
    speaker2Role: z.literal('Co-host').default('Co-host'),
    conversationStyle: z.literal('casual').default('casual'),
  })
);

/**
 * Admin podcast schema - includes all fields
 * Used for admin forms with full customization
 */
export const adminPodcastSchema = z.intersection(
  basePodcastSchema,
  adminFields
);

/**
 * Edit podcast schema - all fields optional (partial update)
 * Allows editing any field including format (format can change after creation)
 */
export const editPodcastSchema = z.object({
  id: z.string(),
  ...basicInfoFields.partial().shape,
  ...imageFields.partial().shape,
  ...scheduleFields.partial().shape,
  ...formatFields.partial().shape,
  ...styleFields.partial().shape,
  contentSource: z.enum(['telegram', 'rss']).optional(),
  telegramChannelName: z.string().optional(),
  telegramHours: z.number().optional(),
  rssUrl: z.string().optional(),
  ...adminFields.partial().shape,
});

// ============================================================================
// VALIDATION REFINEMENTS (format-specific rules)
// ============================================================================

/**
 * Adds speaker2Role validation based on podcastFormat
 *
 * Rule: If podcastFormat is 'multi-speaker', speaker2Role is required
 */
function addFormatValidation<T extends z.ZodType>(schema: T) {
  return schema.superRefine((data: any, ctx) => {
    if (data.podcastFormat === 'multi-speaker' && !data.speaker2Role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a role for the second speaker (required for multi-speaker podcasts)',
        path: ['speaker2Role'],
      });
    }
  });
}

// Apply format validation to schemas that need it
export const basePodcastSchemaValidated = addFormatValidation(basePodcastSchema);
export const premiumPodcastSchemaValidated = addFormatValidation(premiumPodcastSchema);
export const adminPodcastSchemaValidated = addFormatValidation(adminPodcastSchema);
export const editPodcastSchemaValidated = addFormatValidation(editPodcastSchema);

// ============================================================================
// MULTI-LANGUAGE GROUP SCHEMAS (for admin multi-language creation)
// ============================================================================

/**
 * Language variant schema - individual podcast in a group
 */
export const languageVariantSchema = z.intersection(
  adminPodcastSchemaValidated,
  z.object({
    language_code: z.string().min(2, 'Language code is required'),
    is_primary: z.boolean().default(false),
  })
);

/**
 * Podcast group creation schema - group with multiple language variants
 */
export const podcastGroupCreationSchema = z.object({
  base_title: z.string().min(1, 'Base title is required'),
  base_description: z.string().optional().nullable(),
  base_cover_image: z.string().url('Must be a valid URL').optional().or(z.literal('')).nullable(),
  languages: z.array(languageVariantSchema).min(1, 'At least one language variant required'),
}).refine(
  (data) => data.languages.some((lang) => lang.is_primary),
  {
    message: 'At least one language must be marked as primary',
    path: ['languages'],
  }
);

// ============================================================================
// DEFAULT VALUES (reusable across forms)
// ============================================================================

/**
 * Default values for new podcast creation
 */
export const defaultPodcastValues = {
  title: '',
  description: '',
  language: 'english' as const,
  cover_image: '',
  image_style: null,
  episodeFrequency: 7,
  autoGeneration: false,
  podcastFormat: 'multi-speaker' as const,
  speaker1Role: 'Host',
  speaker2Role: 'Co-host',
  conversationStyle: 'casual' as const,
  introPrompt: null,
  outroPrompt: null,
  contentSource: 'telegram' as const,
  telegramChannelName: '',
  telegramHours: 24,
  rssUrl: null,
};

/**
 * Default admin-only field values
 */
export const defaultAdminValues = {
  creator: 'Admin',
  podcastName: '',
  slogan: null,
  creativityLevel: 0.5,
  mixingTechniques: ['casual_banter'],
  additionalInstructions: null,
};

/**
 * Default values for language variant in multi-language mode
 */
export const defaultLanguageVariantValues = {
  language_code: '',
  is_primary: false,
  ...defaultPodcastValues,
  ...defaultAdminValues,
};

/**
 * Default values for podcast group creation
 */
export const defaultPodcastGroupValues = {
  base_title: '',
  base_description: '',
  base_cover_image: '',
  languages: [
    {
      ...defaultLanguageVariantValues,
      is_primary: true, // First language is always primary
    },
  ],
};
