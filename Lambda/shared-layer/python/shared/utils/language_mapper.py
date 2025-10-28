"""
Language Mapping Utilities

Provides bidirectional mapping between ISO 639-1 language codes
and full language names used by Google TTS API.

This unifies the language representation across the application.
"""

from typing import Literal

# Type definitions
LanguageCode = Literal[
    'ar',  # Arabic
    'bn',  # Bengali
    'zh',  # Chinese
    'cs',  # Czech
    'da',  # Danish
    'nl',  # Dutch
    'en',  # English
    'fi',  # Finnish
    'fr',  # French
    'de',  # German
    'el',  # Greek
    'he',  # Hebrew
    'hi',  # Hindi
    'hu',  # Hungarian
    'id',  # Indonesian
    'it',  # Italian
    'ja',  # Japanese
    'ko',  # Korean
    'mr',  # Marathi
    'pl',  # Polish
    'pt',  # Portuguese
    'ro',  # Romanian
    'ru',  # Russian
    'sk',  # Slovak
    'es',  # Spanish
    'sv',  # Swedish
    'ta',  # Tamil
    'te',  # Telugu
    'th',  # Thai
    'tr',  # Turkish
    'uk',  # Ukrainian
    'vi',  # Vietnamese
]

LanguageFullName = Literal[
    'arabic',
    'bengali',
    'chinese',
    'czech',
    'danish',
    'dutch',
    'english',
    'finnish',
    'french',
    'german',
    'greek',
    'hebrew',
    'hindi',
    'hungarian',
    'indonesian',
    'italian',
    'japanese',
    'korean',
    'marathi',
    'polish',
    'portuguese',
    'romanian',
    'russian',
    'slovak',
    'spanish',
    'swedish',
    'tamil',
    'telugu',
    'thai',
    'turkish',
    'ukrainian',
    'vietnamese',
]

# Mapping dictionaries
ISO_TO_FULL: dict[str, str] = {
    'ar': 'arabic',
    'bn': 'bengali',
    'zh': 'chinese',
    'cs': 'czech',
    'da': 'danish',
    'nl': 'dutch',
    'en': 'english',
    'fi': 'finnish',
    'fr': 'french',
    'de': 'german',
    'el': 'greek',
    'he': 'hebrew',
    'hi': 'hindi',
    'hu': 'hungarian',
    'id': 'indonesian',
    'it': 'italian',
    'ja': 'japanese',
    'ko': 'korean',
    'mr': 'marathi',
    'pl': 'polish',
    'pt': 'portuguese',
    'ro': 'romanian',
    'ru': 'russian',
    'sk': 'slovak',
    'es': 'spanish',
    'sv': 'swedish',
    'ta': 'tamil',
    'te': 'telugu',
    'th': 'thai',
    'tr': 'turkish',
    'uk': 'ukrainian',
    'vi': 'vietnamese',
}

FULL_TO_ISO: dict[str, str] = {
    'arabic': 'ar',
    'bengali': 'bn',
    'chinese': 'zh',
    'czech': 'cs',
    'danish': 'da',
    'dutch': 'nl',
    'english': 'en',
    'finnish': 'fi',
    'french': 'fr',
    'german': 'de',
    'greek': 'el',
    'hebrew': 'he',
    'hindi': 'hi',
    'hungarian': 'hu',
    'indonesian': 'id',
    'italian': 'it',
    'japanese': 'ja',
    'korean': 'ko',
    'marathi': 'mr',
    'polish': 'pl',
    'portuguese': 'pt',
    'romanian': 'ro',
    'russian': 'ru',
    'slovak': 'sk',
    'spanish': 'es',
    'swedish': 'sv',
    'tamil': 'ta',
    'telugu': 'te',
    'thai': 'th',
    'turkish': 'tr',
    'ukrainian': 'uk',
    'vietnamese': 'vi',
}


def language_code_to_full(code: str) -> str:
    """
    Convert ISO language code to full language name.

    Args:
        code: ISO 639-1 language code (e.g., 'he', 'en')

    Returns:
        Full language name (e.g., 'hebrew', 'english')
        Defaults to 'english' if code is not recognized

    Examples:
        >>> language_code_to_full('he')
        'hebrew'
        >>> language_code_to_full('en')
        'english'
    """
    normalized_code = code.lower()
    return ISO_TO_FULL.get(normalized_code, 'english')


def language_full_to_code(full_name: str) -> str:
    """
    Convert full language name to ISO language code.

    Args:
        full_name: Full language name (e.g., 'hebrew', 'english')

    Returns:
        ISO 639-1 language code (e.g., 'he', 'en')
        Defaults to 'en' if name is not recognized

    Examples:
        >>> language_full_to_code('hebrew')
        'he'
        >>> language_full_to_code('english')
        'en'
    """
    normalized_name = full_name.lower()
    return FULL_TO_ISO.get(normalized_name, 'en')


def is_valid_language_code(code: str) -> bool:
    """
    Check if a string is a valid ISO language code.

    Args:
        code: String to check

    Returns:
        True if valid ISO code, False otherwise
    """
    return code.lower() in ISO_TO_FULL


def is_valid_language_full_name(name: str) -> bool:
    """
    Check if a string is a valid full language name.

    Args:
        name: String to check

    Returns:
        True if valid full language name, False otherwise
    """
    return name.lower() in FULL_TO_ISO


def get_supported_language_codes() -> list[str]:
    """
    Get all supported language codes.

    Returns:
        List of all supported ISO language codes
    """
    return list(ISO_TO_FULL.keys())


def get_supported_language_full_names() -> list[str]:
    """
    Get all supported full language names.

    Returns:
        List of all supported full language names
    """
    return list(FULL_TO_ISO.keys())


def get_language_display_name(code: str) -> str:
    """
    Get language display name for UI.

    Args:
        code: ISO language code

    Returns:
        Capitalized language name for display

    Examples:
        >>> get_language_display_name('he')
        'Hebrew'
        >>> get_language_display_name('en')
        'English'
    """
    full_name = language_code_to_full(code)
    return full_name.capitalize()
