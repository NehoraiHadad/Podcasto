"""
Audio Chunk Management Module
Handles script chunking, validation, and parallel processing for TTS generation
"""
import concurrent.futures
from typing import List, Tuple, Callable, Optional
from shared.utils.logging import get_logger
from shared.services.tts_client import DeferrableError

logger = get_logger(__name__)

class AudioChunkManager:
    """Manages audio chunk processing for TTS generation"""

    def __init__(self, max_chars_per_chunk: int = 1200, max_workers: int = 2):
        """
        Initialize chunk manager

        Args:
            max_chars_per_chunk: Maximum characters per chunk (default 1200, optimized for Hebrew with niqqud expansion)
            max_workers: Maximum parallel workers for processing (default 2, optimized for rate limiting)
        """
        self.max_chars_per_chunk = max_chars_per_chunk
        self.max_workers = max_workers
    
    def split_script_into_chunks(self, script: str) -> List[str]:
        """
        Split script into chunks at speaker boundaries with improved logic
        
        Args:
            script: Full script content
            
        Returns:
            List of script chunks
        """
        lines = script.split('\n')
        chunks = []
        current_chunk = []
        current_length = 0
        
        logger.info(f"[CHUNK_MGR] Splitting script into chunks with max {self.max_chars_per_chunk} chars per chunk")
        
        for line_idx, line in enumerate(lines):
            line_length = len(line) + 1  # +1 for newline
            
            # If adding this line would exceed the limit and we have content
            if current_length + line_length > self.max_chars_per_chunk and current_chunk:
                # Create chunk from current content
                chunk_content = '\n'.join(current_chunk)
                chunks.append(chunk_content)
                
                logger.debug(f"[CHUNK_MGR] Created chunk {len(chunks)}: {len(chunk_content)} chars")
                logger.debug(f"[CHUNK_MGR] Chunk {len(chunks)} starts with: {chunk_content[:100]}...")
                
                # Start new chunk with current line
                current_chunk = [line] if line.strip() else []
                current_length = line_length if line.strip() else 0
            else:
                # Add line to current chunk
                if line.strip() or current_chunk:  # Don't start with empty lines
                    current_chunk.append(line)
                    current_length += line_length
        
        # Add remaining content as final chunk
        if current_chunk:
            chunk_content = '\n'.join(current_chunk)
            chunks.append(chunk_content)
            logger.debug(f"[CHUNK_MGR] Created final chunk {len(chunks)}: {len(chunk_content)} chars")
        
        # Log chunk distribution for debugging
        total_chars = sum(len(chunk) for chunk in chunks)
        logger.info(f"[CHUNK_MGR] Split complete: {len(chunks)} chunks, {total_chars} total chars")
        for i, chunk in enumerate(chunks):
            logger.info(f"[CHUNK_MGR] Chunk {i+1}: {len(chunk)} chars")
        
        return chunks
    
    def validate_audio_chunk(
        self,
        audio_data: bytes,
        duration: int,
        chunk_num: int,
        check_silence: bool = True
    ) -> bool:
        """
        Validate audio chunk to ensure it's not silent or corrupted

        Args:
            audio_data: Raw audio data
            duration: Calculated duration in seconds
            chunk_num: Chunk number for logging
            check_silence: Whether to check for extended silence (default True)

        Returns:
            True if audio chunk is valid, False otherwise
        """
        try:
            # Check minimum audio data size
            if len(audio_data) < 1000:  # Less than 1KB is suspicious
                logger.warning(f"[CHUNK_MGR] Chunk {chunk_num} too small: {len(audio_data)} bytes")
                return False

            # Check duration makes sense
            if duration < 1:  # Less than 1 second is suspicious for our content
                logger.warning(f"[CHUNK_MGR] Chunk {chunk_num} duration too short: {duration}s")
                return False

            # Check for reasonable duration (not too long either)
            if duration > 300:  # More than 5 minutes for a chunk is suspicious
                logger.warning(f"[CHUNK_MGR] Chunk {chunk_num} duration too long: {duration}s")
                return False

            # Basic WAV format validation
            if len(audio_data) >= 44:  # Has WAV header
                if audio_data[:4] != b'RIFF' or audio_data[8:12] != b'WAVE':
                    logger.warning(f"[CHUNK_MGR] Chunk {chunk_num} invalid WAV format")
                    return False

            # Extended silence detection (Lambda-optimized with fast mode)
            if check_silence and duration > 3:
                from shared.utils.wav_utils import detect_extended_silence

                has_silence, max_silence = detect_extended_silence(
                    audio_data,
                    max_silence_duration=5.0,
                    silence_threshold_db=-45.0,
                    window_size_ms=100,
                    sample_every_n_windows=5,  # Fast mode: check every 5th window
                    early_exit=True  # Stop immediately if silence found
                )

                if has_silence:
                    logger.warning(
                        f"[CHUNK_MGR] Chunk {chunk_num} REJECTED: "
                        f"{max_silence:.1f}s of extended silence detected "
                        f"(threshold: 5.0s, likely Gemini TTS failure)"
                    )
                    return False

                logger.info(
                    f"[CHUNK_MGR] Chunk {chunk_num} silence check OK "
                    f"(max: {max_silence:.1f}s)"
                )

            logger.debug(f"[CHUNK_MGR] Chunk {chunk_num} validation passed: {len(audio_data)} bytes, {duration}s")
            return True

        except Exception as e:
            logger.error(f"[CHUNK_MGR] Error validating chunk {chunk_num}: {str(e)}")
            return False
    
    def process_chunks_parallel(
        self,
        chunks: List[str],
        chunk_processor: Callable[[str, int], Optional[Tuple[bytes, int]]]
    ) -> Tuple[List[Tuple[int, bytes, int]], List[int]]:
        """
        Process chunks in parallel using ThreadPoolExecutor
        
        Args:
            chunks: List of script chunks to process
            chunk_processor: Function to process individual chunks
            
        Returns:
            Tuple of (successful_chunks, failed_chunk_numbers)
        """
        # Determine optimal concurrency level
        max_workers = min(len(chunks), self.max_workers)
        logger.info(f"[CHUNK_MGR] Using {max_workers} parallel workers for chunk processing")
        
        successful_chunks = []
        failed_chunks = []
        
        # Circuit breaker: stop processing after consecutive rate limits
        # Prevents wasting Lambda time and API quota when rate limiting is happening
        consecutive_rate_limits = 0
        MAX_CONSECUTIVE_RATE_LIMITS = 2

        try:
            # Use ThreadPoolExecutor for parallel processing
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Submit all chunk processing tasks
                future_to_chunk = {}
                for i, chunk in enumerate(chunks):
                    future = executor.submit(chunk_processor, chunk, i+1)
                    future_to_chunk[future] = (i+1, chunk)

                # Collect results as they complete
                for future in concurrent.futures.as_completed(future_to_chunk):
                    chunk_num, chunk_content = future_to_chunk[future]

                    try:
                        result = future.result()
                        if result:
                            audio_data, duration = result
                            successful_chunks.append((chunk_num, audio_data, duration))
                            logger.info(f"[CHUNK_MGR] Parallel chunk {chunk_num} completed: {duration}s")
                            consecutive_rate_limits = 0  # Reset counter on success
                        else:
                            failed_chunks.append(chunk_num)
                            logger.error(f"[CHUNK_MGR] Parallel chunk {chunk_num} failed")
                    except DeferrableError as de:
                        # Track consecutive rate limits for circuit breaker
                        consecutive_rate_limits += 1
                        logger.warning(f"[CHUNK_MGR] Chunk {chunk_num} hit rate limit ({consecutive_rate_limits}/{MAX_CONSECUTIVE_RATE_LIMITS})")

                        if consecutive_rate_limits >= MAX_CONSECUTIVE_RATE_LIMITS:
                            logger.error(f"[CHUNK_MGR] CIRCUIT BREAKER ACTIVATED: {consecutive_rate_limits} consecutive rate limits")
                            logger.error(f"[CHUNK_MGR] Stopping processing to save Lambda time and API quota")
                            logger.warning(f"[CHUNK_MGR] Propagating DeferrableError to handler for episode deferral")
                            raise  # Defer episode immediately
                        else:
                            # First rate limit - mark chunk as failed but continue processing
                            logger.warning(f"[CHUNK_MGR] Continuing processing, watching for circuit breaker threshold")
                            failed_chunks.append(chunk_num)
                    except Exception as e:
                        failed_chunks.append(chunk_num)
                        logger.error(f"[CHUNK_MGR] Parallel chunk {chunk_num} exception: {str(e)}")
                        consecutive_rate_limits = 0  # Reset on other errors
        
        except Exception as e:
            logger.error(f"[CHUNK_MGR] Parallel processing failed: {str(e)}")
            raise
        
        return successful_chunks, failed_chunks
    
    def process_chunks_sequential(
        self,
        chunks: List[str],
        chunk_processor: Callable[[str, int], Optional[Tuple[bytes, int]]]
    ) -> Tuple[List[bytes], List[int]]:
        """
        Process chunks sequentially as fallback
        
        Args:
            chunks: List of script chunks to process
            chunk_processor: Function to process individual chunks
            
        Returns:
            Tuple of (successful_audio_data, failed_chunk_numbers)
        """
        logger.info(f"[CHUNK_MGR] Processing {len(chunks)} chunks sequentially")
        
        all_audio_data = []
        failed_chunks = []
        
        for i, chunk in enumerate(chunks):
            logger.info(f"[CHUNK_MGR] Processing chunk {i+1}/{len(chunks)} ({len(chunk)} chars)")
            
            try:
                result = chunk_processor(chunk, i+1)
                if result:
                    audio_data, duration = result
                    all_audio_data.append(audio_data)
                    logger.info(f"[CHUNK_MGR] Chunk {i+1} completed successfully: {duration}s")
                else:
                    failed_chunks.append(i+1)
                    logger.error(f"[CHUNK_MGR] Chunk {i+1} failed")
                    
            except Exception as e:
                failed_chunks.append(i+1)
                logger.error(f"[CHUNK_MGR] Error processing chunk {i+1}: {str(e)}")
        
        return all_audio_data, failed_chunks 