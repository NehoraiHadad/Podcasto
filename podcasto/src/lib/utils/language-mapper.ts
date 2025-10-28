/**
 * Language Mapping Utilities
 *
 * Provides bidirectional mapping between ISO 639-1 language codes
 * and full language names used by Google TTS API.
 *
 * This unifies the language representation across the application.
 */

/**
 * ISO 639-1 language codes supported by the application
 */
export type LanguageCode =
  | 'ar' // Arabic
  | 'bn' // Bengali
  | 'zh' // Chinese
  | 'cs' // Czech
  | 'da' // Danish
  | 'nl' // Dutch
  | 'en' // English
  | 'fi' // Finnish
  | 'fr' // French
  | 'de' // German
  | 'el' // Greek
  | 'he' // Hebrew
  | 'hi' // Hindi
  | 'hu' // Hungarian
  | 'id' // Indonesian
  | 'it' // Italian
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'mr' // Marathi
  | 'pl' // Polish
  | 'pt' // Portuguese
  | 'ro' // Romanian
  | 'ru' // Russian
  | 'sk' // Slovak
  | 'es' // Spanish
  | 'sv' // Swedish
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'th' // Thai
  | 'tr' // Turkish
  | 'uk' // Ukrainian
  | 'vi'; // Vietnamese

/**
 * Full language names as used by Google TTS API
 */
export type LanguageFullName =
  | 'arabic'
  | 'bengali'
  | 'chinese'
  | 'czech'
  | 'danish'
  | 'dutch'
  | 'english'
  | 'finnish'
  | 'french'
  | 'german'
  | 'greek'
  | 'hebrew'
  | 'hindi'
  | 'hungarian'
  | 'indonesian'
  | 'italian'
  | 'japanese'
  | 'korean'
  | 'marathi'
  | 'polish'
  | 'portuguese'
  | 'romanian'
  | 'russian'
  | 'slovak'
  | 'spanish'
  | 'swedish'
  | 'tamil'
  | 'telugu'
  | 'thai'
  | 'turkish'
  | 'ukrainian'
  | 'vietnamese';

/**
 * Mapping from ISO language codes to full language names
 */
const ISO_TO_FULL: Record<LanguageCode, LanguageFullName> = {
  ar: 'arabic',
  bn: 'bengali',
  zh: 'chinese',
  cs: 'czech',
  da: 'danish',
  nl: 'dutch',
  en: 'english',
  fi: 'finnish',
  fr: 'french',
  de: 'german',
  el: 'greek',
  he: 'hebrew',
  hi: 'hindi',
  hu: 'hungarian',
  id: 'indonesian',
  it: 'italian',
  ja: 'japanese',
  ko: 'korean',
  mr: 'marathi',
  pl: 'polish',
  pt: 'portuguese',
  ro: 'romanian',
  ru: 'russian',
  sk: 'slovak',
  es: 'spanish',
  sv: 'swedish',
  ta: 'tamil',
  te: 'telugu',
  th: 'thai',
  tr: 'turkish',
  uk: 'ukrainian',
  vi: 'vietnamese',
};

/**
 * Mapping from full language names to ISO codes
 */
const FULL_TO_ISO: Record<LanguageFullName, LanguageCode> = {
  arabic: 'ar',
  bengali: 'bn',
  chinese: 'zh',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  finnish: 'fi',
  french: 'fr',
  german: 'de',
  greek: 'el',
  hebrew: 'he',
  hindi: 'hi',
  hungarian: 'hu',
  indonesian: 'id',
  italian: 'it',
  japanese: 'ja',
  korean: 'ko',
  marathi: 'mr',
  polish: 'pl',
  portuguese: 'pt',
  romanian: 'ro',
  russian: 'ru',
  slovak: 'sk',
  spanish: 'es',
  swedish: 'sv',
  tamil: 'ta',
  telugu: 'te',
  thai: 'th',
  turkish: 'tr',
  ukrainian: 'uk',
  vietnamese: 'vi',
};

/**
 * Convert ISO language code to full language name
 * @param code - ISO 639-1 language code (e.g., 'en', 'he')
 * @returns Full language name (e.g., 'english', 'hebrew')
 * @default 'english' - Returns English if code is not recognized
 * @example
 * languageCodeToFull('en') // returns 'english'
 * languageCodeToFull('he') // returns 'hebrew'
 */
export function languageCodeToFull(code: string): LanguageFullName {
  const normalizedCode = code.toLowerCase() as LanguageCode;
  return ISO_TO_FULL[normalizedCode] || 'english';
}

/**
 * Convert full language name to ISO language code
 * @param fullName - Full language name (e.g., 'hebrew', 'english')
 * @returns ISO 639-1 language code (e.g., 'he', 'en')
 * @example
 * languageFullToCode('hebrew') // returns 'he'
 * languageFullToCode('english') // returns 'en'
 */
export function languageFullToCode(fullName: string): LanguageCode {
  const normalizedName = fullName.toLowerCase() as LanguageFullName;
  return FULL_TO_ISO[normalizedName] || 'en';
}

/**
 * Check if a string is a valid ISO language code
 * @param code - String to check
 * @returns True if valid ISO code
 */
export function isValidLanguageCode(code: string): code is LanguageCode {
  return code.toLowerCase() in ISO_TO_FULL;
}

/**
 * Check if a string is a valid full language name
 * @param name - String to check
 * @returns True if valid full language name
 */
export function isValidLanguageFullName(name: string): name is LanguageFullName {
  return name.toLowerCase() in FULL_TO_ISO;
}

/**
 * Get all supported language codes
 * @returns Array of all supported ISO language codes
 */
export function getSupportedLanguageCodes(): LanguageCode[] {
  return Object.keys(ISO_TO_FULL) as LanguageCode[];
}

/**
 * Get all supported full language names
 * @returns Array of all supported full language names
 */
export function getSupportedLanguageFullNames(): LanguageFullName[] {
  return Object.keys(FULL_TO_ISO) as LanguageFullName[];
}

/**
 * Get language display name for UI
 * @param code - ISO language code
 * @returns Capitalized language name for display
 * @example
 * getLanguageDisplayName('he') // returns 'Hebrew'
 * getLanguageDisplayName('en') // returns 'English'
 */
export function getLanguageDisplayName(code: string): string {
  const fullName = languageCodeToFull(code);
  return fullName.charAt(0).toUpperCase() + fullName.slice(1);
}
