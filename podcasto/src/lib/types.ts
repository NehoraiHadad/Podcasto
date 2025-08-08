/**
 * Common types for the Podcasto application
 */

/**
 * Podcast data structure
 */
export interface Podcast {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  status?: string;
  timestamp?: string;
  duration?: number;
  [key: string]: string | number | Date | boolean | null | undefined;
}

/**
 * Episode data structure
 */
export interface Episode {
  id: string;
  podcast_id?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  language?: string | null;
  metadata?: string | null;
  audio_url?: string | null;
  duration?: number | null;
  published_at?: Date | null;
  created_at?: Date | null;
  cover_image?: string | null;
  [key: string]: unknown;
} 