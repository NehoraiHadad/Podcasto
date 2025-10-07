"""
Channel processing module for the Telegram collector Lambda function.
"""
import asyncio
import os
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

from src.config import PodcastConfig
from src.message_processor import MessageProcessor
from src.media_handler import MediaHandler
from src.clients.telegram_client import TelegramClientWrapper
from src.clients.s3_client import S3Client
from src.utils.logging import get_logger

logger = get_logger(__name__)


class ChannelProcessor:
    """
    Processes Telegram channels and collects messages.
    
    This class is responsible for coordinating the message processing and media handling
    for a Telegram channel.
    """
    
    def __init__(self, config: PodcastConfig):
        """
        Initialize the ChannelProcessor.
        
        Args:
            config: The podcast configuration
        """
        self.config = config
        self.message_processor = MessageProcessor(filtered_domains=config.filtered_domains)
        self.s3_client = S3Client()
        self.media_handler = MediaHandler(self.s3_client)
        self.is_local = False  # Will be set in process()
        self.media_dir = "/tmp/media"
        
        # Telegram client will be initialized in process()
        self.telegram_client = None
    
    async def process(self) -> Dict[str, Any]:
        """
        Process the channel and collect messages.
        
        Returns:
            A dictionary with the processing results
        """
        import os
        self.is_local = os.environ.get('AWS_SAM_LOCAL') == 'true'
        self.media_handler.is_local = self.is_local
        
        # Get Telegram credentials from environment
        api_id = os.getenv('TELEGRAM_API_ID')
        api_hash = os.getenv('TELEGRAM_API_HASH')
        session_string = os.getenv('TELEGRAM_SESSION', '')
        
        if not api_id or not api_hash or not session_string:
            logger.error("Missing Telegram credentials")
            return self._create_error_result("Missing Telegram credentials")
        
        # Initialize Telegram client
        self.telegram_client = TelegramClientWrapper(api_id, api_hash, session_string)
        
        try:
            # Connect to Telegram
            if not await self.telegram_client.connect():
                return self._create_error_result("Failed to connect to Telegram")
            
            # Process the channel
            channel = self.config.telegram_channel
            days_back = self.config.days_back

            # Check if custom date range is provided
            if self.config.start_date and self.config.end_date:
                start_dt = datetime.fromisoformat(self.config.start_date.replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(self.config.end_date.replace('Z', '+00:00'))
                logger.info(f"Processing channel: {channel}, Date range: {start_dt} to {end_dt}")

                # Get messages with custom date range
                messages = await self.telegram_client.get_messages(
                    channel,
                    start_date=start_dt,
                    end_date=end_dt
                )
            else:
                logger.info(f"Processing channel: {channel}, Days back: {days_back}")

                # Get messages with days_back (backward compatible)
                messages = await self.telegram_client.get_messages(channel, days_back)
            
            if not messages:
                logger.warning(f"No messages found in channel {channel}")
                return self._create_empty_result()
            
            # Create timestamp for consistent folder structure
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Use the episode ID from config if available, otherwise generate a new one
            # This is crucial for ensuring the episode ID is consistent throughout the pipeline
            episode_id = self.config.episode_id
            if not episode_id:
                # If no episode_id provided, use UUID for episode_id to ensure uniqueness
                episode_id = str(uuid.uuid4())
                logger.warning(f"No episode_id provided in config, generated new ID: {episode_id}")
            else:
                logger.info(f"Using provided episode_id from config: {episode_id}")
            
            # Set media handler context with the episode_id
            media_id = self.config.podcast_id if hasattr(self.config, 'podcast_id') and self.config.podcast_id else self.config.id
            self.media_handler.set_context(media_id, episode_id, self.config.media_types)
            logger.info(f"Set media handler context with podcast_id: {media_id}, episode_id: {episode_id}")
            
            # Process messages
            processed_messages = await self._process_messages(messages)
            
            # Create result
            result = {
                'status': 'success',
                'message': 'Data collected successfully',
                'podcast_config_id': self.config.id,
                'channel': channel,
                'days_back': days_back,
                'total_messages': len(processed_messages),
                'messages_per_channel': {channel: len(processed_messages)},
                'media_stats': self._calculate_media_stats(processed_messages, channel),
                'url_stats': {channel: sum(len(msg.get('urls', [])) for msg in processed_messages)},
                'filtered_domains': self.config.filtered_domains,
                'media_types': self.config.media_types,
                'results': {channel: processed_messages},
                'timestamp': timestamp,
                'episode_id': episode_id
            }
            
            # Add podcast_id to result if available (separate from config_id)
            if hasattr(self.config, 'podcast_id') and self.config.podcast_id:
                result['podcast_id'] = self.config.podcast_id
                logger.info(f"Added podcast_id to result: {self.config.podcast_id}")
            
            # Upload results to S3 using episode_id instead of timestamp
            upload_id = self.config.podcast_id if hasattr(self.config, 'podcast_id') and self.config.podcast_id else self.config.id
            s3_result = self.s3_client.upload_data(result, upload_id, episode_id)
            result['s3_path'] = s3_result
            logger.info(f"Uploaded data to S3 with podcast_id: {upload_id}, episode_id: {episode_id}")
            
            return result
            
        except Exception as e:
            logger.exception(f"Error processing channel {self.config.telegram_channel}: {str(e)}")
            return self._create_error_result(str(e))
        
        finally:
            # Disconnect from Telegram
            if self.telegram_client:
                await self.telegram_client.disconnect()
    
    async def _process_messages(self, messages: List[Any]) -> List[Dict[str, Any]]:
        """Process messages with advanced filtering and concurrency control."""
        processed_messages = []
        
        # Create a semaphore to limit concurrent processing
        semaphore = asyncio.Semaphore(10)
        
        async def process_message_with_semaphore(message):
            async with semaphore:
                return await self._process_single_message(message)
        
        # Create tasks for all messages
        tasks = [process_message_with_semaphore(msg) for msg in messages]
        
        # Process all messages concurrently
        results = await asyncio.gather(*tasks)
        
        # Filter out None results
        processed_messages = [msg for msg in results if msg is not None]
        
        logger.info(f"Processed {len(processed_messages)} relevant messages out of {len(messages)}")
        
        return processed_messages
    
    async def _process_single_message(self, message: Any) -> Optional[Dict[str, Any]]:
        """Process a single message and return its content if relevant."""
        try:
            if not message.text:
                return None
            
            # Check if message is promotional - do this first as it's fastest
            if self.message_processor.is_promotional(message.text):
                return None
            
            # Clean the text
            cleaned_text = self.message_processor.clean_text(message.text)
            
            # Check if message should be included
            if not self.message_processor.should_include(cleaned_text):
                return None
            
            # Extract URLs from the original text
            urls = self.message_processor.extract_urls(message.text)
            
            # Download media if present
            media_info = await self.media_handler.download_media(self.telegram_client.client, message)
            
            return {
                'id': message.id,
                'date': message.date.isoformat(),
                'text': cleaned_text,
                'media_info': media_info,
                'urls': urls,
                'channel': message.chat.username if hasattr(message.chat, 'username') else None
            }
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            return None
    
    def _calculate_media_stats(self, messages: List[Dict[str, Any]], channel: str) -> Dict[str, Dict[str, int]]:
        """Calculate media statistics."""
        media_stats = {
            channel: {
                'image': sum(1 for msg in messages if msg.get('media_info') and 'Image' in msg.get('media_info', '')),
                'video': sum(1 for msg in messages if msg.get('media_info') and 'Video' in msg.get('media_info', '')),
                'audio': sum(1 for msg in messages if msg.get('media_info') and 'Audio' in msg.get('media_info', '')),
                'file': sum(1 for msg in messages if msg.get('media_info') and 'File' in msg.get('media_info', '')),
                'download_failed': sum(1 for msg in messages if msg.get('media_info') and 'failed' in msg.get('media_info', ''))
            }
        }
        return media_stats
    
    def _create_error_result(self, error_message: str) -> Dict[str, Any]:
        """Create an error result."""
        return {
            'message': f'Error: {error_message}',
            'podcast_config_id': self.config.id,
            'channel': self.config.telegram_channel,
            'days_back': self.config.days_back,
            'total_messages': 0,
            'messages_per_channel': {self.config.telegram_channel: 0},
            'media_stats': {self.config.telegram_channel: {}},
            'url_stats': {self.config.telegram_channel: 0},
            'filtered_domains': self.config.filtered_domains,
            'results': {self.config.telegram_channel: []}
        }
    
    def _create_empty_result(self) -> Dict[str, Any]:
        """Create an empty result."""
        return {
            'message': 'No messages found',
            'podcast_config_id': self.config.id,
            'channel': self.config.telegram_channel,
            'days_back': self.config.days_back,
            'total_messages': 0,
            'messages_per_channel': {self.config.telegram_channel: 0},
            'media_stats': {self.config.telegram_channel: {}},
            'url_stats': {self.config.telegram_channel: 0},
            'filtered_domains': self.config.filtered_domains,
            'results': {self.config.telegram_channel: []}
        } 