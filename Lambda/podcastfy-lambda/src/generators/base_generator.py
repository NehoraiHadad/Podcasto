"""
Base generator for podcast creation.
"""
import os
import shutil
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime

from src.utils.logging import get_logger
from src.utils.audio_utils import calculate_audio_duration
from src.utils.s3_utils import upload_podcast_audio, upload_transcripts

logger = get_logger(__name__)

def get_safe_filename(filename: str) -> str:
    """
    Convert a string to a safe filename by removing potentially problematic characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Safe filename
    """
    # Replace problematic characters with underscores
    safe_chars = "-_.() abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return "".join(c if c in safe_chars else "_" for c in filename)

def setup_api_environment(config: Dict[str, Any]) -> Dict[str, str]:
    """
    Set up API keys in the environment.
    
    Args:
        config: Dictionary containing API keys
        
    Returns:
        Dictionary of API keys that were set
    """
    api_keys = {}
    
    # Set OpenAI API key if available
    if 'openai_api_key' in config:
        os.environ['OPENAI_API_KEY'] = config['openai_api_key']
        api_keys['openai'] = config['openai_api_key']
    
    # Set Gemini API key if available
    if 'gemini_api_key' in config:
        os.environ['GEMINI_API_KEY'] = config['gemini_api_key']
        api_keys['gemini'] = config['gemini_api_key']
    
    return api_keys

class BaseGenerator:
    """
    Base class for podcast generators.
    """
    def __init__(self, podcast_config: Dict[str, Any], storage_dir: Optional[str] = None):
        """
        Initialize the base generator.
        
        Args:
            podcast_config: Podcast configuration
            storage_dir: Directory to store generated podcasts (optional)
        """
        self.podcast_config = podcast_config
        self.storage_dir = storage_dir or os.environ.get('STORAGE_DIR', '/tmp/podcasts')
        
        # Create storage directory if it doesn't exist
        os.makedirs(self.storage_dir, exist_ok=True)

    def generate_podcast(
        self,
        audio_file: str,
        metadata: Dict[str, Any],
        output_path: str
    ) -> Optional[Tuple[str, Optional[str], int]]:
        """
        Process the generated podcast file, calculate duration, and upload to S3.
        
        Args:
            audio_file: Path to the generated audio file
            metadata: Podcast metadata (must include 'podcast_id' or 'id')
            output_path: Target local path for the podcast file
            
        Returns:
            Tuple of (local_path, s3_url, duration) or None if processing failed.
        """
        try:
            final_audio_path = output_path
            
            # Ensure the final audio file exists
            if not audio_file or not os.path.exists(audio_file):
                logger.error(f"Generated audio file not found: {audio_file}")
                return None
            
            # Copy/move the generated file if necessary
            if audio_file != output_path:
                try:
                    # Ensure destination directory exists
                    os.makedirs(os.path.dirname(output_path), exist_ok=True)
                    shutil.copy2(audio_file, output_path)
                    logger.info(f"Copied generated audio to {output_path}")
                except Exception as e:
                    logger.error(f"Failed to copy {audio_file} to {output_path}: {str(e)}")
                    return None # Cannot proceed without the file at the expected path
            else:
                final_audio_path = audio_file # Use the original path if no copy needed
                logger.info(f"Using existing audio file at {final_audio_path}")

            # Calculate audio duration
            duration = calculate_audio_duration(final_audio_path)

            # Prepare IDs and bucket for S3 upload
            # Use 'podcast_id' from metadata first, then 'id', then generate from title
            actual_podcast_id = metadata.get("podcast_id") or metadata.get("id")
            if not actual_podcast_id:
                 # Fallback using title, ensure it's reasonably safe
                 title_fallback = metadata.get("title", f"podcast_{datetime.now().strftime('%Y%m%d%H%M%S')}")
                 actual_podcast_id = get_safe_filename(title_fallback).lower()
                 logger.warning(f"Missing 'podcast_id' or 'id' in metadata, using fallback: {actual_podcast_id}")
            
            # Get episode_id from config or generate a fallback
            episode_id = self.podcast_config.get('episode_id')
            if not episode_id:
                episode_id = f"ep_{datetime.now().strftime('%Y%m%d%H%M%S')}" # Simpler fallback
                logger.warning(f"Missing episode_id in config, using fallback: {episode_id}")
            
            s3_bucket = os.environ.get('S3_BUCKET_NAME')
            if not s3_bucket:
                logger.error("S3_BUCKET_NAME environment variable not set. Cannot upload.")
                # Return local path and duration, but None for S3 URL
                return final_audio_path, None, duration

            # Upload audio file to S3
            upload_result = upload_podcast_audio(final_audio_path, actual_podcast_id, episode_id, s3_bucket)
            s3_url = upload_result.get('url') # Will be None if upload failed

            # Upload associated transcript files (uses hardcoded path for now)
            transcript_dir = "/tmp/podcastify-demo/transcripts" # Keep hardcoded path as per original logic
            upload_transcripts(transcript_dir, actual_podcast_id, episode_id, s3_bucket)
            
            # Return the final local path, S3 URL (if successful), and duration
            return final_audio_path, s3_url, duration
                
        except Exception as e:
            logger.exception(f"Error processing podcast in BaseGenerator: {str(e)}") # Use exception log
            return None

    def get_output_path(self, metadata: Dict[str, Any]) -> str:
        """
        Generate an output path for the podcast.
        
        Args:
            metadata: Podcast metadata
            
        Returns:
            Path to store the podcast
        """
        title = metadata.get("title", f"Podcast_{datetime.now().strftime('%Y%m%d%H%M%S')}")
        return os.path.join(self.storage_dir, f"{get_safe_filename(title)}.mp3")
    
    def prepare_api_environment(self) -> bool:
        """
        Prepare the API environment for podcast generation.
        
        Returns:
            True if successful, False otherwise
        """
        # Extract API keys from podcast config or environment variables
        config = {
            'openai_api_key': self.podcast_config.get('openai_api_key', os.environ.get('OPENAI_API_KEY', '')),
            'gemini_api_key': self.podcast_config.get('gemini_api_key', os.environ.get('GEMINI_API_KEY', ''))
        }
        
        api_keys = setup_api_environment(config)
        return bool(api_keys) 