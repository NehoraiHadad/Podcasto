"""
Utilities for audio processing.
"""
from src.utils.logging import get_logger

logger = get_logger(__name__)

def calculate_audio_duration(file_path: str) -> int:
    """
    Calculate the duration of an audio file in seconds using ffmpeg.

    Args:
        file_path: Path to the audio file.

    Returns:
        Duration in seconds as an integer, or 0 if calculation fails.
    """
    duration = 0
    try:
        import ffmpeg
        logger.info(f"Calculating audio duration for file: {file_path}")
        probe = ffmpeg.probe(file_path)
        
        # Find the audio stream
        audio_stream = next((stream for stream in probe.get('streams', []) if stream.get('codec_type') == 'audio'), None)
        
        if audio_stream and 'duration' in audio_stream:
            # Get duration from the audio stream
            duration = int(float(audio_stream['duration']))
            logger.info(f"Audio duration from stream: {duration} seconds")
        elif 'format' in probe and 'duration' in probe['format']:
            # If no audio stream found or no duration in stream, try format duration
            duration = int(float(probe['format']['duration']))
            logger.info(f"Audio duration from format: {duration} seconds")
        else:
             logger.warning(f"Could not determine duration from ffmpeg probe for {file_path}")

    except ImportError:
         logger.error("ffmpeg-python library not found. Cannot calculate audio duration.")
    except Exception as e:
        logger.error(f"Error calculating audio duration for {file_path}: {str(e)}")
        
    return duration 