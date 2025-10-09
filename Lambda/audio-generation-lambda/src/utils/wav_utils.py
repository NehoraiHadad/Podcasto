"""
WAV Audio Utilities
Centralized utilities for WAV file operations
"""
import struct
import base64
from typing import Dict, List, Tuple

from utils.logging import get_logger

logger = get_logger(__name__)


def parse_audio_mime_type(mime_type: str) -> Dict[str, int]:
    """
    Parse audio parameters from MIME type
    
    Args:
        mime_type: Audio MIME type string (e.g., "audio/L16;rate=24000")
        
    Returns:
        Dictionary with bits_per_sample and rate
    """
    bits_per_sample = 16
    rate = 24000
    
    if not mime_type:
        return {"bits_per_sample": bits_per_sample, "rate": rate}
    
    parts = mime_type.split(";")
    for param in parts:
        param = param.strip()
        if param.lower().startswith("rate="):
            try:
                rate_str = param.split("=", 1)[1]
                rate = int(rate_str)
            except (ValueError, IndexError):
                pass
        elif param.startswith("audio/L"):
            try:
                bits_per_sample = int(param.split("L", 1)[1])
            except (ValueError, IndexError):
                pass
    
    return {"bits_per_sample": bits_per_sample, "rate": rate}


def create_wav_header(data_size: int, sample_rate: int = 24000, bits_per_sample: int = 16) -> bytes:
    """Create WAV file header"""
    num_channels = 1
    bytes_per_sample = bits_per_sample // 8
    block_align = num_channels * bytes_per_sample
    byte_rate = sample_rate * block_align
    chunk_size = 36 + data_size
    
    return struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",          # ChunkID
        chunk_size,       # ChunkSize
        b"WAVE",          # Format
        b"fmt ",          # Subchunk1ID
        16,               # Subchunk1Size (16 for PCM)
        1,                # AudioFormat (1 for PCM)
        num_channels,     # NumChannels
        sample_rate,      # SampleRate
        byte_rate,        # ByteRate
        block_align,      # BlockAlign
        bits_per_sample,  # BitsPerSample
        b"data",          # Subchunk2ID
        data_size         # Subchunk2Size
    )


def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
    """
    Convert audio data to WAV format
    
    Args:
        audio_data: Raw audio data (may be base64 encoded)
        mime_type: Original audio MIME type
        
    Returns:
        WAV-formatted audio data
    """
    # Decode base64 if needed
    if isinstance(audio_data, str):
        audio_data = base64.b64decode(audio_data)
    
    # Parse MIME type for parameters
    params = parse_audio_mime_type(mime_type)
    sample_rate = params.get("rate", 24000)
    bits_per_sample = params.get("bits_per_sample", 16)
    
    # Check if already WAV format
    if mime_type and mime_type.startswith('audio/wav'):
        return audio_data
    
    # Create WAV file with header
    header = create_wav_header(len(audio_data), sample_rate, bits_per_sample)
    return header + audio_data


def calculate_wav_duration(wav_data: bytes) -> int:
    """
    Calculate duration of WAV file in seconds
    
    Args:
        wav_data: WAV file data
        
    Returns:
        Duration in seconds
    """
    if len(wav_data) < 44:
        logger.warning(f"[WAV_UTILS] WAV data too short: {len(wav_data)} bytes")
        return 0
    
    try:
        # Validate WAV format
        if wav_data[:4] != b'RIFF' or wav_data[8:12] != b'WAVE':
            logger.warning("[WAV_UTILS] Invalid WAV format")
            return 0
        
        # Extract parameters from header
        sample_rate = struct.unpack('<I', wav_data[24:28])[0]
        data_size = struct.unpack('<I', wav_data[40:44])[0]
        
        # Calculate duration for 16-bit mono audio
        bytes_per_sample = 2
        num_channels = 1
        duration_seconds = data_size / (sample_rate * bytes_per_sample * num_channels)
        
        logger.debug(f"[WAV_UTILS] Duration: {data_size} bytes at {sample_rate}Hz = {duration_seconds:.2f}s")
        return int(duration_seconds)
        
    except (struct.error, ZeroDivisionError, IndexError) as e:
        logger.error(f"[WAV_UTILS] Error calculating duration: {str(e)}")
        # Fallback estimation
        estimated_duration = len(wav_data) // (24000 * 2)
        logger.warning(f"[WAV_UTILS] Using estimated duration: {estimated_duration}s")
        return estimated_duration


def concatenate_wav_files(audio_chunks: List[bytes]) -> Tuple[bytes, int]:
    """
    Concatenate multiple WAV audio files

    Args:
        audio_chunks: List of WAV audio data chunks

    Returns:
        Tuple of (concatenated_audio, total_duration)
    """
    if not audio_chunks:
        return b'', 0

    if len(audio_chunks) == 1:
        duration = calculate_wav_duration(audio_chunks[0])
        return audio_chunks[0], duration

    # Extract raw audio data from chunks (skip headers)
    raw_audio_parts = []
    sample_rate = 24000  # Default

    for chunk in audio_chunks:
        if len(chunk) > 44:  # Has WAV header
            # Extract sample rate from first chunk
            if chunk == audio_chunks[0]:
                try:
                    sample_rate = struct.unpack('<I', chunk[24:28])[0]
                except struct.error:
                    logger.warning("[WAV_UTILS] Could not extract sample rate, using default")
            # Append audio data (skip 44-byte header)
            raw_audio_parts.append(chunk[44:])
        else:
            raw_audio_parts.append(chunk)

    # Combine raw audio data
    combined_raw_audio = b"".join(raw_audio_parts)

    # Create complete WAV file
    header = create_wav_header(len(combined_raw_audio), sample_rate)
    combined_wav = header + combined_raw_audio
    duration = calculate_wav_duration(combined_wav)

    logger.info(f"[WAV_UTILS] Concatenated {len(audio_chunks)} chunks into {len(combined_wav)} bytes, duration: {duration}s")

    return combined_wav, duration


def calculate_rms_db_fast(samples: bytes) -> float:
    """
    Calculate RMS (Root Mean Square) and convert to decibels
    Optimized for Lambda with sampling for large audio windows

    Args:
        samples: Raw audio samples (16-bit PCM)

    Returns:
        RMS value in decibels (dB), or -96.0 for silent audio
    """
    if not samples or len(samples) < 2:
        return -96.0  # Very quiet

    # For performance: sample max 1000 values from large windows
    sample_count = len(samples) // 2  # 16-bit samples = 2 bytes each
    step = max(1, sample_count // 1000)

    sum_squares = 0
    count = 0

    # Unpack samples with stride for speed
    for i in range(0, len(samples) - 1, step * 2):
        try:
            sample = struct.unpack('<h', samples[i:i+2])[0]
            sum_squares += sample * sample
            count += 1
        except struct.error:
            break

    if count == 0:
        return -96.0

    # Calculate RMS
    import math
    rms = math.sqrt(sum_squares / count)

    # Convert to dB (reference: 16-bit max = 32768)
    if rms < 1:
        return -96.0

    db = 20 * math.log10(rms / 32768.0)
    return db


def detect_extended_silence(
    wav_data: bytes,
    max_silence_duration: float = 5.0,
    silence_threshold_db: float = -45.0,
    window_size_ms: int = 100,
    sample_every_n_windows: int = 5,
    early_exit: bool = True
) -> Tuple[bool, float]:
    """
    Detect extended silence in WAV audio file
    Lambda-optimized with sampling and early exit for performance

    Args:
        wav_data: Complete WAV file data (with header)
        max_silence_duration: Maximum allowed silence in seconds (default 5.0)
        silence_threshold_db: dB threshold for silence detection (default -45.0)
        window_size_ms: Analysis window size in milliseconds (default 100)
        sample_every_n_windows: Check every Nth window for performance (default 5)
        early_exit: Stop immediately when extended silence found (default True)

    Returns:
        Tuple of (has_extended_silence: bool, max_silence_duration_found: float)
    """
    # Validate WAV format
    if len(wav_data) < 44:
        logger.warning("[WAV_UTILS] WAV data too short for silence detection")
        return (False, 0.0)

    if wav_data[:4] != b'RIFF' or wav_data[8:12] != b'WAVE':
        logger.warning("[WAV_UTILS] Invalid WAV format for silence detection")
        return (False, 0.0)

    try:
        # Extract WAV parameters from header
        sample_rate = struct.unpack('<I', wav_data[24:28])[0]
        data_size = struct.unpack('<I', wav_data[40:44])[0]

        # Calculate window parameters
        window_samples = int((window_size_ms / 1000) * sample_rate)
        bytes_per_window = window_samples * 2  # 16-bit = 2 bytes per sample
        total_windows = data_size // bytes_per_window

        if total_windows == 0:
            return (False, 0.0)

        # Track silence duration
        current_silence_duration = 0.0
        max_silence_found = 0.0
        windows_checked = 0

        logger.debug(
            f"[WAV_UTILS] Silence check: {total_windows} windows, "
            f"sampling every {sample_every_n_windows}"
        )

        # Analyze windows with sampling for performance
        for i in range(0, total_windows, sample_every_n_windows):
            window_offset = 44 + (i * bytes_per_window)
            window_data = wav_data[window_offset:window_offset + bytes_per_window]

            if len(window_data) < bytes_per_window:
                break

            # Calculate RMS in dB for this window
            rms_db = calculate_rms_db_fast(window_data)

            if rms_db <= silence_threshold_db:
                # Silent window - accumulate duration (account for sampling rate)
                current_silence_duration += (window_size_ms / 1000) * sample_every_n_windows
                max_silence_found = max(max_silence_found, current_silence_duration)

                # Early exit optimization: stop as soon as threshold exceeded
                if early_exit and current_silence_duration > max_silence_duration:
                    logger.debug(
                        f"[WAV_UTILS] Extended silence detected: {current_silence_duration:.1f}s "
                        f"after {windows_checked} windows"
                    )
                    return (True, current_silence_duration)
            else:
                # Non-silent window - reset counter
                current_silence_duration = 0.0

            windows_checked += 1

        logger.debug(
            f"[WAV_UTILS] Silence check complete: max={max_silence_found:.1f}s, "
            f"checked {windows_checked}/{total_windows} windows"
        )

        return (False, max_silence_found)

    except (struct.error, ZeroDivisionError, IndexError) as e:
        logger.error(f"[WAV_UTILS] Error during silence detection: {str(e)}")
        return (False, 0.0) 