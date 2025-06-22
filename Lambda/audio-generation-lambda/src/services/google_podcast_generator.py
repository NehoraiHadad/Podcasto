"""
Google Podcast Generator Service
Main orchestrator for multi-speaker podcast generation using modular components
"""
from typing import Tuple, Callable, Optional
from utils.logging import get_logger
from utils.wav_utils import concatenate_wav_files
from services.voice_config import VoiceConfigManager
from services.audio_chunk_manager import AudioChunkManager
from services.tts_client import GeminiTTSClient

logger = get_logger(__name__)

class GooglePodcastGenerator:
    """Main orchestrator for podcast audio generation using Google Gemini TTS"""
    
    def __init__(self):
        """Initialize the podcast generator with modular components"""
        self.tts_client = GeminiTTSClient()
        self.chunk_manager = AudioChunkManager(max_chars_per_chunk=1000, max_workers=4)
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
        content_type: str = 'general'
    ) -> Tuple[bytes, int]:
        """
        Generate podcast audio with optimal chunking and parallel processing
        
        Args:
            script_content: Full script text to convert to audio
            language: Target language for generation
            speaker1_role: Role name for first speaker
            speaker2_role: Role name for second speaker
            speaker1_gender: Gender for first speaker (male/female)
            speaker2_gender: Gender for second speaker (male/female)
            episode_id: Episode ID for voice randomization
            is_pre_processed: Whether the script is already processed with niqqud
            content_type: Type of content for speech optimization (news, technology, etc.)
            
        Returns:
            Tuple of (final_audio_bytes, total_duration_seconds)
        """
        logger.info(f"[GOOGLE_TTS] Starting podcast audio generation")
        logger.info(f"[GOOGLE_TTS] Language: {language}")
        logger.info(f"[GOOGLE_TTS] Speakers: {speaker1_role} ({speaker1_gender}), {speaker2_role} ({speaker2_gender})")
        logger.info(f"[GOOGLE_TTS] Content length: {len(script_content)} characters")
        logger.info(f"[GOOGLE_TTS] Pre-processed: {is_pre_processed}")
        
        # Select consistent voices once for entire episode to ensure voice consistency across chunks
        speaker1_voice, speaker2_voice = self.voice_manager.get_distinct_voices_for_speakers(
            language=language,
            speaker1_gender=speaker1_gender,
            speaker2_gender=speaker2_gender,
            speaker1_role=speaker1_role,
            speaker2_role=speaker2_role,
            episode_id=episode_id,
            randomize_speaker2=bool(episode_id)
        )
        logger.info(f"[GOOGLE_TTS] Selected consistent voices for episode: {speaker1_role}={speaker1_voice}, {speaker2_role}={speaker2_voice}")
        
        # Check if content needs to be chunked
        if len(script_content) > self.chunk_manager.max_chars_per_chunk:
            logger.info(f"[GOOGLE_TTS] Content too long ({len(script_content)} chars), using parallel chunked processing")
            return self._generate_chunked_audio_parallel(
                script_content, language, speaker1_role, speaker2_role, 
                speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
                speaker1_voice, speaker2_voice, content_type
            )
        else:
            logger.info(f"[GOOGLE_TTS] Generating single audio chunk")
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
                max_retries=2, speaker1_voice=speaker1_voice, speaker2_voice=speaker2_voice,
                content_type=content_type
            )
        return chunk_processor
    
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
            
            if failed_chunks:
                logger.error(f"[GOOGLE_TTS] WARNING: {len(failed_chunks)} chunks failed in parallel: {failed_chunks}")
                logger.error(f"[GOOGLE_TTS] This will result in silent parts in the final audio!")
            
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
            # Fallback to sequential processing
            logger.info(f"[GOOGLE_TTS] Falling back to sequential processing")
            return self._generate_chunked_audio_sequential(
                script_content, language, speaker1_role, speaker2_role,
                speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
                speaker1_voice, speaker2_voice, content_type
            )
    
    def _generate_chunked_audio_sequential(
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
        Fallback sequential chunk processing when parallel processing fails
        
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
        # Split script into chunks
        chunks = self.chunk_manager.split_script_into_chunks(script_content)
        
        # Create chunk processor function using DRY helper method
        chunk_processor = self._create_chunk_processor(
            language, speaker1_role, speaker2_role, speaker1_gender, speaker2_gender, episode_id, is_pre_processed,
            speaker1_voice, speaker2_voice, content_type
        )
        
        # Process chunks sequentially
        all_audio_data, failed_chunks = self.chunk_manager.process_chunks_sequential(
            chunks, chunk_processor
        )
        
        if not all_audio_data:
            raise Exception("Failed to generate any valid audio chunks")
        
        if failed_chunks:
            logger.error(f"[GOOGLE_TTS] WARNING: {len(failed_chunks)} chunks failed: {failed_chunks}")
            logger.error(f"[GOOGLE_TTS] This will result in silent parts in the final audio!")
        
        # Concatenate all audio data
        final_audio, calculated_duration = concatenate_wav_files(all_audio_data)
        
        logger.info(f"[GOOGLE_TTS] Sequential generation complete: {len(all_audio_data)}/{len(chunks)} chunks successful")
        logger.info(f"[GOOGLE_TTS] Generated {len(final_audio)} bytes, duration: {calculated_duration}s")
        
        return final_audio, calculated_duration 