"""
TTS Client Module
Handles core Google Gemini TTS API interactions for audio generation
Updated: 2025-10-24 - Using Gemini AI API only (not Vertex AI)
Updated: 2025-10-27 - Added timeout protection and smart retry logic
"""
import os
import concurrent.futures
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

class DeferrableError(Exception):
    """
    Exception indicating that the operation should be deferred (episode returned to script_ready)
    instead of being marked as failed. Used for transient errors that may resolve on retry.
    """
    pass

# Global rate-limiter shared across all Lambda invokes (execution context is reused)
_RATE_LIMITER = TokenBucketRateLimiter(
    max_tokens=int(os.getenv("TTS_REQUESTS_PER_MINUTE", "9")),  # stay below Google limit (10)
    refill_period=60,
)

# Timeout for individual TTS API calls
# Normal processing: 60-86 seconds
# With delays: up to 5-7 minutes observed
# Setting to 480s (8 minutes) to allow for legitimate slow responses
# Lambda has 15 minutes (900s) total, so this leaves room for retries
TTS_CALL_TIMEOUT_SECONDS = 480

class GeminiTTSClient:
    """Client for Google Gemini TTS API interactions"""
    
    def __init__(self):
        """Initialize the Google Gemini TTS client"""
        # Check if we should use Vertex AI
        use_vertexai = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "false").lower() == "true"

        if use_vertexai:
            # Vertex AI Express Mode - uses API key instead of Service Account
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable is required when using Vertex AI Express Mode")

            self.client = genai.Client(
                vertexai=True,
                api_key=api_key
            )
            self.model = "gemini-2.5-pro-tts"  # GA model available in Vertex AI
            logger.info(f"[TTS_CLIENT] Using Vertex AI Express Mode with API key (model={self.model})")
        else:
            # Standard Gemini AI API configuration
            api_key = os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable is required")

            self.client = genai.Client(api_key=api_key)
            self.model = "gemini-2.5-pro-preview-tts"  # Preview model for Gemini AI API
            logger.info(f"[TTS_CLIENT] Using Gemini AI API (model={self.model})")

        self.voice_manager = VoiceConfigManager()
        self.niqqud_processor = HebrewNiqqudProcessor()

        # Optimized generation settings to prevent silent audio
        self.temperature = 0.8  # CRITICAL: Higher temperature prevents silent generation

    def _call_gemini_with_timeout(self, contents, config) -> any:
        """
        Call Gemini API with timeout protection to prevent Lambda hanging

        Args:
            contents: Content to send to Gemini
            config: Generation configuration

        Returns:
            Gemini API response

        Raises:
            DeferrableError: If timeout occurs (episode should be deferred)
            Exception: Other Gemini API errors
        """
        def _make_api_call():
            return self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )

        # Use ThreadPoolExecutor with timeout to prevent indefinite hanging
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_make_api_call)
            try:
                response = future.result(timeout=TTS_CALL_TIMEOUT_SECONDS)
                return response
            except concurrent.futures.TimeoutError:
                # Cancel the future (doesn't stop the thread, but marks it as cancelled)
                future.cancel()
                logger.error(f"[TTS_CLIENT] Gemini API call timed out after {TTS_CALL_TIMEOUT_SECONDS}s")
                logger.warning(f"[TTS_CLIENT] Background thread may still be running (Python limitation)")
                raise DeferrableError(
                    f"Gemini TTS API hung for >{TTS_CALL_TIMEOUT_SECONDS}s. "
                    "Episode deferred to script_ready for retry."
                )

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
            # Call Gemini API with timeout protection
            response = self._call_gemini_with_timeout(contents, generate_content_config)

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

        except DeferrableError:
            # Timeout occurred - re-raise to defer episode
            raise
        except Exception as e:
            # Smart error handling based on error type
            error_str = str(e)

            # 429 Rate Limit - Use Google's retry-after delay (no immediate retry)
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                delay = parse_retry_delay(error_str)
                logger.warning(f"[TTS_CLIENT] Rate limit (429) - Google suggests {delay}s delay")
                # Convert 429 to DeferrableError so episode gets deferred instead of immediate retry
                raise DeferrableError(
                    f"Rate limit exceeded (429). Defer episode for {delay}s before retry."
                )

            # 500 Internal Server Error - Transient Google error, allow one immediate retry
            elif "500" in error_str or "Internal error" in error_str:
                logger.warning(f"[TTS_CLIENT] Google internal error (500) - transient error")
                # Let the retry logic in generate_chunk_with_retry handle this
                raise

            # Other errors - propagate
            else:
                raise
    
    def generate_single_speaker_audio(
        self,
        script_content: str,
        language: str,
        speaker_role: str,
        speaker_gender: str,
        speaker_voice: str,
        episode_id: str = None,
        is_pre_processed: bool = False,
        content_type: str = 'general'
    ) -> Tuple[bytes, int]:
        """
        Generate audio for single-speaker format using VoiceConfig

        Args:
            script_content: Text script to convert to audio
            language: Target language for generation
            speaker_role: Role name for the speaker
            speaker_gender: Gender for the speaker (male/female)
            speaker_voice: Pre-selected voice for the speaker
            episode_id: Episode ID for logging
            is_pre_processed: Whether the script is already processed with niqqud
            content_type: Type of content being processed

        Returns:
            Tuple of (audio_data_bytes, duration_seconds)
        """
        logger.info(f"[TTS_CLIENT] ===== Single-Speaker Audio Generation =====")
        logger.info(f"[TTS_CLIENT] Voice: {speaker_voice} ({speaker_gender})")
        logger.info(f"[TTS_CLIENT] Episode: {episode_id}")
        logger.info(f"[TTS_CLIENT] Pre-processed: {is_pre_processed}")
        logger.info(f"[TTS_CLIENT] Content type: {content_type}")

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

        # Build comprehensive single-speaker podcast-focused style instruction
        style_instruction = (
            f"PODCAST FORMAT: Read the following content in a relaxed, dynamic podcast tone {pace_style}. "
            f"Speak {tone_style} and {volume_style}. "
            "Use natural podcast pacing with subtle pauses, vary your intonation for engagement, "
            "create an intimate listening experience, and maintain a warm, inviting presence throughout. "
            "Think of yourself as a professional podcast host delivering content to engaged listeners. "
            f"{content_style_instruction}"
        )

        logger.info(f"[TTS_CLIENT] Using voice: {speaker_role}={speaker_voice} ({speaker_gender})")

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
            full_prompt = f"IMPORTANT: Read this content in Hebrew. Speak naturally in Hebrew with proper pronunciation.\n\n{full_prompt}"

        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=full_prompt)],
            ),
        ]

        # Configure single-speaker voice using VoiceConfig (NOT MultiSpeakerVoiceConfig)
        speech_config = types.SpeechConfig(
            voice_config=types.VoiceConfig(
                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=speaker_voice)
            )
        )

        generate_content_config = types.GenerateContentConfig(
            temperature=self.temperature,
            top_p=0.95,
            response_modalities=["AUDIO"],
            speech_config=speech_config,
        )

        logger.info(f"[TTS_CLIENT] Natural language style descriptors applied (single-speaker):")
        logger.info(f"[TTS_CLIENT] - Pace: {pace_style}")
        logger.info(f"[TTS_CLIENT] - Tone: {tone_style}")
        logger.info(f"[TTS_CLIENT] - Volume: {volume_style}")
        logger.info(f"[TTS_CLIENT] - Language code: {enhanced_speech_config.get('language_code', 'en-US')}")
        logger.info(f"[TTS_CLIENT] - Content type: {content_type}")

        # Generate content using Gemini TTS
        logger.info(f"[TTS_CLIENT] Calling Gemini 2.5 pro TTS API (single-speaker)...")

        # Respect rate limits
        _RATE_LIMITER.acquire()

        try:
            # Call Gemini API with timeout protection
            response = self._call_gemini_with_timeout(contents, generate_content_config)

            # Extract audio data from response
            if (response.candidates and
                response.candidates[0].content and
                response.candidates[0].content.parts and
                response.candidates[0].content.parts[0].inline_data):

                inline_data = response.candidates[0].content.parts[0].inline_data
                audio_data = inline_data.data
                mime_type = inline_data.mime_type

                logger.info(f"[TTS_CLIENT] Received single-speaker audio: {len(audio_data)} bytes, MIME: {mime_type}")

                # Convert to WAV format
                wav_data = convert_to_wav(audio_data, mime_type)
                duration = calculate_wav_duration(wav_data)

                logger.info(f"[TTS_CLIENT] Generated {len(wav_data)} bytes of single-speaker audio, duration: {duration}s")

                return wav_data, duration
            else:
                raise ValueError("No audio data in response")

        except DeferrableError:
            # Timeout occurred - re-raise to defer episode
            raise
        except Exception as e:
            # Smart error handling
            error_str = str(e)

            # 429 Rate Limit - defer episode
            if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
                delay = parse_retry_delay(error_str)
                logger.warning(f"[TTS_CLIENT] Rate limit (429) - Google suggests {delay}s delay")
                raise DeferrableError(
                    f"Rate limit exceeded (429). Defer episode for {delay}s before retry."
                )

            # 500 Internal Server Error - allow retry
            elif "500" in error_str or "Internal error" in error_str:
                logger.warning(f"[TTS_CLIENT] Google internal error (500) - transient error")
                raise

            # Other errors - propagate
            else:
                raise

    def generate_single_speaker_chunk_with_retry(
        self,
        chunk: str,
        chunk_num: int,
        language: str,
        speaker_role: str,
        speaker_gender: str,
        speaker_voice: str,
        episode_id: str = None,
        is_pre_processed: bool = False,
        content_type: str = 'general',
        max_retries: int = 1,
        chunk_manager = None
    ) -> Tuple[bytes, int] | None:
        """
        Generate a single chunk with retry logic for single-speaker format

        Args:
            chunk: Script chunk to process
            chunk_num: Chunk number for logging
            language: Target language
            speaker_role: Speaker role
            speaker_gender: Speaker gender
            speaker_voice: Pre-selected voice for the speaker
            episode_id: Episode ID for logging
            is_pre_processed: Whether the script is already processed with niqqud
            content_type: Type of content being processed
            max_retries: Maximum retry attempts
            chunk_manager: AudioChunkManager instance for validation (required)

        Returns:
            Tuple of (audio_data, duration) or None if failed
        """
        logger.info(f"[TTS_CLIENT] ===== Processing Single-Speaker Chunk {chunk_num} =====")
        logger.info(f"[TTS_CLIENT] Chunk size: {len(chunk)} chars")
        logger.info(f"[TTS_CLIENT] Voice: {speaker_voice}")
        logger.info(f"[TTS_CLIENT] Role: {speaker_role}")

        # Validate chunk_manager is provided
        if chunk_manager is None:
            raise ValueError("chunk_manager parameter is required for validation")

        for retry in range(max_retries + 1):
            try:
                logger.info(f"[TTS_CLIENT] Single-speaker chunk {chunk_num} attempt {retry+1}/{max_retries+1}")
                audio_data, duration = self.generate_single_speaker_audio(
                    chunk, language, speaker_role, speaker_gender,
                    speaker_voice, episode_id, is_pre_processed, content_type
                )

                # Validate audio data before returning (with silence detection enabled)
                if chunk_manager.validate_audio_chunk(audio_data, duration, chunk_num, check_silence=True):
                    logger.info(f"[TTS_CLIENT] ✅ Single-speaker chunk {chunk_num} completed: {duration}s")
                    logger.info(f"[TTS_CLIENT] Chunk {chunk_num} used voice: {speaker_voice}")
                    return audio_data, duration
                else:
                    logger.warning(f"[TTS_CLIENT] ⚠️ Single-speaker chunk {chunk_num} validation failed, retry {retry+1}/{max_retries+1}")

            except DeferrableError as de:
                # Timeout or rate limit - defer episode, don't retry
                logger.error(f"[TTS_CLIENT] Single-speaker chunk {chunk_num} needs deferral: {str(de)}")
                raise

            except Exception as e:
                error_str = str(e)
                logger.error(f"[TTS_CLIENT] Error processing single-speaker chunk {chunk_num}, attempt {retry+1}/{max_retries+1}: {error_str}")

                # Check if this is the last retry
                if retry == max_retries:
                    logger.error(f"[TTS_CLIENT] Single-speaker chunk {chunk_num} failed after {max_retries+1} attempts")
                    # For 500 errors after retry exhausted, defer instead of fail
                    if "500" in error_str or "Internal error" in error_str:
                        logger.warning(f"[TTS_CLIENT] 500 error persists after retries - converting to DeferrableError")
                        raise DeferrableError(
                            f"Google internal error (500) persisted after {max_retries+1} attempts. "
                            "Defer episode for retry."
                        )
                else:
                    # Only retry for 500 errors (transient Google errors)
                    if "500" in error_str or "Internal error" in error_str:
                        logger.info(f"[TTS_CLIENT] 500 error - will retry single-speaker chunk {chunk_num} (attempt {retry+2}/{max_retries+1})")
                        time.sleep(2)
                    else:
                        # Other errors - no point retrying
                        logger.error(f"[TTS_CLIENT] Non-retryable error for single-speaker chunk {chunk_num}")
                        raise

        return None

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
        max_retries: int = 1,
        speaker1_voice: str = None,
        speaker2_voice: str = None,
        content_type: str = 'general',
        chunk_manager = None
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
            chunk_manager: AudioChunkManager instance for validation (required)

        Returns:
            Tuple of (audio_data, duration) or None if failed
        """
        logger.info(f"[TTS_CLIENT] ===== Processing Chunk {chunk_num} =====")
        logger.info(f"[TTS_CLIENT] Chunk size: {len(chunk)} chars")
        logger.info(f"[TTS_CLIENT] Pre-selected voices: speaker1={speaker1_voice}, speaker2={speaker2_voice}")
        logger.info(f"[TTS_CLIENT] Roles: {speaker1_role} / {speaker2_role}")

        # Validate chunk_manager is provided
        if chunk_manager is None:
            raise ValueError("chunk_manager parameter is required for validation")

        for retry in range(max_retries + 1):
            try:
                logger.info(f"[TTS_CLIENT] Chunk {chunk_num} attempt {retry+1}/{max_retries+1}")
                audio_data, duration = self.generate_single_audio(
                    chunk, language, speaker1_role, speaker2_role,
                    speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
                    speaker1_voice, speaker2_voice, content_type
                )

                # Validate audio data before returning (with silence detection enabled)
                if chunk_manager.validate_audio_chunk(audio_data, duration, chunk_num, check_silence=True):
                    logger.info(f"[TTS_CLIENT] ✅ Chunk {chunk_num} completed successfully: {duration}s")
                    logger.info(f"[TTS_CLIENT] Chunk {chunk_num} used voices: speaker1={speaker1_voice}, speaker2={speaker2_voice}")
                    return audio_data, duration
                else:
                    logger.warning(f"[TTS_CLIENT] ⚠️ Chunk {chunk_num} validation failed, retry {retry+1}/{max_retries+1}")
                    logger.warning(f"[TTS_CLIENT] Validation failed for voices: speaker1={speaker1_voice}, speaker2={speaker2_voice}")

            except DeferrableError as de:
                # Timeout or rate limit - defer episode, don't retry
                logger.error(f"[TTS_CLIENT] Chunk {chunk_num} needs deferral: {str(de)}")
                raise  # Propagate to handler so episode can be deferred

            except Exception as e:
                error_str = str(e)
                logger.error(f"[TTS_CLIENT] Error processing chunk {chunk_num}, attempt {retry+1}/{max_retries+1}: {error_str}")

                # Check if this is the last retry
                if retry == max_retries:
                    logger.error(f"[TTS_CLIENT] Chunk {chunk_num} failed after {max_retries+1} attempts")
                    # For 500 errors after retry exhausted, defer instead of fail
                    if "500" in error_str or "Internal error" in error_str:
                        logger.warning(f"[TTS_CLIENT] 500 error persists after retries - converting to DeferrableError")
                        raise DeferrableError(
                            f"Google internal error (500) persisted after {max_retries+1} attempts. "
                            "Defer episode for retry."
                        )
                else:
                    # Only retry for 500 errors (transient Google errors)
                    if "500" in error_str or "Internal error" in error_str:
                        # Exponential backoff: 5s, 10s, 20s for retries 1, 2, 3
                        # Prevents cascading 429 errors when retrying after Google internal errors
                        delay = min(5 * (2 ** retry), 20)
                        logger.info(f"[TTS_CLIENT] 500 error - will retry chunk {chunk_num} after {delay}s backoff (attempt {retry+2}/{max_retries+1})")
                        time.sleep(delay)
                    else:
                        # Other errors - no point retrying
                        logger.error(f"[TTS_CLIENT] Non-retryable error for chunk {chunk_num}")
                        raise

        return None 