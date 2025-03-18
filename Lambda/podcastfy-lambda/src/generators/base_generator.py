"""
Base generator for podcast creation.
"""
import os
import shutil
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from src.utils.logging import get_logger
from src.utils.common import get_safe_filename, setup_api_environment
from src.clients.s3_client import S3Client

logger = get_logger(__name__)

class BaseGenerator:
    """
    Base class for podcast generators.
    """
    def __init__(self, config_manager, storage_dir: str = None):
        """
        Initialize the base generator.
        
        Args:
            config_manager: Configuration manager instance
            storage_dir: Directory to store generated podcasts
        """
        self.config_manager = config_manager
        self.storage_dir = storage_dir or config_manager.storage_dir
        self.s3_client = S3Client()
        
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
                upload_result = self.s3_client.upload_podcast(output_path, podcast_id)
                
                if upload_result:
                    s3_url, timestamp = upload_result
                    
                    # Upload metadata to S3 alongside the podcast using the same timestamp
                    self.s3_client.upload_metadata(metadata, podcast_id, s3_url, timestamp)
                    
                    return output_path, s3_url
                else:
                    logger.error("Failed to upload podcast to S3")
                    return output_path, None
            elif audio_file and os.path.exists(audio_file):
                # File already at desired location
                logger.info(f"Using existing podcast at {output_path}")
                
                # Upload to S3
                podcast_id = metadata.get("id", metadata.get("title", "undefined").replace(" ", "_").lower())
                upload_result = self.s3_client.upload_podcast(output_path, podcast_id)
                
                if upload_result:
                    s3_url, timestamp = upload_result
                    
                    # Upload metadata to S3 alongside the podcast using the same timestamp
                    self.s3_client.upload_metadata(metadata, podcast_id, s3_url, timestamp)
                    
                    return output_path, s3_url
                else:
                    logger.error("Failed to upload podcast to S3")
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
        api_keys = setup_api_environment(self.config_manager)
        return bool(api_keys) 