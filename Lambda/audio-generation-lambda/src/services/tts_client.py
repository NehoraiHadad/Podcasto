"""
TTS Client Module
Handles core Google Gemini TTS API interactions for audio generation
"""
import os
from typing import Tuple
from google import genai
from google.genai import types
from utils.logging import get_logger
from utils.wav_utils import convert_to_wav, calculate_wav_duration
from services.voice_config import VoiceConfigManager
from services.hebrew_niqqud import HebrewNiqqudProcessor

logger = get_logger(__name__)

class GeminiTTSClient:
    """Client for Google Gemini TTS API interactions"""
    
    def __init__(self):
        """Initialize the Google Gemini TTS client"""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-pro-preview-tts"
        self.voice_manager = VoiceConfigManager()
        self.niqqud_processor = HebrewNiqqudProcessor()
        
        # Optimized generation settings to prevent silent audio
        self.temperature = 0.8  # CRITICAL: Higher temperature prevents silent generation
    
    def generate_single_audio(
        self,
        script_content: str,
        language: str,
        speaker1_role: str,
        speaker2_role: str,
        speaker1_gender: str,
        speaker2_gender: str,
        episode_id: str = None
    ) -> Tuple[bytes, int]:
        """
        Generate audio from script content using Google Gemini TTS
        
        Args:
            script_content: Text script to convert to audio
            language: Target language for generation
            speaker1_role: Role name for first speaker
            speaker2_role: Role name for second speaker
            speaker1_gender: Gender for first speaker (male/female)
            speaker2_gender: Gender for second speaker (male/female)
            episode_id: Episode ID for voice randomization
            
        Returns:
            Tuple of (audio_data_bytes, duration_seconds)
        """
        # Select distinct voices for both speakers to ensure they are different
        voice1, voice2 = self.voice_manager.get_distinct_voices_for_speakers(
            language=language,
            speaker1_gender=speaker1_gender,
            speaker2_gender=speaker2_gender,
            speaker1_role=speaker1_role,
            speaker2_role=speaker2_role,
            episode_id=episode_id,
            randomize_speaker2=bool(episode_id)
        )
        
        # Get language-specific instruction for TTS
        instruction = self.voice_manager.get_instruction_for_language(language)
        
        logger.info(f"[TTS_CLIENT] Using voices: {speaker1_role}={voice1} ({speaker1_gender}), {speaker2_role}={voice2} ({speaker2_gender})")
        
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
        
        # Process Hebrew text with niqqud for improved pronunciation
        processed_script = self.niqqud_processor.process_script_for_tts(script_content, language)
        
        # Prepare content with language-specific instructions
        full_prompt = f"{instruction}\n\n{processed_script}"
        
        # Add specific language guidance for Hebrew
        if language.lower() in ['he', 'hebrew', 'heb']:
            full_prompt = f"IMPORTANT: Read this conversation in Hebrew. Speak naturally in Hebrew with proper pronunciation.\n\n{full_prompt}"
        
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=full_prompt)],
            ),
        ]
        
        # Configure generation settings with optimized parameters
        generate_content_config = types.GenerateContentConfig(
            temperature=self.temperature,  # CRITICAL: Increased to prevent silent audio generation
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                    speaker_voice_configs=speaker_voice_configs
                ),
            ),
        )
        
        # Generate content using Gemini TTS
        logger.info(f"[TTS_CLIENT] Calling Gemini 2.5 pro TTS API...")
        
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
                
                logger.info(f"[TTS_CLIENT] Received audio data: {len(audio_data)} bytes, MIME type: {mime_type}")
                
                # Convert to WAV format using utility function
                wav_data = convert_to_wav(audio_data, mime_type)
                duration = calculate_wav_duration(wav_data)
                
                logger.info(f"[TTS_CLIENT] Generated {len(wav_data)} bytes of audio, duration: {duration}s")
                
                return wav_data, duration
            else:
                raise ValueError("No audio data in response")
                
        except Exception as e:
            logger.error(f"[TTS_CLIENT] Error during audio generation: {str(e)}")
            raise
    
    def generate_chunk_with_retry(
        self,
        chunk: str,
        chunk_num: int,
        language: str,
        speaker1_role: str,
        speaker2_role: str,
        speaker1_gender: str,
        speaker2_gender: str,
        episode_id: str = None,
        max_retries: int = 2
    ) -> Tuple[bytes, int] | None:
        """
        Generate a single chunk with retry logic - designed for parallel execution
        
        Args:
            chunk: Script chunk to process
            chunk_num: Chunk number for logging
            language: Target language
            speaker1_role: First speaker role
            speaker2_role: Second speaker role
            speaker1_gender: First speaker gender
            speaker2_gender: Second speaker gender
            episode_id: Episode ID for voice randomization
            max_retries: Maximum retry attempts
            
        Returns:
            Tuple of (audio_data, duration) or None if failed
        """
        logger.info(f"[TTS_CLIENT] Processing chunk {chunk_num} ({len(chunk)} chars)")
        
        for retry in range(max_retries + 1):
            try:
                audio_data, duration = self.generate_single_audio(
                    chunk, language, speaker1_role, speaker2_role,
                    speaker1_gender, speaker2_gender, episode_id
                )
                
                # Import chunk manager for validation
                from services.audio_chunk_manager import AudioChunkManager
                chunk_manager = AudioChunkManager()
                
                # Validate audio data before returning
                if chunk_manager.validate_audio_chunk(audio_data, duration, chunk_num):
                    logger.info(f"[TTS_CLIENT] Chunk {chunk_num} completed successfully: {duration}s")
                    return audio_data, duration
                else:
                    logger.warning(f"[TTS_CLIENT] Chunk {chunk_num} validation failed, retry {retry+1}/{max_retries}")
                    
            except Exception as e:
                logger.error(f"[TTS_CLIENT] Error processing chunk {chunk_num}, attempt {retry+1}: {str(e)}")
                if retry == max_retries:
                    logger.error(f"[TTS_CLIENT] Chunk {chunk_num} failed after {max_retries} retries")
        
        return None 