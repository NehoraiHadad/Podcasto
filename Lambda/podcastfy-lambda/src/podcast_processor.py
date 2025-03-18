"""
Podcast processor for handling podcast generation.
"""
from typing import Dict, Any, List, Optional, Tuple

from src.utils.logging import get_logger
from src.utils.common import ensure_directory_exists
from src.config import ConfigManager
from src.generators.url_generator import UrlGenerator
from src.generators.text_generator import TextGenerator
from src.generators.telegram_generator import TelegramGenerator

logger = get_logger(__name__)

class PodcastProcessor:
    """
    Handles podcast creation using the podcastfy library
    """
    def __init__(self, config_manager: ConfigManager):
        """
        Initialize podcast processor with configuration.
        
        Args:
            config_manager: Configuration manager instance
        """
        self.config_manager = config_manager
        self.storage_dir = config_manager.storage_dir
        ensure_directory_exists(self.storage_dir)
        
        # Initialize generators
        self.url_generator = UrlGenerator(config_manager)
        self.text_generator = TextGenerator(config_manager)
        self.telegram_generator = TelegramGenerator(config_manager)
        
        # Reference styles and techniques from config
        self.conversation_styles = config_manager.conversation_styles
        self.engagement_techniques = config_manager.engagement_techniques

    def create_podcast(
        self,
        urls: List[str],
        metadata: Dict[str, str],
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
        return self.url_generator.create_podcast(
            urls=urls,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=longform,
            transcript_only=transcript_only,
            max_num_chunks=max_num_chunks,
            min_chunk_size=min_chunk_size
        )

    def create_podcast_from_text(
        self,
        text: str,
        metadata: Dict[str, str],
        conversation_config: Dict[str, Any] = None,
        longform: bool = True,
        transcript_only: bool = False,
        images: Optional[List[str]] = None,
        llm_model_name: Optional[str] = None,
        max_num_chunks: Optional[int] = None,
        min_chunk_size: Optional[int] = None
    ) -> Optional[Tuple[str, Optional[str]]]:
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
            
        Returns:
            Tuple of (local_path, s3_url) for the generated podcast file or None if failed
        """
        return self.text_generator.create_podcast(
            text=text,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=longform,
            transcript_only=transcript_only,
            images=images,
            llm_model_name=llm_model_name,
            max_num_chunks=max_num_chunks,
            min_chunk_size=min_chunk_size
        )

    def get_conversation_config(
        self,
        podcast_name: str,
        podcast_tagline: str,
        output_language: str,
        conversation_style: List[str],
        role_person1: str,
        role_person2: str,
        selected_techniques: List[str],
        creativity: float,
        user_instructions: str = ""
    ) -> Dict[str, Any]:
        """
        Build a conversation configuration.
        
        Args:
            podcast_name: Name of the podcast
            podcast_tagline: Tagline or description
            output_language: Language for the podcast
            conversation_style: List of conversation style keywords
            role_person1: Role of the first speaker
            role_person2: Role of the second speaker
            selected_techniques: List of engagement techniques
            creativity: Creativity level (0-1)
            user_instructions: Additional instructions
            
        Returns:
            Conversation configuration dictionary
        """
        config = {
            "conversation_style": conversation_style,
            "roles_person1": role_person1,
            "roles_person2": role_person2,
            "podcast_name": podcast_name,
            "podcast_tagline": podcast_tagline,
            "output_language": output_language,
            "user_instructions": user_instructions,
            "engagement_techniques": selected_techniques,
            "creativity": creativity
        }
        
        return config

    def create_podcast_from_telegram_data(
        self,
        telegram_data: Dict[str, Any],
        metadata: Dict[str, str],
        conversation_config: Dict[str, Any] = None,
        longform: bool = True,
        max_num_chunks: Optional[int] = None,
        min_chunk_size: Optional[int] = None
    ) -> Optional[Tuple[str, Optional[str]]]:
        """
        Create a podcast from Telegram data.
        
        Args:
            telegram_data: Telegram data structure
            metadata: Podcast metadata (title, description, etc.)
            conversation_config: Configuration for the conversation
            longform: Whether to generate a longform podcast
            max_num_chunks: Maximum number of chunks to process
            min_chunk_size: Minimum size of each chunk
            
        Returns:
            Tuple of (local_path, s3_url) for the generated podcast file or None if failed
        """
        return self.telegram_generator.create_podcast(
            telegram_data=telegram_data,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=longform,
            max_num_chunks=max_num_chunks,
            min_chunk_size=min_chunk_size
        ) 