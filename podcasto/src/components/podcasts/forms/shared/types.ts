import { z } from 'zod';
import type { Control, UseFormReturn, FieldValues } from 'react-hook-form';
import {
  basePodcastSchemaValidated,
  premiumPodcastSchemaValidated,
  userPodcastSchema,
  adminPodcastSchemaValidated,
  editPodcastSchemaValidated,
  podcastGroupCreationSchema,
  languageVariantSchema,
} from './schemas';

/**
 * Shared TypeScript types for podcast forms
 *
 * This file defines all TypeScript interfaces and types used across
 * the modular podcast form architecture.
 */

// ============================================================================
// FORM DATA TYPES (inferred from Zod schemas)
// ============================================================================

/**
 * Base podcast form values - used for premium and regular users
 */
export type BasePodcastFormValues = z.infer<typeof basePodcastSchemaValidated>;

/**
 * Premium podcast form values - includes format selection
 */
export type PremiumPodcastFormValues = z.infer<typeof premiumPodcastSchemaValidated>;

/**
 * User podcast form values - simplified with hardcoded defaults
 */
export type UserPodcastFormValues = z.infer<typeof userPodcastSchema>;

/**
 * Admin podcast form values - full configuration
 */
export type AdminPodcastFormValues = z.infer<typeof adminPodcastSchemaValidated>;

/**
 * Edit podcast form values - all fields optional (partial update)
 */
export type EditPodcastFormValues = z.infer<typeof editPodcastSchemaValidated>;

/**
 * Language variant form values - for multi-language admin form
 */
export type LanguageVariantFormValues = z.infer<typeof languageVariantSchema>;

/**
 * Podcast group creation form values - group with multiple languages
 */
export type PodcastGroupCreationFormValues = z.infer<typeof podcastGroupCreationSchema>;

// ============================================================================
// FORM CONTROL TYPES (React Hook Form)
// ============================================================================

/**
 * Generic form control type for any form schema
 */
export type FormControl<T extends FieldValues = FieldValues> = Control<T>;

/**
 * Complete form return type for any form schema
 */
export type FormReturn<T extends FieldValues = FieldValues> = UseFormReturn<T>;

// ============================================================================
// FORM SECTION PROPS (for modular sections)
// ============================================================================

/**
 * Base props for all form sections
 */
export interface BaseFormSectionProps {
  control: FormControl;
  disabled?: boolean;
}

/**
 * Props for FormatSection with setValue for clearing speaker2Role
 */
export interface FormatSectionProps extends BaseFormSectionProps {
  setValue?: (name: string, value: any) => void;
}

/**
 * Props for ImageUploadSection with optional AI generation callback
 */
export interface ImageUploadSectionProps extends BaseFormSectionProps {
  onAiGenerate?: () => void;
}

// ============================================================================
// FORM MODE & CONTEXT
// ============================================================================

/**
 * Form mode - create vs edit
 */
export type FormMode = 'create' | 'edit';

/**
 * User type - determines which features are available
 */
export type UserType = 'admin' | 'premium' | 'regular';

/**
 * Form context - passed to composite forms to control behavior
 */
export interface FormContext {
  mode: FormMode;
  userType: UserType;
  podcastId?: string; // For edit mode
}

// ============================================================================
// CONTENT SOURCE TYPES
// ============================================================================

/**
 * Content source type - determines which fields are shown
 */
export type ContentSource = 'telegram' | 'rss';

/**
 * Telegram content configuration
 */
export interface TelegramContent {
  contentSource: 'telegram';
  telegramChannelName: string;
  telegramHours: number;
}

/**
 * RSS content configuration
 */
export interface RSSContent {
  contentSource: 'rss';
  rssUrl: string;
}

/**
 * Union of content source types
 */
export type ContentConfig = TelegramContent | RSSContent;

// ============================================================================
// PODCAST FORMAT TYPES
// ============================================================================

/**
 * Podcast format - single-speaker vs multi-speaker
 */
export type PodcastFormat = 'single-speaker' | 'multi-speaker';

/**
 * Speaker configuration
 */
export interface SpeakerConfig {
  speaker1Role: string;
  speaker2Role?: string | null;
}

/**
 * Format configuration with speakers
 */
export interface FormatConfig extends SpeakerConfig {
  podcastFormat: PodcastFormat;
}

// ============================================================================
// VALIDATION & ERROR HANDLING
// ============================================================================

/**
 * Validation result from form submission
 */
export interface ValidationResult {
  success: boolean;
  errors?: Record<string, string[]>;
}

/**
 * Form submission result
 */
export interface SubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
  validationErrors?: Record<string, string[]>;
}

// ============================================================================
// EPISODE & PODCAST DATA (from database)
// ============================================================================

/**
 * Podcast metadata from database
 */
export interface PodcastData {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  language: string;
  podcastFormat: PodcastFormat;
  speaker1Role: string;
  speaker2Role: string | null;
  episodeFrequency: number;
  autoGeneration: boolean;
  contentSource: ContentSource;
  created_at: string;
  updated_at: string;
}

/**
 * Episode count data (for format change validation)
 */
export interface EpisodeStats {
  total: number;
  published: number;
  pending: number;
}

// ============================================================================
// FORM COMPOSITION PROPS
// ============================================================================

/**
 * Props for admin podcast form composition
 */
export interface AdminPodcastFormProps {
  mode: 'create' | 'edit';
  podcast?: PodcastData;
  onSuccess?: (podcastId: string) => void;
  onCancel?: () => void;
}

/**
 * Props for premium podcast form composition
 */
export interface PremiumPodcastFormProps {
  onSuccess?: (podcastId: string) => void;
  onCancel?: () => void;
}

/**
 * Props for user podcast form composition
 */
export interface UserPodcastFormProps {
  onSuccess?: (podcastId: string) => void;
  onCancel?: () => void;
}

/**
 * Props for podcast edit form composition
 * Note: podcast is any to accept DB types - will be transformed internally
 */
export interface PodcastEditFormProps {
  podcast: any; // Accepts DB podcast type, transformed via podcastToFormValues
  episodeStats?: EpisodeStats;
  userType: UserType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================================
// LANGUAGE & MULTI-LANGUAGE TYPES
// ============================================================================

/**
 * Language variant data
 */
export interface LanguageVariant {
  language_code: string;
  is_primary: boolean;
  title: string;
  description: string;
  cover_image?: string | null;
  // ... includes all podcast config fields
}

/**
 * Podcast group data
 */
export interface PodcastGroup {
  id: string;
  base_title: string;
  base_description: string | null;
  base_cover_image: string | null;
  primary_language: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make specific fields required in a type
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific fields optional in a type
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract discriminated union member by discriminant value
 */
export type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends Record<K, V> ? T : never;
