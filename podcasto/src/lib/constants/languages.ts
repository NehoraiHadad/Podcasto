/**
 * Language Constants
 *
 * Centralized language definitions for the entire application.
 * Based on Google Gemini 2.5 Pro TTS (GA - Generally Available)
 * https://cloud.google.com/text-to-speech/docs/gemini-tts#available_languages
 *
 * Model: gemini-2.5-pro-tts
 * Supports 71 languages total (23 GA + 48 Preview)
 */

/**
 * Supported output languages for podcast generation
 * These match the languages supported by Google Gemini 2.5 Pro TTS API
 *
 * Includes:
 * - All 23 GA (Generally Available) languages - production-ready, highest quality
 * - Popular Preview languages - experimental, may have lower quality
 */
export const SUPPORTED_OUTPUT_LANGUAGES = [
  // === GA Languages (23) - Production Ready ===
  'english',      // en-US (GA)
  'arabic',       // ar-XA (GA)
  'bengali',      // bn-IN (GA)
  'chinese',      // cmn-CN (GA)
  'czech',        // cs-CZ (GA)
  'danish',       // da-DK (GA)
  'dutch',        // nl-NL (GA)
  'finnish',      // fi-FI (GA)
  'french',       // fr-FR (GA)
  'german',       // de-DE (GA)
  'greek',        // el-GR (GA)
  'hindi',        // hi-IN (GA)
  'hungarian',    // hu-HU (GA)
  'indonesian',   // id-ID (GA)
  'italian',      // it-IT (GA)
  'japanese',     // ja-JP (GA)
  'korean',       // ko-KR (GA)
  'polish',       // pl-PL (GA)
  'portuguese',   // pt-BR (GA)
  'russian',      // ru-RU (GA)
  'slovak',       // sk-SK (GA)
  'spanish',      // es-ES (GA)
  'swedish',      // sv-SE (GA)
  'turkish',      // tr-TR (GA)

  // === Preview Languages (Popular) ===
  'hebrew',       // he-IL (Preview)
  'thai',         // th-TH (Preview)
  'ukrainian',    // uk-UA (Preview)
  'vietnamese',   // vi-VN (Preview)
  'romanian',     // ro-RO (Preview)
  'tamil',        // ta-IN (Preview)
  'telugu',       // te-IN (Preview)
  'marathi',      // mr-IN (Preview)

  // Additional 40 Preview languages available but not included by default:
  // Afrikaans, Albanian, Amharic, Armenian, Azerbaijani, Basque, Belarusian,
  // Bosnian, Bulgarian, Burmese, Catalan, Croatian, Estonian, Filipino,
  // Galician, Georgian, Gujarati, Icelandic, Irish, Javanese, Kannada,
  // Kazakh, Khmer, Lao, Latvian, Lithuanian, Macedonian, Malayalam,
  // Mongolian, Nepali, Norwegian, Pashto, Persian, Punjabi, Serbian, Sinhala,
  // Slovenian, Sundanese, Swahili, Urdu, Uzbek, Welsh, Zulu
] as const;

export type OutputLanguage = typeof SUPPORTED_OUTPUT_LANGUAGES[number];

/**
 * Human-readable language names with native script where applicable
 */
export const LANGUAGE_NAMES: Record<OutputLanguage, string> = {
  // GA Languages
  english: 'English',
  arabic: 'Arabic (العربية)',
  bengali: 'Bengali (বাংলা)',
  chinese: 'Chinese (中文)',
  czech: 'Czech (Čeština)',
  danish: 'Danish (Dansk)',
  dutch: 'Dutch (Nederlands)',
  finnish: 'Finnish (Suomi)',
  french: 'French (Français)',
  german: 'German (Deutsch)',
  greek: 'Greek (Ελληνικά)',
  hindi: 'Hindi (हिन्दी)',
  hungarian: 'Hungarian (Magyar)',
  indonesian: 'Indonesian (Bahasa Indonesia)',
  italian: 'Italian (Italiano)',
  japanese: 'Japanese (日本語)',
  korean: 'Korean (한국어)',
  polish: 'Polish (Polski)',
  portuguese: 'Portuguese (Português)',
  russian: 'Russian (Русский)',
  slovak: 'Slovak (Slovenčina)',
  spanish: 'Spanish (Español)',
  swedish: 'Swedish (Svenska)',
  turkish: 'Turkish (Türkçe)',

  // Preview Languages
  hebrew: 'Hebrew (עברית)',
  thai: 'Thai (ไทย)',
  ukrainian: 'Ukrainian (Українська)',
  vietnamese: 'Vietnamese (Tiếng Việt)',
  romanian: 'Romanian (Română)',
  tamil: 'Tamil (தமிழ்)',
  telugu: 'Telugu (తెలుగు)',
  marathi: 'Marathi (मराठी)',
};
