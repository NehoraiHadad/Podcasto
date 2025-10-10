/**
 * Style presets for podcast cover image generation
 * Each style includes a prompt modifier and description
 */

export interface ImageStyle {
  id: string;
  label: string;
  description: string;
  promptModifier: string;
}

export const PODCAST_IMAGE_STYLES: ImageStyle[] = [
  {
    id: 'modern-professional',
    label: 'Modern & Professional',
    description: 'Clean, contemporary design suitable for business podcasts',
    promptModifier: 'modern, professional, clean lines, corporate aesthetic, polished'
  },
  {
    id: 'minimalist',
    label: 'Minimalist & Clean',
    description: 'Simple, focused design with plenty of negative space',
    promptModifier: 'minimalist, clean, simple, elegant, plenty of white space, refined'
  },
  {
    id: 'bold-colorful',
    label: 'Bold & Colorful',
    description: 'Vibrant, eye-catching colors that stand out',
    promptModifier: 'bold, vibrant colors, high contrast, energetic, eye-catching, dynamic'
  },
  {
    id: 'dark-dramatic',
    label: 'Dark & Dramatic',
    description: 'Moody, cinematic atmosphere with deep tones',
    promptModifier: 'dark, dramatic, moody, cinematic, deep tones, mysterious, atmospheric'
  },
  {
    id: 'vintage-retro',
    label: 'Vintage & Retro',
    description: 'Nostalgic design inspired by classic aesthetics',
    promptModifier: 'vintage, retro, nostalgic, classic aesthetic, aged, timeless'
  },
  {
    id: 'tech-futuristic',
    label: 'Tech & Futuristic',
    description: 'Cutting-edge, digital-inspired design',
    promptModifier: 'futuristic, tech-inspired, digital, sleek, innovative, modern technology'
  },
  {
    id: 'warm-friendly',
    label: 'Warm & Friendly',
    description: 'Inviting, approachable design with warm tones',
    promptModifier: 'warm, friendly, inviting, approachable, cozy, welcoming, soft tones'
  },
  {
    id: 'abstract-artistic',
    label: 'Abstract & Artistic',
    description: 'Creative, unique design with artistic flair',
    promptModifier: 'abstract, artistic, creative, unique, expressive, imaginative'
  }
];

/**
 * Get style by ID
 */
export function getStyleById(id: string): ImageStyle | undefined {
  return PODCAST_IMAGE_STYLES.find(style => style.id === id);
}

/**
 * Get default style
 */
export function getDefaultStyle(): ImageStyle {
  return PODCAST_IMAGE_STYLES[0]; // Modern & Professional
}

/**
 * Variation count options with pricing
 */
export interface VariationOption {
  count: number;
  cost: number;
  label: string;
}

export const VARIATION_OPTIONS: VariationOption[] = [
  { count: 1, cost: 0.04, label: '1 image ($0.04)' },
  { count: 2, cost: 0.08, label: '2 images ($0.08)' },
  { count: 3, cost: 0.12, label: '3 images ($0.12)' }
];
