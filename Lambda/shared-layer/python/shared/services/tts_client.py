"""
TTS Client Module
Handles core Google Gemini TTS API interactions for audio generation
"""
import os
from typing import Tuple
from google import genai
from google.genai import types
from shared.utils.logging import get_logger
from shared.utils.wav_utils import convert_to_wav, calculate_wav_duration
from shared.services.voice_config import VoiceConfigManager
from shared.services.hebrew_niqqud import HebrewNiqqudProcessor
from shared.utils.rate_limiter import parse_retry_delay, TokenBucketRateLimiter
import time

logger = get_logger(__name__)

# Global rate-limiter shared across all Lambda invokes (execution context is reused)
_RATE_LIMITER = TokenBucketRateLimiter(
    max_tokens=int(os.getenv("TTS_REQUESTS_PER_MINUTE", "9")),  # stay below Google limit (10)
    refill_period=60,
)

class GeminiTTSClient:
    """Client for Google Gemini TTS API interactions"""
    
    def __init__(self):
        """Initialize the Google Gemini TTS client"""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-pro-tts"  # Updated from preview - now GA (Generally Available)
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
        episode_id: str = None,
        is_pre_processed: bool = False,
        speaker1_voice: str = None,
        speaker2_voice: str = None,
        content_type: str = 'general'
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
            is_pre_processed: Whether the script is already processed with niqqud (avoids double processing)
            speaker1_voice: Pre-selected voice for speaker 1 (overrides auto-selection for consistency)
            speaker2_voice: Pre-selected voice for speaker 2 (overrides auto-selection for consistency)
            content_type: Type of content being processed
            
        Returns:
            Tuple of (audio_data_bytes, duration_seconds)
        """
        # CRITICAL: Log all received parameters for debugging voice consistency
        logger.info(f"[TTS_CLIENT] ===== Voice Selection Debug =====")
        logger.info(f"[TTS_CLIENT] Received speaker1_voice: {speaker1_voice}")
        logger.info(f"[TTS_CLIENT] Received speaker2_voice: {speaker2_voice}")
        logger.info(f"[TTS_CLIENT] speaker1_role: {speaker1_role}")
        logger.info(f"[TTS_CLIENT] speaker2_role: {speaker2_role}")
        logger.info(f"[TTS_CLIENT] episode_id: {episode_id}")

        # Use pre-selected voices if provided (for consistency), otherwise select distinct voices
        if speaker1_voice and speaker2_voice:
            voice1, voice2 = speaker1_voice, speaker2_voice
            logger.info(f"[TTS_CLIENT] ✅ Using pre-selected voices for consistency:")
            logger.info(f"[TTS_CLIENT]    {speaker1_role} = {voice1}")
            logger.info(f"[TTS_CLIENT]    {speaker2_role} = {voice2}")
        else:
            # ⚠️ FALLBACK - This should NOT happen if voices were pre-selected properly
            logger.warning(f"[TTS_CLIENT] ⚠️⚠️⚠️ FALLBACK - Voices not provided, selecting now!")
            logger.warning(f"[TTS_CLIENT] This may cause voice inconsistency across chunks!")
            logger.warning(f"[TTS_CLIENT] Missing: speaker1_voice={speaker1_voice}, speaker2_voice={speaker2_voice}")

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
            logger.info(f"[TTS_CLIENT] Auto-selected distinct voices: {speaker1_role}={voice1}, {speaker2_role}={voice2}")

        logger.info(f"[TTS_CLIENT] ===== End Voice Selection =====")

        
                # Get enhanced speech configuration with content-aware parameters
        enhanced_speech_config = self.voice_manager.build_enhanced_speech_config(language, content_type)
        
        # Get language-specific instruction for TTS
        instruction = self.voice_manager.get_instruction_for_language(language)

        # Get enhanced natural language style descriptors
        pace_style = enhanced_speech_config.get('pace_style', 'at a natural, conversational pace')
        tone_style = enhanced_speech_config.get('tone_style', 'with natural vocal variation')
        volume_style = enhanced_speech_config.get('volume_style', 'speaking with balanced volume')
        content_style_instruction = enhanced_speech_config.get('style_instruction',
            "Maintain a natural, conversational tone throughout.")
        
        # Build comprehensive podcast-focused style instruction using natural language descriptors
        style_instruction = (
            f"PODCAST FORMAT: Read the following content in a relaxed, dynamic podcast tone {pace_style}. "
            f"Speak {tone_style} and {volume_style}. "
            "Use natural podcast pacing with subtle pauses, vary your intonation for engagement, "
            "create an intimate listening experience, and maintain a warm, inviting presence throughout. "
            "Think of yourself as a professional podcast host delivering content to engaged listeners. "
            f"{content_style_instruction}"
        )
        
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
        
        # Process Hebrew text with niqqud only if not already processed
        if is_pre_processed:
            logger.info(f"[TTS_CLIENT] Using pre-processed script (niqqud already applied)")
            processed_script = script_content
        else:
            logger.info(f"[TTS_CLIENT] Processing script for TTS (applying niqqud if needed)")
            processed_script = self.niqqud_processor.process_script_for_tts(script_content, language)
        
        # Prepare content with language-specific instructions
        full_prompt = f"{instruction}\n\n{style_instruction}\n\n{processed_script}"
        
        # Add specific language guidance for Hebrew
        if language.lower() in ['he', 'hebrew', 'heb']:
            full_prompt = f"IMPORTANT: Read this conversation in Hebrew. Speak naturally in Hebrew with proper pronunciation.\n\n{full_prompt}"
        
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=full_prompt)],
            ),
        ]
        
        # Configure generation settings with SpeechConfig for Gemini 2.5 TTS
        # Note: Gemini 2.5 TTS uses natural language prompts for style control
        # instead of traditional TTS parameters like speaking_rate, pitch, etc.
        speech_config = types.SpeechConfig(
            multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(
                speaker_voice_configs=speaker_voice_configs
            )
        )
        
        generate_content_config = types.GenerateContentConfig(
            temperature=self.temperature,  # CRITICAL: Increased to prevent silent audio generation
            top_p=0.95,  # Encourage more diverse, natural prosody
            response_modalities=["AUDIO"],
            speech_config=speech_config,
        )
        
        logger.info(f"[TTS_CLIENT] Natural language style descriptors applied:")
        logger.info(f"[TTS_CLIENT] - Pace: {pace_style}")
        logger.info(f"[TTS_CLIENT] - Tone: {tone_style}")
        logger.info(f"[TTS_CLIENT] - Volume: {volume_style}")
        logger.info(f"[TTS_CLIENT] - Language code: {enhanced_speech_config.get('language_code', 'en-US')}")
        logger.info(f"[TTS_CLIENT] - Content type: {content_type}")
        logger.info(f"[TTS_CLIENT] - Style instruction length: {len(style_instruction)} chars")
        
        # Generate content using Gemini TTS
        logger.info(f"[TTS_CLIENT] Calling Gemini 2.5 pro TTS API...")
        
        # Respect rate limits – block until a token is available.
        _RATE_LIMITER.acquire()

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
            # Enhanced handling for quota errors
            error_str = str(e)
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                delay = parse_retry_delay(error_str)
                logger.warning(f"[TTS_CLIENT] Rate limit hit – backing off for {delay}s")
                time.sleep(delay)
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
        is_pre_processed: bool = False,
        max_retries: int = 2,
        speaker1_voice: str = None,
        speaker2_voice: str = None,
        content_type: str = 'general'
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
            is_pre_processed: Whether the script is already processed with niqqud
            max_retries: Maximum retry attempts
            speaker1_voice: Pre-selected voice for speaker 1 (for consistency)
            speaker2_voice: Pre-selected voice for speaker 2 (for consistency)
            content_type: Type of content being processed
            
        Returns:
            Tuple of (audio_data, duration) or None if failed
        """
        logger.info(f"[TTS_CLIENT] ===== Processing Chunk {chunk_num} =====")
        logger.info(f"[TTS_CLIENT] Chunk size: {len(chunk)} chars")
        logger.info(f"[TTS_CLIENT] Pre-selected voices: speaker1={speaker1_voice}, speaker2={speaker2_voice}")
        logger.info(f"[TTS_CLIENT] Roles: {speaker1_role} / {speaker2_role}")

        for retry in range(max_retries + 1):
            try:
                logger.info(f"[TTS_CLIENT] Chunk {chunk_num} attempt {retry+1}/{max_retries+1}")
                audio_data, duration = self.generate_single_audio(
                    chunk, language, speaker1_role, speaker2_role,
                    speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
                    speaker1_voice, speaker2_voice, content_type
                )
                
                # Import chunk manager for validation
                from shared.services.audio_chunk_manager import AudioChunkManager
                chunk_manager = AudioChunkManager(max_chars_per_chunk=1000)

                # Validate audio data before returning (with silence detection enabled)
                if chunk_manager.validate_audio_chunk(audio_data, duration, chunk_num, check_silence=True):
                    logger.info(f"[TTS_CLIENT] ✅ Chunk {chunk_num} completed successfully: {duration}s")
                    logger.info(f"[TTS_CLIENT] Chunk {chunk_num} used voices: speaker1={speaker1_voice}, speaker2={speaker2_voice}")
                    return audio_data, duration
                else:
                    logger.warning(f"[TTS_CLIENT] ⚠️ Chunk {chunk_num} validation failed, retry {retry+1}/{max_retries}")
                    logger.warning(f"[TTS_CLIENT] Validation failed for voices: speaker1={speaker1_voice}, speaker2={speaker2_voice}")
                    
            except Exception as e:
                logger.error(f"[TTS_CLIENT] Error processing chunk {chunk_num}, attempt {retry+1}: {str(e)}")
                if retry == max_retries:
                    logger.error(f"[TTS_CLIENT] Chunk {chunk_num} failed after {max_retries} retries")
                else:
                    # If rate-limit was the cause, wait before next retry.
                    if "RESOURCE_EXHAUSTED" in str(e) or "429" in str(e):
                        sleep_for = parse_retry_delay(str(e))
                        logger.info(f"[TTS_CLIENT] Sleeping {sleep_for}s before retrying chunk {chunk_num}")
                        time.sleep(sleep_for)
        
        return None 