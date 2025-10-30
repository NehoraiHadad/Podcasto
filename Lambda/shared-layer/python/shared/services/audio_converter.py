"""
Audio format conversion service using pydub and FFmpeg.
Converts WAV to MP3 with configurable bitrate for podcast storage optimization.

This service reduces storage and bandwidth costs by 80-90% while maintaining
good audio quality for speech content.
"""
import os
import logging
from io import BytesIO
from typing import Tuple, Optional, Dict, Any
from pydub import AudioSegment

logger = logging.getLogger(__name__)


class AudioConverter:
    """Handles audio format conversions for podcast episodes."""

    # MP3 bitrate configurations
    BITRATE_HIGH = "192k"      # High quality (8-9 MB per 30 min)
    BITRATE_STANDARD = "128k"  # Standard quality (5-6 MB per 30 min) - RECOMMENDED
    BITRATE_LOW = "96k"        # Low quality (3-4 MB per 30 min)

    DEFAULT_BITRATE = BITRATE_STANDARD

    def __init__(self, bitrate: str = DEFAULT_BITRATE):
        """
        Initialize audio converter.

        Args:
            bitrate: MP3 encoding bitrate (e.g., "128k", "192k")
        """
        self.bitrate = bitrate
        logger.info(f"[AUDIO_CONVERTER] Initialized with bitrate: {bitrate}")

    def wav_to_mp3(
        self,
        wav_data: bytes,
        bitrate: Optional[str] = None
    ) -> Tuple[bytes, Dict[str, Any]]:
        """
        Convert WAV audio data to MP3 format.

        Args:
            wav_data: WAV audio data as bytes
            bitrate: Override default bitrate (optional)

        Returns:
            Tuple of (mp3_bytes, metadata_dict)

        Raises:
            Exception if conversion fails
        """
        try:
            effective_bitrate = bitrate or self.bitrate

            # Load WAV from bytes
            logger.info("[AUDIO_CONVERTER] Loading WAV audio data...")
            wav_io = BytesIO(wav_data)
            audio = AudioSegment.from_wav(wav_io)

            # Get audio metadata
            duration_seconds = len(audio) / 1000.0
            original_size_mb = len(wav_data) / (1024 * 1024)

            logger.info(
                f"[AUDIO_CONVERTER] Loaded WAV audio: duration={duration_seconds:.1f}s, "
                f"size={original_size_mb:.2f}MB"
            )

            # Convert to MP3
            logger.info(f"[AUDIO_CONVERTER] Converting to MP3 with bitrate {effective_bitrate}...")
            mp3_io = BytesIO()
            audio.export(
                mp3_io,
                format="mp3",
                bitrate=effective_bitrate,
                parameters=["-q:a", "2"]  # VBR quality (0-9, 2 is high quality)
            )

            mp3_bytes = mp3_io.getvalue()
            compressed_size_mb = len(mp3_bytes) / (1024 * 1024)
            compression_ratio = (1 - compressed_size_mb / original_size_mb) * 100

            metadata = {
                "duration_seconds": round(duration_seconds, 2),
                "original_size_mb": round(original_size_mb, 2),
                "compressed_size_mb": round(compressed_size_mb, 2),
                "compression_ratio": round(compression_ratio, 1),
                "bitrate": effective_bitrate,
                "format": "mp3"
            }

            logger.info(
                f"[AUDIO_CONVERTER] MP3 conversion successful: "
                f"size={compressed_size_mb:.2f}MB ({compression_ratio:.1f}% reduction)"
            )

            return mp3_bytes, metadata

        except Exception as e:
            logger.error(f"[AUDIO_CONVERTER] Error converting WAV to MP3: {e}", exc_info=True)
            raise Exception(f"Audio conversion failed: {str(e)}")

    @staticmethod
    def validate_wav(wav_data: bytes) -> bool:
        """
        Validate that the provided data is valid WAV format.

        Args:
            wav_data: Audio data to validate

        Returns:
            True if valid WAV, False otherwise
        """
        try:
            wav_io = BytesIO(wav_data)
            AudioSegment.from_wav(wav_io)
            return True
        except Exception as e:
            logger.warning(f"[AUDIO_CONVERTER] WAV validation failed: {e}")
            return False
