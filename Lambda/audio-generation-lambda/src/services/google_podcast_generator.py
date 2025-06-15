"""
Google Podcast Generator Service
Uses Google Gemini 2.5 Flash TTS for multi-speaker podcast generation
"""
import os
from typing import Dict, Any, List, Tuple

from google import genai
from google.genai import types
from utils.logging import get_logger
from utils.wav_utils import convert_to_wav, calculate_wav_duration, concatenate_wav_files

logger = get_logger(__name__)

class GooglePodcastGenerator:
    """Generates podcast audio using Google Gemini 2.5 Flash TTS"""
    
    def __init__(self):
        """Initialize the Google Gemini client"""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash-preview-tts"
        
        # Define voice mappings for male/female speakers by language
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
        
        # Available Google TTS voices for reference:
        # Zephyr (Bright), Puck (Upbeat), Charon (Informative), Kore (Firm), 
        # Fenrir (Excitable), Aoede (Breezy), Enceladus (Breathy), Algieba (Smooth),
        # Algenib (Gravelly), Achernar (Soft), Gacrux (Mature), Zubenelgenubi (Casual),
        # Sadaltager (Knowledgeable), Achird (Friendly), Sadachbia (Lively),
        # Autonoe (Bright), Callirrhoe (Easy-going), Leda (Youthful), Iapetus (Clear),
        # Despina (Smooth), Rasalgethi (Informative), Alnilam (Firm), 
        # Pulcherrima (Forward), Vindemiatrix (Gentle), Sulafat (Warm),
        # Orus (Firm), Umbriel (Easy-going), Erinome (Clear), Laomedeia (Upbeat), 
        # Schedar (Even)
        
    def generate_podcast_audio(
        self, 
        script_content: str,
        language: str = "he",
        speaker1_role: str = "Speaker 1", 
        speaker2_role: str = "Speaker 2",
        speaker1_gender: str = "male",
        speaker2_gender: str = "female"
    ) -> Tuple[bytes, int]:
        """Generate podcast audio with gender-aware voice selection"""
        
        logger.info(f"[GOOGLE_TTS] Starting podcast audio generation")
        logger.info(f"[GOOGLE_TTS] Language: {language}")
        logger.info(f"[GOOGLE_TTS] Speakers: {speaker1_role} ({speaker1_gender}), {speaker2_role} ({speaker2_gender})")
        logger.info(f"[GOOGLE_TTS] Content length: {len(script_content)} characters")
        
        # Check if content is too long and needs chunking
        max_chars_per_chunk = 3000  # Google Gemini has character limits
        
        if len(script_content) > max_chars_per_chunk:
            logger.info(f"[GOOGLE_TTS] Content too long ({len(script_content)} chars), splitting into chunks")
            return self._generate_chunked_audio(
                script_content, language, speaker1_role, speaker2_role, 
                speaker1_gender, speaker2_gender, max_chars_per_chunk
            )
        else:
            logger.info(f"[GOOGLE_TTS] Generating single audio chunk")
            return self._generate_single_audio(
                script_content, language, speaker1_role, speaker2_role,
                speaker1_gender, speaker2_gender
            )
    
    def _generate_chunked_audio(
        self,
        script_content: str,
        language: str,
        speaker1_role: str,
        speaker2_role: str,
        speaker1_gender: str,
        speaker2_gender: str,
        max_chars: int
    ) -> Tuple[bytes, int]:
        """Generate audio in chunks and concatenate"""
        
        chunks = self._split_script_into_chunks(script_content, max_chars)
        logger.info(f"[GOOGLE_TTS] Split content into {len(chunks)} chunks")
        
        all_audio_data = []
        
        for i, chunk in enumerate(chunks):
            logger.info(f"[GOOGLE_TTS] Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars)")
            
            try:
                audio_data, duration = self._generate_single_audio(
                    chunk, language, speaker1_role, speaker2_role,
                    speaker1_gender, speaker2_gender
                )
                all_audio_data.append(audio_data)
                
                logger.info(f"[GOOGLE_TTS] Chunk {i+1} completed: {duration}s")
                
            except Exception as e:
                logger.error(f"[GOOGLE_TTS] Error processing chunk {i+1}: {str(e)}")
                continue
        
        if not all_audio_data:
            raise Exception("Failed to generate any audio chunks")
        
        # Concatenate all audio data using utility function
        final_audio, calculated_duration = concatenate_wav_files(all_audio_data)
        
        logger.info(f"[GOOGLE_TTS] Generated {len(final_audio)} bytes of audio from {len(chunks)} chunks")
        
        return final_audio, calculated_duration
    
    def _split_script_into_chunks(self, script: str, max_chars: int) -> List[str]:
        """Split script into chunks at speaker boundaries"""
        
        lines = script.split('\n')
        chunks = []
        current_chunk = []
        current_length = 0
        
        for line in lines:
            line_length = len(line) + 1  # +1 for newline
            
            if current_length + line_length > max_chars and current_chunk:
                chunks.append('\n'.join(current_chunk))
                current_chunk = [line]
                current_length = line_length
            else:
                current_chunk.append(line)
                current_length += line_length
        
        if current_chunk:
            chunks.append('\n'.join(current_chunk))
        
        return chunks
    
    def _get_voice_config_for_language(self, language: str) -> Dict[str, Any]:
        """Get voice configuration based on language"""
        lang_key = 'hebrew' if language.lower() in ['he', 'hebrew', 'heb'] else 'english'
        if lang_key not in self.voice_config:
            lang_key = 'default'
        return self.voice_config[lang_key]
    
    def _generate_single_audio(
        self,
        script_content: str,
        language: str,
        speaker1_role: str,
        speaker2_role: str,
        speaker1_gender: str,
        speaker2_gender: str
    ) -> Tuple[bytes, int]:
        """Generate podcast audio from script content with gender-aware multi-speaker support"""
        
        voice_config = self._get_voice_config_for_language(language)
        
        # Select voices based on gender
        voice1 = voice_config[speaker1_gender.lower()]
        voice2 = voice_config[speaker2_gender.lower()]
        instruction = voice_config['instruction']
        
        logger.info(f"[GOOGLE_TTS] Using voices: {speaker1_role}={voice1} ({speaker1_gender}), {speaker2_role}={voice2} ({speaker2_gender})")
        
        # Build speaker voice configurations
        speaker_voice_configs = [
            types.SpeakerVoiceConfig(
                speaker=speaker1_role,
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice1)
                ),
            ),
            types.SpeakerVoiceConfig(
                speaker=speaker2_role,
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice2)
                ),
            ),
        ]
        
        # Prepare content with language-specific instructions
        full_prompt = f"{instruction}\n\n{script_content}"
        
        # Add specific language guidance
        if language.lower() in ['he', 'hebrew', 'heb']:
            full_prompt = f"IMPORTANT: Read this conversation in Hebrew. Speak naturally in Hebrew.\n\n{full_prompt}"
        
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=full_prompt)],
            ),
        ]
        
        # Configure generation settings following Google's best practices
        generate_content_config = types.GenerateContentConfig(
            temperature=0.7,  # Slightly lower for more consistent speech
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                    speaker_voice_configs=speaker_voice_configs
                ),
            ),
        )
        
        # Generate content using Gemini TTS
        logger.info(f"[GOOGLE_TTS] Calling Gemini 2.5 Flash TTS API...")
        
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=generate_content_config,
            )
            
            # Extract audio data from response
            if (response.candidates and 
                response.candidates[0].content and 
                response.candidates[0].content.parts and
                response.candidates[0].content.parts[0].inline_data):
                
                inline_data = response.candidates[0].content.parts[0].inline_data
                audio_data = inline_data.data
                mime_type = inline_data.mime_type
                
                logger.info(f"[GOOGLE_TTS] Received audio data: {len(audio_data)} bytes, MIME type: {mime_type}")
                
                # Convert to WAV format using utility function
                wav_data = convert_to_wav(audio_data, mime_type)
                duration = calculate_wav_duration(wav_data)
                
                logger.info(f"[GOOGLE_TTS] Generated {len(wav_data)} bytes of audio, duration: {duration}s")
                
                return wav_data, duration
            else:
                raise ValueError("No audio data in response")
                
        except Exception as e:
            logger.error(f"[GOOGLE_TTS] Error during audio generation: {str(e)}")
            raise 