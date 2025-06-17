"""
Voice Configuration Module
Handles voice mappings and selection for different languages and genders
"""
from typing import Dict, Any
import hashlib
import random
from utils.logging import get_logger

logger = get_logger(__name__)

class VoiceConfigManager:
    """Manages voice configurations for multi-speaker TTS generation"""
    
    def __init__(self):
        """Initialize voice configuration mappings"""
        self.voice_config = {
            'hebrew': {
                'male': 'Algenib',      # Gravelly - distinctive male voice
                'female': 'Aoede',      # Breezy - clear female voice
                'instruction': "קרא בקול רם בטון חם ומזמין. חשוב מאוד: קרא בעברית בטבעיות!"
            },
            'english': {
                'male': 'Gacrux',       # Mature - clear male voice
                'female': 'Leda',       # Youthful - clear female voice  
                'instruction': "Read aloud in a warm, welcoming conversational tone:"
            },
            'default': {
                'male': 'Gacrux',       # Mature - works for most languages
                'female': 'Leda',       # Youthful - works for most languages
                'instruction': "Read aloud in a warm, welcoming tone:"
            }
        }
        
        # Gender-mapped Google TTS voices based on official documentation
        self.voice_gender_mapping = {
            # Female voices
            'Achernar': 'female',    # Soft
            'Aoede': 'female',       # Breezy  
            'Autonoe': 'female',     # Bright
            'Callirrhoe': 'female',  # Easy-going
            'Despina': 'female',     # Smooth
            'Erinome': 'female',     # Clear
            'Gacrux': 'female',      # Mature (Note: varies by language)
            'Kore': 'female',        # Firm
            'Laomedeia': 'female',   # Upbeat
            'Leda': 'female',        # Youthful
            'Pulcherrima': 'female', # Forward
            'Sulafat': 'female',     # Warm
            'Vindemiatrix': 'female', # Gentle
            'Zephyr': 'female',      # Bright
            
            # Male voices
            'Achird': 'male',        # Friendly
            'Algenib': 'male',       # Gravelly
            'Algieba': 'male',       # Smooth
            'Alnilam': 'male',       # Firm
            'Charon': 'male',        # Informative
            'Enceladus': 'male',     # Breathy
            'Fenrir': 'male',        # Excitable
            'Iapetus': 'male',       # Clear
            'Orus': 'male',          # Firm
            'Puck': 'male',          # Upbeat
            'Rasalgethi': 'male',    # Informative
            'Sadachbia': 'male',     # Lively
            'Sadaltager': 'male',    # Knowledgeable
            'Schedar': 'male',       # Even
            'Umbriel': 'male',       # Easy-going
            'Zubenelgenubi': 'male', # Casual
        }
        
        # Available voices lists by gender
        self.male_voices = [voice for voice, gender in self.voice_gender_mapping.items() if gender == 'male']
        self.female_voices = [voice for voice, gender in self.voice_gender_mapping.items() if gender == 'female']
    
    def get_voice_config_for_language(self, language: str) -> Dict[str, Any]:
        """
        Get voice configuration based on language
        
        Args:
            language: Target language code or name
            
        Returns:
            Voice configuration dictionary
        """
        lang_key = self._normalize_language(language)
        
        if lang_key in self.voice_config:
            config = self.voice_config[lang_key]
            logger.debug(f"[VOICE_CONFIG] Using {lang_key} voice configuration")
        else:
            config = self.voice_config['default']
            logger.debug(f"[VOICE_CONFIG] Language '{language}' not found, using default configuration")
        
        return config
    
    def get_voice_for_speaker(
        self, 
        language: str, 
        gender: str, 
        speaker_role: str = "Speaker",
        episode_id: str = None,
        randomize: bool = False
    ) -> str:
        """
        Get specific voice for a speaker based on language and gender
        
        Args:
            language: Target language
            gender: Speaker gender (male/female)
            speaker_role: Role name for logging
            episode_id: Episode ID for deterministic randomization
            randomize: Whether to randomize voice selection
            
        Returns:
            Voice name string
        """
        if randomize and episode_id:
            # Use deterministic randomization based on episode ID and speaker role
            voice = self._get_random_voice_for_gender(gender, episode_id, speaker_role)
            logger.debug(f"[VOICE_CONFIG] {speaker_role} ({gender}) → {voice} (randomized)")
            return voice
        else:
            # Use fixed voice configuration
            config = self.get_voice_config_for_language(language)
            gender_key = gender.lower()
            
            if gender_key in config:
                voice = config[gender_key]
                logger.debug(f"[VOICE_CONFIG] {speaker_role} ({gender}) → {voice} (fixed)")
                return voice
            else:
                # Fallback to male voice if gender not found
                fallback_voice = config.get('male', 'Gacrux')
                logger.warning(f"[VOICE_CONFIG] Gender '{gender}' not found, using fallback: {fallback_voice}")
                return fallback_voice
    
    def get_instruction_for_language(self, language: str) -> str:
        """
        Get language-specific instruction for TTS generation
        
        Args:
            language: Target language
            
        Returns:
            Instruction string
        """
        config = self.get_voice_config_for_language(language)
        instruction = config.get('instruction', 'Read aloud in a clear, natural tone:')
        
        logger.debug(f"[VOICE_CONFIG] Instruction for {language}: {instruction[:50]}...")
        return instruction
    
    def _normalize_language(self, language: str) -> str:
        """
        Normalize language code to internal key
        
        Args:
            language: Language code or name
            
        Returns:
            Normalized language key
        """
        language_lower = language.lower()
        
        # Hebrew variations
        if language_lower in ['he', 'hebrew', 'heb', 'עברית']:
            return 'hebrew'
        
        # English variations  
        if language_lower in ['en', 'english', 'eng']:
            return 'english'
        
        # Default for unknown languages
        return 'default'
    
    def _get_random_voice_for_gender(self, gender: str, episode_id: str, speaker_role: str) -> str:
        """
        Get a random voice for the specified gender using deterministic selection
        
        Args:
            gender: Target gender (male/female)
            episode_id: Episode ID for deterministic randomization
            speaker_role: Speaker role for additional entropy
            
        Returns:
            Random voice name for the specified gender
        """
        gender_key = gender.lower()
        
        # Get appropriate voice list based on gender
        if gender_key == 'female':
            voice_list = self.female_voices
        elif gender_key == 'male':
            voice_list = self.male_voices
        else:
            logger.warning(f"[VOICE_CONFIG] Unknown gender '{gender}', defaulting to male voices")
            voice_list = self.male_voices
        
        if not voice_list:
            logger.error(f"[VOICE_CONFIG] No voices available for gender '{gender}'")
            return 'Gacrux'  # Safe fallback
        
        # Create deterministic seed from episode_id and speaker_role
        seed_string = f"{episode_id}_{speaker_role}_{gender}"
        seed_hash = hashlib.md5(seed_string.encode()).hexdigest()
        seed = int(seed_hash[:8], 16)  # Use first 8 hex chars as integer seed
        
        # Use seeded random to ensure deterministic selection
        random.seed(seed)
        selected_voice = random.choice(voice_list)
        
        logger.debug(f"[VOICE_CONFIG] Random voice selection: seed='{seed_string}' → {selected_voice}")
        return selected_voice

    def validate_voice_name(self, voice_name: str) -> bool:
        """
        Validate if voice name is available
        
        Args:
            voice_name: Voice name to validate
            
        Returns:
            True if voice is available, False otherwise
        """
        return voice_name in self.voice_gender_mapping
    
    def get_all_voices_for_language(self, language: str) -> Dict[str, str]:
        """
        Get all available voices for a language
        
        Args:
            language: Target language
            
        Returns:
            Dictionary mapping gender to voice name
        """
        config = self.get_voice_config_for_language(language)
        return {
            'male': config.get('male', 'Gacrux'),
            'female': config.get('female', 'Leda')
        }
    
    def get_all_available_voices(self) -> Dict[str, str]:
        """
        Get all available voices with their gender mappings
        
        Returns:
            Dictionary mapping voice name to gender
        """
        return self.voice_gender_mapping.copy()
    
    def get_voices_by_gender(self, gender: str) -> list:
        """
        Get all voices for a specific gender
        
        Args:
            gender: Target gender (male/female)
            
        Returns:
            List of voice names for the specified gender
        """
        gender_key = gender.lower()
        if gender_key == 'male':
            return self.male_voices.copy()
        elif gender_key == 'female':
            return self.female_voices.copy()
        else:
            logger.warning(f"[VOICE_CONFIG] Unknown gender '{gender}', returning empty list")
            return [] 