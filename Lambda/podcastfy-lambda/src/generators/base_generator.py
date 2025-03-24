"""
Base generator for podcast creation.
"""
import os
import shutil
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from src.utils.logging import get_logger
from src.clients.s3_client import S3Client

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
        self.s3_client = S3Client()
        
        # Create storage directory if it doesn't exist
        os.makedirs(self.storage_dir, exist_ok=True)

    def generate_podcast(
        self,
        audio_file: str,
        metadata: Dict[str, Any],
        output_path: str
    ) -> Optional[Tuple[str, Optional[str]]]:
        """
        Process the generated podcast file, uploading to S3 if available.
        
        Args:
            audio_file: Path to the generated audio file
            metadata: Podcast metadata
            output_path: Path to store the final podcast file
            
        Returns:
            Tuple of (local_path, s3_url) or None if failed
        """
        try:
            # Move the generated file to our output path if needed
            if audio_file and os.path.exists(audio_file) and audio_file != output_path:
                shutil.copy2(audio_file, output_path)
                logger.info(f"Successfully created podcast at {output_path}")
                
                # Upload to S3
                podcast_id = metadata.get("id", metadata.get("title", "undefined").replace(" ", "_").lower())
                
                # Get episode_id or use podcast_id as fallback
                episode_id = self.podcast_config.get('episode_id', podcast_id)
                
                # S3 bucket from environment variable or use default
                s3_bucket = os.environ.get('S3_BUCKET_NAME', 'podcasto-podcasts')
                
                # Upload file to S3
                key = f"podcasts/{podcast_id}/{episode_id}/{os.path.basename(output_path)}"
                result = self.s3_client.upload_file(output_path, s3_bucket, key)
                
                if result.get('success', False):
                    s3_url = result.get('url')
                    return output_path, s3_url
                else:
                    logger.error(f"Failed to upload podcast to S3: {result.get('error')}")
                    return output_path, None
            elif audio_file and os.path.exists(audio_file):
                # File already at desired location
                logger.info(f"Using existing podcast at {output_path}")
                
                # Upload to S3 (same logic as above)
                podcast_id = metadata.get("id", metadata.get("title", "undefined").replace(" ", "_").lower())
                episode_id = self.podcast_config.get('episode_id', podcast_id)
                s3_bucket = os.environ.get('S3_BUCKET_NAME', 'podcasto-podcasts')
                
                key = f"podcasts/{podcast_id}/{episode_id}/{os.path.basename(output_path)}"
                result = self.s3_client.upload_file(output_path, s3_bucket, key)
                
                if result.get('success', False):
                    s3_url = result.get('url')
                    return output_path, s3_url
                else:
                    logger.error(f"Failed to upload podcast to S3: {result.get('error')}")
                    return output_path, None
            else:
                logger.error(f"No audio file was created")
                return None
                
        except Exception as e:
            logger.error(f"Error processing podcast: {str(e)}")
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