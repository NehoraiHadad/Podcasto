"""
Voice Configuration Module
Handles voice mappings and selection for different languages and genders
"""
from typing import Dict, Any, Tuple
import hashlib
import random
from shared.utils.logging import get_logger

logger = get_logger(__name__)

class VoiceConfigManager:
    """Manages voice configurations for multi-speaker TTS generation"""
    
    def __init__(self):
        """Initialize voice configuration mappings"""
        self.voice_config = {
            'hebrew': {
                'male': 'Alnilam',
                'female': 'Aoede',
                'instruction': "קרא בקול רם בטון חם ומזמין בסגנון פודקאסט דינמי ואנרגטי. חשוב מאוד: קרא בעברית בטבעיות עם הפסקות טבעיות ואינטונציה מעניינת!",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace with dynamic energy',
                    'tone_style': 'with natural vocal variation and warm intonation',
                    'volume_style': 'speaking clearly with balanced presence'
                }
            },
            'english': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Read aloud in a warm, welcoming podcast conversational tone with natural pacing and engaging delivery:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and professional warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'spanish': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Lee en voz alta con un tono cálido y acogedor de podcast conversacional:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'french': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Lisez à voix haute sur un ton chaleureux et accueillant de podcast conversationnel:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'german': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Lesen Sie laut in einem warmen, einladenden Podcast-Gesprächston vor:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'italian': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Leggi ad alta voce con un tono caldo e accogliente da podcast conversazionale:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'portuguese': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Leia em voz alta com um tom caloroso e acolhedor de podcast conversacional:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'russian': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Читайте вслух теплым, приветливым разговорным тоном подкаста:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'polish': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Czytaj na głos ciepłym, przyjaznym tonem konwersacyjnym podcastu:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'dutch': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Lees hardop voor in een warme, gastvrije podcast conversatietoon:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'chinese': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "以温暖、友好的播客对话语调大声朗读:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'japanese': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "温かく親しみやすいポッドキャストの会話調で声に出して読んでください:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'korean': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "따뜻하고 친근한 팟캐스트 대화 톤으로 소리 내어 읽으세요:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'hindi': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "गर्मजोशी और स्वागत करने वाले पॉडकास्ट संवादात्मक स्वर में जोर से पढ़ें:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'arabic': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "اقرأ بصوت عالٍ بنبرة دافئة وترحيبية للمحادثة البودكاست:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'indonesian': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Bacalah dengan suara keras dengan nada percakapan podcast yang hangat dan ramah:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'turkish': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Sıcak, samimi bir podcast konuşma tonuyla yüksek sesle okuyun:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'vietnamese': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Đọc to với giọng điệu trò chuyện podcast ấm áp và thân thiện:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'thai': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "อ่านออกเสียงด้วยน้ำเสียงสนทนาพอดคาสต์ที่อบอุ่นและเป็นมิตร:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'greek': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Διαβάστε δυνατά με έναν ζεστό, φιλόξενο συνομιλητικό τόνο podcast:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'swedish': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Läs högt med en varm, välkomnande podcast-samtalston:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'ukrainian': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Читайте вголос теплим, привітним розмовним тоном подкасту:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'romanian': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Citiți cu voce tare într-un ton călduros și primitor de podcast conversațional:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'bengali': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "উষ্ণ, স্বাগত পডকাস্ট কথোপকথনের স্বরে জোরে পড়ুন:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'czech': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Čtěte nahlas teplým, vřelým podcastovým konverzačním tónem:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'danish': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Læs højt med en varm, velkommende podcast-samtale tone:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'finnish': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Lue ääneen lämpimällä, tervetulleella podcast-keskustelusävyllä:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'hungarian': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Olvassa fel hangosan meleg, barátságos podcast beszélgetős hangnemben:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'slovak': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Čítajte nahlas teplým, prívetivým podcastovým konverzačným tónom:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'tamil': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "சூடான, வரவேற்கும் பாட்காஸ்ட் உரையாடல் தொனியில் உரக்கப் படியுங்கள்:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'telugu': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "వెచ్చగా, స్వాగతించే పాడ్‌కాస్ట్ సంభాషణ స్వరంతో బిగ్గరగా చదవండి:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'marathi': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "उबदार, स्वागत करणार्‍या पॉडकास्ट संभाषणाच्या स्वरात मोठ्याने वाचा:",
                'speech_config': {
                    'pace_style': 'at a natural, conversational pace',
                    'tone_style': 'with natural vocal variation and warmth',
                    'volume_style': 'with balanced, clear volume'
                }
            },
            'default': {
                'male': 'Gacrux',
                'female': 'Leda',
                'instruction': "Read aloud in a warm, welcoming podcast tone with engaging delivery:",
                'speech_config': {
                    'pace_style': 'at a comfortable, slightly measured pace for clarity',
                    'tone_style': 'with natural vocal variation',
                    'volume_style': 'speaking clearly with slightly enhanced presence'
                }
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
            'Gacrux': 'male',        # Mature (FIXED: was incorrectly listed as female)
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
        
        # Content-type specific natural language style adjustments
        self.content_type_speech_adjustments = {
            # News content - authoritative and clear
            'news': {
                'pace_style': 'at a standard, professional news pace',
                'tone_style': 'with neutral authority and clear articulation',
                'volume_style': 'speaking with clear, authoritative delivery',
                'style_instruction': "Deliver as professional news content with authority and clarity in an engaging podcast format."
            },
            # Technology content - measured and informative
            'technology': {
                'pace_style': 'at a slightly slower, methodical pace for technical precision',
                'tone_style': 'with focused, informative clarity',
                'volume_style': 'speaking with focused, controlled delivery',
                'style_instruction': "Present technical information clearly and methodically in an accessible podcast style."
            },
            # Entertainment content - dynamic and engaging
            'entertainment': {
                'pace_style': 'at a slightly faster, more dynamic and energetic pace',
                'tone_style': 'with higher energy and engaging enthusiasm',
                'volume_style': 'speaking with expressive, animated volume',
                'style_instruction': "Deliver with enthusiasm and dynamic engagement in an entertaining podcast style."
            },
            # Finance content - confident and measured
            'finance': {
                'pace_style': 'at a measured, confident pace for financial precision',
                'tone_style': 'with slightly lower, authoritative confidence',
                'volume_style': 'speaking with controlled, professional delivery',
                'style_instruction': "Present financial information with confidence and precision in a professional podcast format."
            },
            # Default content adjustments
            'general': {
                'pace_style': 'at a comfortable, natural listening pace',
                'tone_style': 'with natural conversational warmth',
                'volume_style': 'speaking with balanced, pleasant volume',
                'style_instruction': "Maintain a natural, conversational podcast tone throughout with engaging delivery."
            }
        }
    
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
    
    def get_distinct_voices_for_speakers(
        self,
        language: str,
        speaker1_gender: str,
        speaker2_gender: str,
        speaker1_role: str = "Speaker1",
        speaker2_role: str = "Speaker2", 
        episode_id: str = None,
        randomize_speaker2: bool = False
    ) -> Tuple[str, str]:
        """
        Get distinct voices for two speakers, ensuring they are different
        
        Args:
            language: Target language
            speaker1_gender: First speaker gender
            speaker2_gender: Second speaker gender
            speaker1_role: First speaker role name
            speaker2_role: Second speaker role name
            episode_id: Episode ID for deterministic randomization
            randomize_speaker2: Whether to randomize second speaker voice
            
        Returns:
            Tuple of (speaker1_voice, speaker2_voice)
        """
        # Start with default voice selection
        if randomize_speaker2 and episode_id:
            # Speaker 1 uses fixed voice, Speaker 2 uses randomized voice
            speaker1_voice = self.get_voice_for_speaker(
                language, speaker1_gender, speaker1_role, episode_id, randomize=False
            )
            speaker2_voice = self._get_random_voice_for_gender(
                speaker2_gender, episode_id, speaker2_role
            )
        else:
            # Both use fixed configuration
            config = self.get_voice_config_for_language(language)
            speaker1_voice = config.get(speaker1_gender.lower(), config.get('male', 'Gacrux'))
            speaker2_voice = config.get(speaker2_gender.lower(), config.get('female', 'Leda'))
        
        # Ensure voices are different
        if speaker1_voice == speaker2_voice:
            logger.warning(f"[VOICE_CONFIG] Same voice detected ({speaker1_voice}), selecting alternative")
            speaker2_voice = self._get_alternative_voice(
                speaker2_gender, speaker1_voice, episode_id, speaker2_role
            )
        
        logger.info(f"[VOICE_CONFIG] Selected distinct voices: {speaker1_role}={speaker1_voice}, {speaker2_role}={speaker2_voice}")
        return speaker1_voice, speaker2_voice
    
    def _get_alternative_voice(
        self, 
        gender: str, 
        avoid_voice: str, 
        episode_id: str = None, 
        speaker_role: str = "Speaker"
    ) -> str:
        """
        Get an alternative voice for the specified gender, avoiding a specific voice
        
        Args:
            gender: Target gender
            avoid_voice: Voice to avoid
            episode_id: Episode ID for deterministic selection
            speaker_role: Speaker role for logging
            
        Returns:
            Alternative voice name
        """
        gender_key = gender.lower()
        
        # Get appropriate voice list based on gender
        if gender_key == 'female':
            voice_list = self.female_voices.copy()
        elif gender_key == 'male':
            voice_list = self.male_voices.copy()
        else:
            logger.warning(f"[VOICE_CONFIG] Unknown gender '{gender}', using male voices")
            voice_list = self.male_voices.copy()
        
        # Remove the voice to avoid
        if avoid_voice in voice_list:
            voice_list.remove(avoid_voice)
        
        if not voice_list:
            logger.error(f"[VOICE_CONFIG] No alternative voices available for gender '{gender}'")
            # Return a safe fallback that's different from avoid_voice
            return 'Leda' if avoid_voice != 'Leda' else 'Gacrux'
        
        # Use deterministic selection if episode_id provided
        if episode_id:
            seed_string = f"{episode_id}_{speaker_role}_{gender}_alt"
            seed_hash = hashlib.md5(seed_string.encode()).hexdigest()
            seed = int(seed_hash[:8], 16)
            random.seed(seed)
            selected_voice = random.choice(voice_list)
        else:
            # Use first available alternative
            selected_voice = voice_list[0]
        
        logger.debug(f"[VOICE_CONFIG] Alternative voice selected: {selected_voice} (avoiding {avoid_voice})")
        return selected_voice

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

        # Language variations mapping
        language_map = {
            # Hebrew
            'he': 'hebrew', 'hebrew': 'hebrew', 'heb': 'hebrew', 'עברית': 'hebrew',
            # English
            'en': 'english', 'english': 'english', 'eng': 'english',
            # Spanish
            'es': 'spanish', 'spanish': 'spanish', 'español': 'spanish',
            # French
            'fr': 'french', 'french': 'french', 'français': 'french',
            # German
            'de': 'german', 'german': 'german', 'deutsch': 'german',
            # Italian
            'it': 'italian', 'italian': 'italian', 'italiano': 'italian',
            # Portuguese
            'pt': 'portuguese', 'portuguese': 'portuguese', 'português': 'portuguese',
            # Russian
            'ru': 'russian', 'russian': 'russian', 'русский': 'russian',
            # Polish
            'pl': 'polish', 'polish': 'polish', 'polski': 'polish',
            # Dutch
            'nl': 'dutch', 'dutch': 'dutch', 'nederlands': 'dutch',
            # Chinese
            'zh': 'chinese', 'chinese': 'chinese', '中文': 'chinese', 'cmn': 'chinese',
            # Japanese
            'ja': 'japanese', 'japanese': 'japanese', '日本語': 'japanese',
            # Korean
            'ko': 'korean', 'korean': 'korean', '한국어': 'korean',
            # Hindi
            'hi': 'hindi', 'hindi': 'hindi', 'हिन्दी': 'hindi',
            # Arabic
            'ar': 'arabic', 'arabic': 'arabic', 'العربية': 'arabic',
            # Indonesian
            'id': 'indonesian', 'indonesian': 'indonesian', 'bahasa': 'indonesian',
            # Turkish
            'tr': 'turkish', 'turkish': 'turkish', 'türkçe': 'turkish',
            # Vietnamese
            'vi': 'vietnamese', 'vietnamese': 'vietnamese', 'tiếng việt': 'vietnamese',
            # Thai
            'th': 'thai', 'thai': 'thai', 'ไทย': 'thai',
            # Greek
            'el': 'greek', 'greek': 'greek', 'ελληνικά': 'greek',
            # Swedish
            'sv': 'swedish', 'swedish': 'swedish', 'svenska': 'swedish',
            # Ukrainian
            'uk': 'ukrainian', 'ukrainian': 'ukrainian', 'українська': 'ukrainian',
            # Romanian
            'ro': 'romanian', 'romanian': 'romanian', 'română': 'romanian',
            # Bengali
            'bn': 'bengali', 'bengali': 'bengali', 'বাংলা': 'bengali',
            # Czech
            'cs': 'czech', 'czech': 'czech', 'čeština': 'czech',
            # Danish
            'da': 'danish', 'danish': 'danish', 'dansk': 'danish',
            # Finnish
            'fi': 'finnish', 'finnish': 'finnish', 'suomi': 'finnish',
            # Hungarian
            'hu': 'hungarian', 'hungarian': 'hungarian', 'magyar': 'hungarian',
            # Slovak
            'sk': 'slovak', 'slovak': 'slovak', 'slovenčina': 'slovak',
            # Tamil
            'ta': 'tamil', 'tamil': 'tamil', 'தமிழ்': 'tamil',
            # Telugu
            'te': 'telugu', 'telugu': 'telugu', 'తెలుగు': 'telugu',
            # Marathi
            'mr': 'marathi', 'marathi': 'marathi', 'मराठी': 'marathi'
        }

        return language_map.get(language_lower, 'default')
    
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

    def get_speech_config_for_language(self, language: str) -> Dict[str, Any]:
        """
        Get natural language speech style descriptors for a language
        
        Args:
            language: Target language
            
        Returns:
            Dictionary with pace_style, tone_style, volume_style descriptors
        """
        config = self.get_voice_config_for_language(language)
        speech_config = config.get('speech_config', {})
        
        logger.debug(f"[VOICE_CONFIG] Speech style config for {language}: {speech_config}")
        return speech_config
    
    def get_content_aware_speech_adjustments(self, content_type: str) -> Dict[str, Any]:
        """
        Get content-type specific natural language style adjustments
        
        Args:
            content_type: Type of content (news, technology, entertainment, etc.)
            
        Returns:
            Dictionary with content-specific natural language style descriptors
        """
        content_key = content_type.lower()
        adjustments = self.content_type_speech_adjustments.get(content_key, 
                                                             self.content_type_speech_adjustments['general'])
        
        logger.debug(f"[VOICE_CONFIG] Content style adjustments for {content_type}: {adjustments}")
        return adjustments
    
    def build_enhanced_speech_config(self, language: str, content_type: str = 'general') -> Dict[str, Any]:
        """
        Build comprehensive speech style configuration combining language and content-type descriptors
        
        Args:
            language: Target language
            content_type: Type of content for specialized adjustments
            
        Returns:
            Combined speech configuration with natural language style descriptors
        """
        # Get base language style configuration
        base_config = self.get_speech_config_for_language(language)
        
        # Get content-specific style adjustments
        content_adjustments = self.get_content_aware_speech_adjustments(content_type)
        
        # Combine configurations with content adjustments taking priority
        enhanced_config = {
            'pace_style': content_adjustments.get('pace_style', base_config.get('pace_style', 'at a comfortable, natural pace')),
            'tone_style': content_adjustments.get('tone_style', base_config.get('tone_style', 'with natural vocal variation')),
            'volume_style': content_adjustments.get('volume_style', base_config.get('volume_style', 'speaking with balanced volume')),
            'style_instruction': content_adjustments.get('style_instruction', 
                                                       "Maintain a natural, conversational tone throughout."),
            'language_code': self._get_language_code_for_speech(language)
        }
        
        logger.info(f"[VOICE_CONFIG] Enhanced speech style config for {language}/{content_type}: {enhanced_config}")
        return enhanced_config
    
    def _get_language_code_for_speech(self, language: str) -> str:
        """
        Get BCP-47 language code for speech configuration

        Args:
            language: Language identifier

        Returns:
            BCP-47 formatted language code
        """
        lang_key = self._normalize_language(language)

        language_codes = {
            # GA Languages (23)
            'english': 'en-US',
            'arabic': 'ar-XA',
            'bengali': 'bn-IN',
            'chinese': 'cmn-CN',
            'czech': 'cs-CZ',
            'danish': 'da-DK',
            'dutch': 'nl-NL',
            'finnish': 'fi-FI',
            'french': 'fr-FR',
            'german': 'de-DE',
            'greek': 'el-GR',
            'hindi': 'hi-IN',
            'hungarian': 'hu-HU',
            'indonesian': 'id-ID',
            'italian': 'it-IT',
            'japanese': 'ja-JP',
            'korean': 'ko-KR',
            'polish': 'pl-PL',
            'portuguese': 'pt-BR',
            'russian': 'ru-RU',
            'slovak': 'sk-SK',
            'spanish': 'es-ES',
            'swedish': 'sv-SE',
            'turkish': 'tr-TR',
            # Preview Languages
            'hebrew': 'he-IL',
            'thai': 'th-TH',
            'ukrainian': 'uk-UA',
            'vietnamese': 'vi-VN',
            'romanian': 'ro-RO',
            'tamil': 'ta-IN',
            'telugu': 'te-IN',
            'marathi': 'mr-IN',
            'default': 'en-US'
        }

        return language_codes.get(lang_key, 'en-US') 