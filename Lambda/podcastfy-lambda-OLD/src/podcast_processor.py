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
    Handles podcast creation from various sources (URL, Text, Telegram) using the podcastfy library.
    """
    def __init__(self, podcast_config: Dict[str, Any], event: Dict[str, Any], request_id: Optional[str] = None):
        """
        Initialize podcast processor with configuration.
        
        Args:
            podcast_config: Podcast configuration from database
            event: Processed event data (expects 'content_source', 'episode_id', and source-specific keys like 'urls', 'text', or 'telegram_data')
            request_id: Optional request ID for tracing
        """
        self.podcast_config = dict(podcast_config)
        self.event = event
        self.request_id = request_id
        self.log_prefix = f"[{request_id}] " if request_id else ""
        
        # Episode ID should be reliably passed in the event by SQSHandler
        if event.get('episode_id'):
            self.podcast_config['episode_id'] = event.get('episode_id')

        self.storage_dir = os.environ.get('STORAGE_DIR', '/tmp/podcasts')
        os.makedirs(self.storage_dir, exist_ok=True)
        
        # Initialize all generators again
        self.url_generator = UrlGenerator(self.podcast_config, self.storage_dir)
        self.text_generator = TextGenerator(self.podcast_config, self.storage_dir)
        self.telegram_generator = TelegramGenerator(self.podcast_config, self.storage_dir)
        
        # Styles and techniques are likely common
        self.conversation_styles = self.podcast_config.get('conversation_styles', [])
        self.engagement_techniques = self.podcast_config.get('engagement_techniques', [])
        
        logger.info(f"{self.log_prefix}Initialized PodcastProcessor for podcast ID: {self.podcast_config.get('id')} (Config ID: {self.event.get('podcast_config_id')}) ")
        if self.podcast_config.get('episode_id'):
            logger.info(f"{self.log_prefix}Processing for episode_id: {self.podcast_config.get('episode_id')}")

    def process(self) -> Dict[str, Any]:
        """
        Process podcast creation based on the content source in the event.
        
        Returns:
            Dictionary with processing results (status, message, s3_url, duration).
        """
        content_source = self.event.get('content_source')
        if not content_source:
            error_msg = "Missing content_source in processor event"
            logger.error(f"{self.log_prefix}{error_msg}")
            return {'status': 'error', 'message': error_msg, 'duration': 0}

        logger.info(f"{self.log_prefix}Processing podcast with content source: {content_source}")
        
        # Prepare common metadata
        # Note: podcast_id and episode_id are now reliably set in the event by SQSHandler
        metadata = {
            'id': self.podcast_config.get('id', ''), # Config ID
            'podcast_id': self.event.get('podcast_id', ''), 
            'episode_id': self.event.get('episode_id', ''), 
            'title': self.podcast_config.get('podcast_name', ''), # Use config name as base title
            'creator': self.podcast_config.get('creator', ''),
            'description': self.podcast_config.get('description', ''),
            'language': self.podcast_config.get('language', 'en'),
            'podcast_name': self.podcast_config.get('podcast_name', ''),
            'speaker1_role': self.podcast_config.get('speaker1_role', 'Host'),
            'speaker2_role': self.podcast_config.get('speaker2_role', 'Guest'),
            'conversation_styles': self.podcast_config.get('conversation_styles', []),
            'engagement_techniques': self.podcast_config.get('engagement_techniques', []),
            'creativity': float(self.podcast_config.get('creativity', 0.7)),
            'user_instructions': self.podcast_config.get('user_instructions', ''),
            'conversation_style': self.podcast_config.get('conversation_style', ['conversational']),
            'longform': self.podcast_config.get('longform', False),
            # Add source-specific keys later if needed, like telegram_content_url
            'content_source': content_source
        }
        logger.info(f"{self.log_prefix}Using base metadata: {metadata}")
        
        try:
            # Get common conversation config
            conversation_config = self.get_conversation_config(
                podcast_name=metadata.get('podcast_name'),
                podcast_tagline=metadata.get('description'),
                output_language=metadata.get('language'),
                conversation_style=metadata.get('conversation_style'),
                role_person1=metadata.get('speaker1_role'),
                role_person2=metadata.get('speaker2_role'),
                selected_techniques=metadata.get('engagement_techniques'),
                creativity=metadata.get('creativity'),
                user_instructions=metadata.get('user_instructions')
            )
            
            # Route based on content source
            if content_source == 'url':
                return self._process_url_source(metadata, conversation_config)
            elif content_source == 'text':
                return self._process_text_source(metadata, conversation_config)
            elif content_source == 'telegram':
                 # Pass original telegram content url if present in event
                 if self.event.get('content_url'):
                      metadata['telegram_content_url'] = self.event.get('content_url')
                 return self._process_telegram_source(metadata, conversation_config)
            else:
                error_msg = f"Unsupported content source: {content_source}"
                logger.error(f"{self.log_prefix}{error_msg}")
                return {'status': 'error', 'message': error_msg, 'duration': 0}
                
        except Exception as e:
            logger.exception(f"{self.log_prefix}Error processing podcast: {str(e)}")
            return {
                'status': 'error',
                'message': f"Error processing podcast: {str(e)}",
                'duration': 0 # Duration is 0 on general processing error
            }
            
    def _process_url_source(self, metadata: Dict[str, Any], conversation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Process URL content source"""
        urls = self.event.get('urls', [])
        if not urls:
            logger.error(f"{self.log_prefix}No URLs found in event for URL source type.")
            return {'status': 'error', 'message': 'No URLs provided in the message', 'duration': 0}
            
        logger.info(f"{self.log_prefix}Processing URLs: {urls}")
        # Call UrlGenerator - assume it returns (path, url, duration)
        result = self.url_generator.create_podcast(
            urls=urls,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=self.podcast_config.get('longform', False)
        )
        
        if not result:
            return {'status': 'error', 'message': 'Failed to create podcast from URLs', 'duration': 0}
            
        local_path, s3_url, duration = result
        return {
            'status': 'success',
            'message': 'Podcast created successfully from URLs', # Add message
            'local_path': local_path,
            's3_url': s3_url,
            'duration': duration
        }
        
    def _process_text_source(self, metadata: Dict[str, Any], conversation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Process text content source"""
        text = self.event.get('text', '')
        if not text:
            logger.error(f"{self.log_prefix}No text found in event for Text source type.")
            return {'status': 'error', 'message': 'No text provided in the message', 'duration': 0}
            
        logger.info(f"{self.log_prefix}Processing text content (length: {len(text)} chars).")
        # Call TextGenerator - assume it returns (path, url, duration)
        result = self.text_generator.create_podcast(
            text=text,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=self.podcast_config.get('longform', True) # Often true for text
        )
        
        if not result:
            return {'status': 'error', 'message': 'Failed to create podcast from text', 'duration': 0}
            
        local_path, s3_url, duration = result
        return {
            'status': 'success',
            'message': 'Podcast created successfully from text', # Add message
            'local_path': local_path,
            's3_url': s3_url,
            'duration': duration
        }
        
    def _process_telegram_source(self, metadata: Dict[str, Any], conversation_config: Dict[str, Any]) -> Dict[str, Any]:
        """Process Telegram content source using data from the event."""
        # Assume telegram_data is provided in the event by SQSHandler
        telegram_data = self.event.get('telegram_data')
        
        if not telegram_data:
             # This should ideally not happen if SQSHandler prepares the event correctly
            error_msg = 'No Telegram data provided in the event'
            logger.error(f"{self.log_prefix}{error_msg}")
            return {'status': 'error', 'message': error_msg, 'duration': 0}
        
        logger.info(f"{self.log_prefix}Processing provided Telegram data to create podcast")
        result = self.create_podcast_from_telegram_data(
            telegram_data=telegram_data,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=self.podcast_config.get('longform', False),
            request_id=self.request_id
        )
        
        if not result:
            duration = 0 
            return {
                'status': 'error', 
                'message': 'Failed to create podcast from Telegram data',
                'duration': duration
            }
            
        local_path, s3_url, duration = result
        return {
            'status': 'success',
            'message': 'Podcast created successfully from Telegram data', # Add message
            'local_path': local_path,
            's3_url': s3_url,
            'duration': duration
        }

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
        min_chunk_size: Optional[int] = None,
        request_id: Optional[str] = None
    ) -> Optional[Tuple[str, Optional[str], int]]:
        """
        Create a podcast from Telegram data.
        
        Args:
            telegram_data: Telegram data structure
            metadata: Podcast metadata (title, description, etc.)
            conversation_config: Configuration for the conversation
            longform: Whether to generate a longform podcast
            max_num_chunks: Maximum number of chunks to process
            min_chunk_size: Minimum size of each chunk
            request_id: Optional request ID for tracing
            
        Returns:
            Tuple of (local_path, s3_url, duration) for the generated podcast file or None if failed
        """
        # Delegate to telegram_generator and expect duration back
        result = self.telegram_generator.create_podcast(
            telegram_data=telegram_data,
            metadata=metadata,
            conversation_config=conversation_config,
            longform=longform,
            max_num_chunks=max_num_chunks,
            min_chunk_size=min_chunk_size,
            request_id=request_id
        )
        # Assuming telegram_generator.create_podcast now returns (local_path, s3_url, duration)
        return result 