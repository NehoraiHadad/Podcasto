"""
Podcast processor for handling podcast generation.
"""
import os
from typing import Dict, Any, List, Optional, Tuple

from src.utils.logging import get_logger
from src.generators.url_generator import UrlGenerator
from src.generators.text_generator import TextGenerator
from src.generators.telegram_generator import TelegramGenerator

logger = get_logger(__name__)

class PodcastProcessor:
    """
    Handles podcast creation using the podcastfy library
    """
    def __init__(self, podcast_config: Dict[str, Any], event: Dict[str, Any], request_id: Optional[str] = None):
        """
        Initialize podcast processor with configuration.
        
        Args:
            podcast_config: Podcast configuration from database
            event: Lambda event containing request parameters
            request_id: Optional request ID for tracing
        """
        self.podcast_config = podcast_config
        self.event = event
        self.request_id = request_id
        self.log_prefix = f"[{request_id}] " if request_id else ""
        
        # Set storage directory from environment or use default
        self.storage_dir = os.environ.get('STORAGE_DIR', '/tmp/podcasts')
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize generators
        self.url_generator = UrlGenerator(podcast_config, self.storage_dir)
        self.text_generator = TextGenerator(podcast_config, self.storage_dir)
        self.telegram_generator = TelegramGenerator(podcast_config, self.storage_dir)
        
        # Get styles and techniques from podcast config
        self.conversation_styles = podcast_config.get('conversation_styles', [])
        self.engagement_techniques = podcast_config.get('engagement_techniques', [])
        
        logger.info(f"{self.log_prefix}Initialized PodcastProcessor with podcast ID: {podcast_config.get('id')}")

    def process(self) -> Dict[str, Any]:
        """
        Process the podcast based on the configuration and event.
        
        Returns:
            Dictionary with processing results
        """
        try:
            # Determine the content source type
            content_source = self.podcast_config.get('content_source')
            logger.info(f"{self.log_prefix}Processing podcast with content source: {content_source}")
            
            # Prepare metadata
            metadata = {
                'id': self.podcast_config.get('id'),
                'title': self.podcast_config.get('title', 'Untitled Podcast'),
                'description': self.podcast_config.get('description', '')
            }
            
            # Get conversation config
            conversation_config = self.get_conversation_config(
                podcast_name=self.podcast_config.get('title', 'Podcast'),
                podcast_tagline=self.podcast_config.get('description', ''),
                output_language=self.podcast_config.get('language', 'en'),
                conversation_style=self.podcast_config.get('conversation_style', ['conversational']),
                role_person1=self.podcast_config.get('speaker1_role', 'Host'),
                role_person2=self.podcast_config.get('speaker2_role', 'Guest'),
                selected_techniques=self.podcast_config.get('engagement_techniques', []),
                creativity=float(self.podcast_config.get('creativity', 0.7)),
                user_instructions=self.podcast_config.get('user_instructions', '')
            )
            
            # Process based on content source
            if content_source == 'url':
                return self._process_url_source(metadata, conversation_config)
            elif content_source == 'text':
                return self._process_text_source(metadata, conversation_config)
            elif content_source == 'telegram':
                return self._process_telegram_source(metadata, conversation_config)
            else:
                error_msg = f"Unsupported content source: {content_source}"
                logger.error(f"{self.log_prefix}{error_msg}")
                return {
                    'status': 'error',
                    'message': error_msg
                }
                
        except Exception as e:
            logger.error(f"{self.log_prefix}Error processing podcast: {str(e)}")
            return {
                'status': 'error',
                'message': f"Error processing podcast: {str(e)}"
            }
            
    def _process_url_source(self, metadata: Dict[str, Any], conversation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Process URL content source"""
        urls = self.event.get('urls', [])
        if not urls:
            return {'status': 'error', 'message': 'No URLs provided'}
            
        result = self.create_podcast(
            urls=urls,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=self.podcast_config.get('longform', False)
        )
        
        if not result:
            return {'status': 'error', 'message': 'Failed to create podcast from URLs'}
            
        local_path, s3_url = result
        return {
            'status': 'success',
            'local_path': local_path,
            's3_url': s3_url
        }
        
    def _process_text_source(self, metadata: Dict[str, Any], conversation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Process text content source"""
        text = self.event.get('text', '')
        if not text:
            return {'status': 'error', 'message': 'No text provided'}
            
        result = self.create_podcast_from_text(
            text=text,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=self.podcast_config.get('longform', True)
        )
        
        if not result:
            return {'status': 'error', 'message': 'Failed to create podcast from text'}
            
        local_path, s3_url = result
        return {
            'status': 'success',
            'local_path': local_path,
            's3_url': s3_url
        }
        
    def _process_telegram_source(self, metadata: Dict[str, Any], conversation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Process Telegram content source"""
        # Check if telegram_data is already provided in the event
        telegram_data = self.event.get('telegram_data')
        
        if not telegram_data:
            # Get content URL from event or config if telegram_data not already provided
            content_url = self.event.get('content_url', self.podcast_config.get('telegram_content_url'))
            if not content_url:
                return {'status': 'error', 'message': 'No Telegram content URL provided'}
                
            # Download content from S3
            from src.clients.s3_client import S3Client
            s3_client = S3Client()
            content_result = s3_client.download_telegram_content(content_url, self.request_id)
            
            if not content_result.get('success', False):
                error_msg = f"Failed to download Telegram content: {content_result.get('error')}"
                logger.error(f"{self.log_prefix}{error_msg}")
                return {'status': 'error', 'message': error_msg}
                
            telegram_data = content_result.get('content')
        
        logger.info(f"{self.log_prefix}Processing Telegram data to create podcast")
        result = self.create_podcast_from_telegram_data(
            telegram_data=telegram_data,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=self.podcast_config.get('longform', False)
        )
        
        if not result:
            return {'status': 'error', 'message': 'Failed to create podcast from Telegram data'}
            
        local_path, s3_url = result
        return {
            'status': 'success',
            'local_path': local_path,
            's3_url': s3_url
        }

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