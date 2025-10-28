"""
Google Podcast Generator Service
Main orchestrator for multi-speaker podcast generation using modular components
"""
from typing import Tuple, Callable, Optional
from shared.utils.logging import get_logger
from shared.utils.wav_utils import concatenate_wav_files
from shared.services.voice_config import VoiceConfigManager
from shared.services.audio_chunk_manager import AudioChunkManager
from shared.services.tts_client import GeminiTTSClient

logger = get_logger(__name__)

class GooglePodcastGenerator:
    """Main orchestrator for podcast audio generation using Google Gemini TTS"""
    
    def __init__(self):
        """Initialize the podcast generator with modular components"""
        self.tts_client = GeminiTTSClient()
        self.chunk_manager = AudioChunkManager(max_chars_per_chunk=1500, max_workers=4)
        self.voice_manager = VoiceConfigManager()
        
    def generate_podcast_audio(
        self,
        script_content: str,
        language: str = "he",
        speaker1_role: str = "Speaker 1",
        speaker2_role: str = "Speaker 2",
        speaker1_gender: str = "male",
        speaker2_gender: str = "female",
        episode_id: str = None,
        is_pre_processed: bool = False,
        content_type: str = 'general',
        speaker1_voice: str = None,
        speaker2_voice: str = None,
        podcast_format: str = 'multi-speaker'
    ) -> Tuple[bytes, int]:
        """
        Generate podcast audio with optimal chunking and parallel processing

        Args:
            script_content: Full script text to convert to audio
            language: Target language for generation
            speaker1_role: Role name for first speaker
            speaker2_role: Role name for second speaker (None for single-speaker)
            speaker1_gender: Gender for first speaker (male/female)
            speaker2_gender: Gender for second speaker (male/female, None for single-speaker)
            episode_id: Episode ID for voice randomization
            is_pre_processed: Whether the script is already processed with niqqud
            content_type: Type of content for speech optimization (news, technology, etc.)
            speaker1_voice: Pre-selected voice for speaker 1 (optional, for consistency across lambdas)
            speaker2_voice: Pre-selected voice for speaker 2 (optional, for consistency across lambdas, None for single-speaker)
            podcast_format: Format of podcast ('single-speaker' or 'multi-speaker')

        Returns:
            Tuple of (final_audio_bytes, total_duration_seconds)
        """
        logger.info(f"[GOOGLE_TTS] Starting podcast audio generation")
        logger.info(f"[GOOGLE_TTS] Language: {language}")
        logger.info(f"[GOOGLE_TTS] Format: {podcast_format}")
        logger.info(f"[GOOGLE_TTS] Content length: {len(script_content)} characters")
        logger.info(f"[GOOGLE_TTS] Pre-processed: {is_pre_processed}")

        # Route to appropriate generation method based on format
        if podcast_format == 'single-speaker':
            logger.info(f"[GOOGLE_TTS] Using single-speaker generation")
            logger.info(f"[GOOGLE_TTS] Speaker: {speaker1_role} ({speaker1_gender})")

            # CRITICAL: speaker1_voice MUST be provided for consistency
            if not speaker1_voice:
                error_msg = (
                    f"[GOOGLE_TTS] CRITICAL ERROR: speaker1_voice not provided for single-speaker format! "
                    f"This indicates a bug in the pipeline - voice should be pre-selected. "
                    f"REFUSING to generate audio with inconsistent voice. "
                    f"Check audio_generation_handler._ensure_voices_in_config() for recovery logic."
                )
                logger.error(error_msg)
                raise ValueError(error_msg)

            logger.info(f"[GOOGLE_TTS] ✅ Using pre-selected voice: {speaker1_role}={speaker1_voice}")

            # Check if content needs to be chunked
            if len(script_content) > self.chunk_manager.max_chars_per_chunk:
                logger.info(f"[GOOGLE_TTS] Content too long, using chunked single-speaker processing")
                return self._generate_single_speaker_chunked(
                    script_content, language, speaker1_role, speaker1_gender,
                    speaker1_voice, episode_id, is_pre_processed, content_type
                )
            else:
                logger.info(f"[GOOGLE_TTS] Generating single audio chunk (single-speaker)")
                return self.tts_client.generate_single_speaker_audio(
                    script_content, language, speaker1_role, speaker1_gender,
                    speaker1_voice, episode_id, is_pre_processed, content_type
                )
        else:
            # Multi-speaker format
            logger.info(f"[GOOGLE_TTS] Using multi-speaker generation")
            logger.info(f"[GOOGLE_TTS] Speakers: {speaker1_role} ({speaker1_gender}), {speaker2_role} ({speaker2_gender})")

            # CRITICAL: Voices MUST be provided for consistency
            if not speaker1_voice or not speaker2_voice:
                error_msg = (
                    f"[GOOGLE_TTS] CRITICAL ERROR: Voices not provided! "
                    f"speaker1_voice={speaker1_voice}, speaker2_voice={speaker2_voice}. "
                    f"This indicates a bug in the pipeline - voices should be pre-selected. "
                    f"REFUSING to generate audio with inconsistent voices. "
                    f"Check audio_generation_handler._ensure_voices_in_config() for recovery logic."
                )
                logger.error(error_msg)
                raise ValueError(error_msg)

            logger.info(f"[GOOGLE_TTS] ✅ Using pre-selected voices: {speaker1_role}={speaker1_voice}, {speaker2_role}={speaker2_voice}")

            # Check if content needs to be chunked
            if len(script_content) > self.chunk_manager.max_chars_per_chunk:
                logger.info(f"[GOOGLE_TTS] Content too long ({len(script_content)} chars), using parallel chunked processing")
                return self._generate_chunked_audio_parallel(
                    script_content, language, speaker1_role, speaker2_role,
                    speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
                    speaker1_voice, speaker2_voice, content_type
                )
            else:
                logger.info(f"[GOOGLE_TTS] Generating single audio chunk (multi-speaker)")
                return self.tts_client.generate_single_audio(
                    script_content, language, speaker1_role, speaker2_role,
                    speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
                    speaker1_voice, speaker2_voice, content_type
                )
    
    def _create_chunk_processor(
        self,
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
    ) -> Callable[[str, int], Optional[Tuple[bytes, int]]]:
        """
        Create a chunk processor function with fixed parameters (DRY principle)

        Args:
            language: Target language
            speaker1_role: First speaker role
            speaker2_role: Second speaker role
            speaker1_gender: First speaker gender
            speaker2_gender: Second speaker gender
            episode_id: Episode ID for voice randomization
            is_pre_processed: Whether the script is already processed with niqqud
            speaker1_voice: Pre-selected voice for speaker 1 (for consistency)
            speaker2_voice: Pre-selected voice for speaker 2 (for consistency)
            content_type: Type of content for speech optimization

        Returns:
            Chunk processor function
        """
        def chunk_processor(chunk: str, chunk_num: int) -> Optional[Tuple[bytes, int]]:
            return self.tts_client.generate_chunk_with_retry(
                chunk, chunk_num, language, speaker1_role, speaker2_role,
                speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
                max_retries=3, speaker1_voice=speaker1_voice, speaker2_voice=speaker2_voice,
                content_type=content_type, chunk_manager=self.chunk_manager
            )
        return chunk_processor
    
    def _generate_single_speaker_chunked(
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
        Generate audio for single-speaker format using chunking and parallel processing

        Args:
            script_content: Full script content
            language: Target language
            speaker_role: Speaker role name
            speaker_gender: Speaker gender
            speaker_voice: Pre-selected voice for the speaker
            episode_id: Episode ID for logging
            is_pre_processed: Whether the script is already processed with niqqud
            content_type: Type of content for speech optimization

        Returns:
            Tuple of (concatenated_audio_bytes, total_duration)
        """
        # Split script into manageable chunks
        chunks = self.chunk_manager.split_script_into_chunks(script_content)
        logger.info(f"[GOOGLE_TTS] Split single-speaker content into {len(chunks)} chunks for parallel processing")

        # Create chunk processor function for single-speaker
        def chunk_processor(chunk: str, chunk_num: int):
            return self.tts_client.generate_single_speaker_chunk_with_retry(
                chunk, chunk_num, language, speaker_role, speaker_gender,
                speaker_voice, episode_id, is_pre_processed, content_type,
                max_retries=3, chunk_manager=self.chunk_manager
            )

        try:
            # Process chunks in parallel
            successful_chunks, failed_chunks = self.chunk_manager.process_chunks_parallel(
                chunks, chunk_processor
            )

            if not successful_chunks:
                raise Exception("Failed to generate any valid audio chunks for single-speaker in parallel")

            # Sort chunks by their original order
            successful_chunks.sort(key=lambda x: x[0])

            # VALIDATION: Verify voice consistency across all chunks
            logger.info(f"[GOOGLE_TTS] Validating voice consistency across {len(successful_chunks)} single-speaker chunks")
            logger.info(f"[GOOGLE_TTS] Expected voice: {speaker_role}={speaker_voice}")

            # CRITICAL: Fail immediately if any chunks failed - DO NOT publish incomplete episodes
            if failed_chunks:
                error_msg = (
                    f"Single-speaker episode generation FAILED: {len(failed_chunks)}/{len(chunks)} chunks failed after all retries. "
                    f"Failed chunk numbers: {failed_chunks}. "
                    f"REFUSING to generate incomplete podcast - episode will be marked as 'failed'."
                )
                logger.error(f"[GOOGLE_TTS] ❌ {error_msg}")
                raise Exception(error_msg)

            # Extract audio data for concatenation
            audio_data_list = [chunk[1] for chunk in successful_chunks]

            # Concatenate all audio data
            final_audio, calculated_duration = concatenate_wav_files(audio_data_list)

            total_chunk_duration = sum(chunk[2] for chunk in successful_chunks)
            logger.info(f"[GOOGLE_TTS] Single-speaker parallel generation complete: {len(successful_chunks)}/{len(chunks)} chunks successful")
            logger.info(f"[GOOGLE_TTS] Generated {len(final_audio)} bytes, duration: {calculated_duration}s (chunks total: {total_chunk_duration}s)")

            return final_audio, calculated_duration

        except Exception as e:
            logger.error(f"[GOOGLE_TTS] Single-speaker parallel processing failed: {str(e)}")
            logger.error(f"[GOOGLE_TTS] No fallback to sequential processing - episode will be marked as 'failed'")
            raise

    def _generate_chunked_audio_parallel(
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
        Generate audio using parallel chunk processing for improved performance
        
        Args:
            script_content: Full script content
            language: Target language
            speaker1_role: First speaker role
            speaker2_role: Second speaker role
            speaker1_gender: First speaker gender
            speaker2_gender: Second speaker gender
            episode_id: Episode ID for voice randomization
            is_pre_processed: Whether the script is already processed with niqqud
            speaker1_voice: Pre-selected voice for speaker 1 (for consistency)
            speaker2_voice: Pre-selected voice for speaker 2 (for consistency)
            
        Returns:
            Tuple of (concatenated_audio_bytes, total_duration)
        """
        # Split script into manageable chunks
        chunks = self.chunk_manager.split_script_into_chunks(script_content)
        logger.info(f"[GOOGLE_TTS] Split content into {len(chunks)} chunks for parallel processing")
        
        # Create chunk processor function using DRY helper method
        chunk_processor = self._create_chunk_processor(
            language, speaker1_role, speaker2_role, speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
            speaker1_voice, speaker2_voice, content_type
        )
        
        try:
            # Process chunks in parallel
            successful_chunks, failed_chunks = self.chunk_manager.process_chunks_parallel(
                chunks, chunk_processor
            )
            
            if not successful_chunks:
                raise Exception("Failed to generate any valid audio chunks in parallel")
            
            # Sort chunks by their original order
            successful_chunks.sort(key=lambda x: x[0])

            # VALIDATION: Verify voice consistency across all chunks
            logger.info(f"[GOOGLE_TTS] Validating voice consistency across {len(successful_chunks)} chunks")
            logger.info(f"[GOOGLE_TTS] Expected voices: {speaker1_role}={speaker1_voice}, {speaker2_role}={speaker2_voice}")

            # CRITICAL: Fail immediately if any chunks failed - DO NOT publish incomplete episodes
            if failed_chunks:
                error_msg = (
                    f"Episode generation FAILED: {len(failed_chunks)}/{len(chunks)} chunks failed after all retries. "
                    f"Failed chunk numbers: {failed_chunks}. "
                    f"REFUSING to generate incomplete podcast - episode will be marked as 'failed'."
                )
                logger.error(f"[GOOGLE_TTS] ❌ {error_msg}")
                raise Exception(error_msg)
            
            # Extract audio data for concatenation
            audio_data_list = [chunk[1] for chunk in successful_chunks]
            
            # Concatenate all audio data
            final_audio, calculated_duration = concatenate_wav_files(audio_data_list)
            
            total_chunk_duration = sum(chunk[2] for chunk in successful_chunks)
            logger.info(f"[GOOGLE_TTS] Parallel generation complete: {len(successful_chunks)}/{len(chunks)} chunks successful")
            logger.info(f"[GOOGLE_TTS] Generated {len(final_audio)} bytes, duration: {calculated_duration}s (chunks total: {total_chunk_duration}s)")
            
            return final_audio, calculated_duration
            
        except Exception as e:
            logger.error(f"[GOOGLE_TTS] Parallel processing failed: {str(e)}")
            # NO FALLBACK - fail immediately for clarity and to prevent timeout
            # Sequential processing can also timeout and leaves episodes stuck in 'processing'
            logger.error(f"[GOOGLE_TTS] No fallback to sequential processing - episode will be marked as 'failed'")
            raise  # Re-raise the exception to mark episode as failed