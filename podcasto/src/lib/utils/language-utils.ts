/**
 * Language utilities for multilingual podcast support
 */

export type LanguageCode = 'he' | 'en' | 'ar' | 'es' | 'fr' | 'de' | 'ru';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Supported languages configuration
 */
export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    direction: 'rtl'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr'
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    direction: 'rtl'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr'
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    direction: 'ltr'
  }
};

/**
 * Get language name from language code
 *
 * @param code - Language code
 * @returns Language name in English
 */
export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES[code as LanguageCode];
  return lang?.name || code;
}

/**
 * Get native language name from language code
 *
 * @param code - Language code
 * @returns Language name in its native form
 */
export function getLanguageNativeName(code: string): string {
  const lang = SUPPORTED_LANGUAGES[code as LanguageCode];
  return lang?.nativeName || code;
}

/**
 * Get language flag emoji from language code
 *
 * @param code - Language code
 * @returns Flag emoji
 */
export function getLanguageFlag(code: string): string {
  const lang = SUPPORTED_LANGUAGES[code as LanguageCode];
  return lang?.flag || '🌐';
}

/**
 * Get text direction for a language
 *
 * @param code - Language code
 * @returns 'ltr' or 'rtl'
 */
export function getLanguageDirection(code: string): 'ltr' | 'rtl' {
  const lang = SUPPORTED_LANGUAGES[code as LanguageCode];
  return lang?.direction || 'ltr';
}

/**
 * Get full language info
 *
 * @param code - Language code
 * @returns Language information object
 */
export function getLanguageInfo(code: string): LanguageInfo | null {
  return SUPPORTED_LANGUAGES[code as LanguageCode] || null;
}

/**
 * Get user's preferred language from browser or system
 *
 * @returns Language code
 */
export function getUserPreferredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';

  const browserLang = navigator.language.split('-')[0].toLowerCase();
  return (SUPPORTED_LANGUAGES[browserLang as LanguageCode] ? browserLang : 'en') as LanguageCode;
}

/**
 * Check if a language code is supported
 *
 * @param code - Language code to check
 * @returns true if supported, false otherwise
 */
export function isLanguageSupported(code: string): boolean {
  return code in SUPPORTED_LANGUAGES;
}

/**
 * Get all supported language codes
 *
 * @returns Array of language codes
 */
export function getSupportedLanguageCodes(): LanguageCode[] {
  return Object.keys(SUPPORTED_LANGUAGES) as LanguageCode[];
}

/**
 * Format language display text with flag
 *
 * @param code - Language code
 * @param useNative - Whether to use native name (default: false)
 * @returns Formatted string like "🇬🇧 English" or "🇮🇱 עברית"
 */
export function formatLanguageDisplay(code: string, useNative: boolean = false): string {
  const flag = getLanguageFlag(code);
  const name = useNative ? getLanguageNativeName(code) : getLanguageName(code);
  return `${flag} ${name}`;
}
