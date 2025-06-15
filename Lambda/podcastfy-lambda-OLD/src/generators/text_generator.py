"""
Text-based podcast generator.
"""
from typing import Dict, Any, Optional, Tuple, List
from podcastfy.client import generate_podcast
import os

from src.utils.logging import get_logger
from src.generators.base_generator import BaseGenerator

logger = get_logger(__name__)

class TextGenerator(BaseGenerator):
    """
    Generate podcasts from text content.
    """
    
    def create_podcast(
        self,
        text: str,
        metadata: Dict[str, Any],
        conversation_config: Dict[str, Any] = None,
        longform: bool = True,
        transcript_only: bool = False,
        images: Optional[List[str]] = None,
        llm_model_name: Optional[str] = None,
        max_num_chunks: Optional[int] = None,
        min_chunk_size: Optional[int] = None,
        api_key_label: Optional[str] = None
    ) -> Optional[Tuple[str, Optional[str], int]]:
        """
        Create a podcast from raw text.
        
        Args:
            text: Text content to convert to a podcast
            metadata: Podcast metadata (title, description, etc.)
            conversation_config: Configuration for the conversation
            longform: Whether to generate a longform podcast
            transcript_only: Whether to generate a transcript only
            images: List of image paths to include
            llm_model_name: Name of the LLM model to use
            max_num_chunks: Maximum number of chunks to process
            min_chunk_size: Minimum size of each chunk
            api_key_label: Label for the API key if needed
            
        Returns:
            Tuple of (local_path, s3_url, duration) for the generated podcast file or None if failed
        """
        try:
            logger.info("Creating podcast from text")
            
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
            
            # Prepare arguments for generate_podcast
            podcast_args = {
                "text": text,
                "metadata": metadata,
                "llm_model_name": llm_model_name,
                "api_key_label": api_key_label,
                "conversation_config": {
                    **conversation_config,
                    "text_to_speech": {
                        "tts_model": "gpt-4o-mini-tts",
                        "temp_audio_dir": "../../../../../../../../../../../../tmp/podcastify-demo/tmp",
                        "output_directories": {
                            "transcripts": "/tmp/podcastify-demo/transcripts",
                            "audio": "/tmp/podcastify-demo/audio"
                        }
                    }
                },
                "transcript_only": transcript_only,
                "longform": longform
            }
            
            # Generate podcast using the podcastfy library
            audio_file = generate_podcast(**podcast_args)
            
            # Process generated file and upload to S3
            return self.generate_podcast(audio_file, metadata, output_path)
            
        except Exception as e:
            logger.error(f"Error creating podcast from text: {str(e)}")
            return None 