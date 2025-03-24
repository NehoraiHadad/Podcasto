"""
URL-based podcast generator.
"""
from typing import Dict, Any, Optional, Tuple, List
from podcastfy.client import generate_podcast
import os

from src.utils.logging import get_logger
from src.generators.base_generator import BaseGenerator

logger = get_logger(__name__)

class UrlGenerator(BaseGenerator):
    """
    Generate podcasts from URL content sources.
    """
    
    def create_podcast(
        self,
        urls: List[str],
        metadata: Dict[str, Any],
        conversation_config: Dict[str, Any] = None,
        longform: bool = False,
        transcript_only: bool = False,
        max_num_chunks: Optional[int] = None,
        min_chunk_size: Optional[int] = None
    ) -> Optional[Tuple[str, Optional[str]]]:
        """
        Create a podcast from URLs.
        
        Args:
            urls: List of URLs to use as content sources
            metadata: Podcast metadata (title, description, etc.)
            conversation_config: Configuration for the conversation
            longform: Whether to generate a longform podcast
            transcript_only: Whether to generate a transcript only
            max_num_chunks: Maximum number of chunks to process
            min_chunk_size: Minimum size of each chunk
            
        Returns:
            Tuple of (local_path, s3_url) for the generated podcast file or None if failed
        """
        try:
            logger.info("Creating podcast from URLs")
            
            # Prepare API environment
            if not self.prepare_api_environment():
                return None
            
            # Create output path
            output_path = self.get_output_path(metadata)
            
            # Create required directories for podcast generation
            os.makedirs("/tmp/podcastify-demo/tmp", exist_ok=True)
            os.makedirs("/tmp/podcastify-demo/transcripts", exist_ok=True)
            os.makedirs("/tmp/podcastify-demo/audio", exist_ok=True)
            
            # Update conversation config with max_num_chunks and min_chunk_size if provided
            if conversation_config is None:
                conversation_config = {}
                
            if max_num_chunks is not None:
                conversation_config["max_num_chunks"] = max_num_chunks
            if min_chunk_size is not None:
                conversation_config["min_chunk_size"] = min_chunk_size
            
            # Generate podcast using the podcastfy library
            audio_file = generate_podcast(
                urls=urls,
                conversation_config={
                    **conversation_config,
                    "text_to_speech": {
                        "temp_audio_dir": "../../../../../../../../../../../../tmp/podcastify-demo/tmp",
                        "output_directories": {
                            "transcripts": "/tmp/podcastify-demo/transcripts",
                            "audio": "/tmp/podcastify-demo/audio"
                        }
                    }
                },
                transcript_only=transcript_only,
                longform=longform
            )
            
            # Process generated file and upload to S3
            return self.generate_podcast(audio_file, metadata, output_path)
            
        except Exception as e:
            logger.error(f"Error creating podcast from URLs: {str(e)}")
            return None 