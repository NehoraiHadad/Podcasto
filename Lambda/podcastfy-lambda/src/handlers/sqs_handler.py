"""
SQS message handler for the Podcastfy Lambda function.
"""
import json
from typing import Dict, Any, Optional
import os

from src.clients.s3_client import S3Client
from src.clients.supabase_client import SupabaseClient
from src.clients.sqs_client import SQSClient
from src.utils.logging import get_logger
from src.podcast_processor import PodcastProcessor

logger = get_logger(__name__)

class SQSHandler:
    """Handler for SQS message processing."""
    
    def __init__(self, podcast_config: Dict[str, Any], supabase_client: Optional[SupabaseClient] = None):
        """
        Initialize with podcast configuration and optional Supabase client.
        
        Args:
            podcast_config: The podcast configuration
            supabase_client: Optional Supabase client for database operations
        """
        self.podcast_config = podcast_config
        self.s3_client = S3Client()
        self.sqs_client = SQSClient()
        
        # Use provided Supabase client or create a new one
        self.supabase_client = supabase_client or SupabaseClient()
    
    def _get_episode_data(self, episode_id: str, log_prefix: str) -> Optional[Dict[str, Any]]:
        """Fetch episode data from Supabase and update status to content_collected."""
        if not episode_id:
            logger.info(f"{log_prefix}No episode_id provided in message.")
            return None
            
        episode_result = self.supabase_client.get_episode(episode_id)
        if not episode_result.get('success', False):
            logger.warning(f"{log_prefix}Failed to get episode {episode_id}: {episode_result.get('error')}")
            return None
        
        episode = episode_result.get('episode')
        logger.info(f"{log_prefix}Found episode {episode['id']}")
        
        # Update status to content_collected
        update_result = self.supabase_client.update_episode_status(episode['id'], 'content_collected')
        if not update_result.get('success', False):
            logger.warning(f"{log_prefix}Failed to update episode status for {episode['id']}: {update_result.get('error')}")
            # Continue processing even if status update fails
        
        return episode

    def _download_content(self, content_path: str, request_id: str, log_prefix: str) -> Optional[Dict[str, Any]]:
        """Download content from S3 using the provided path."""
        if not content_path:
            logger.error(f"{log_prefix}No content path (s3_path or content_url) provided.")
            return None
            
        try:
            content_result = self.s3_client.download_telegram_content(
                content_url=content_path,
                request_id=request_id
            )
            if not content_result.get('success', False):
                logger.error(f"{log_prefix}{content_result.get('error', 'Failed to download content from S3')}")
                return None
            
            if not content_result.get('content'):
                 logger.error(f"{log_prefix}No content found in downloaded data from {content_path}")
                 return None
                 
            return content_result.get('content') # Return only the actual content data

        except ValueError as e:
            logger.error(f"{log_prefix}Error downloading content from {content_path}: {str(e)}")
            return None
        except Exception as e: # Catch broader exceptions during download
             logger.exception(f"{log_prefix}Unexpected error downloading content from {content_path}: {str(e)}")
             return None
             
    def _process_content(self, processor_event: Dict[str, Any], request_id: str, log_prefix: str) -> Dict[str, Any]:
        """Initialize and run the PodcastProcessor."""
        try:
            logger.info(f"{log_prefix}Initializing PodcastProcessor to generate audio")
            processor = PodcastProcessor(self.podcast_config, processor_event, request_id)
            process_result = processor.process()
            return process_result
        except Exception as e:
            error_msg = f"Error generating podcast audio: {str(e)}"
            logger.exception(f"{log_prefix}{error_msg}") # Log with stack trace
            return {
                'status': 'error',
                'message': error_msg
            }

    def _update_episode_result(self, episode_id: str, process_result: Dict[str, Any], log_prefix: str):
        """Update the episode in Supabase based on the processing result."""
        if not episode_id:
            logger.warning(f"{log_prefix}No episode_id available to update results.")
            return

        if process_result.get('status') == 'success':
            s3_url = process_result.get('s3_url')
            duration = process_result.get('duration', 0)

            if not s3_url:
                logger.error(f"{log_prefix}S3 URL not found in successful process_result for episode {episode_id}")
                # Mark as failed if S3 URL is missing despite success status
                self.supabase_client.mark_episode_failed(episode_id, "Processing succeeded but S3 URL was missing.")
                return
                
            # Validate S3 URL format minimally
            if not s3_url.startswith('https://') or '.s3.' not in s3_url:
                logger.warning(f"{log_prefix}Potentially invalid S3 URL format for episode {episode_id}: {s3_url}")

            logger.info(f"{log_prefix}Updating episode {episode_id} with Audio URL: {s3_url} and Duration: {duration}s")
            update_result = self.supabase_client.update_episode_audio_url(
                episode_id=episode_id,
                audio_url=s3_url,
                duration=duration
            )
            if not update_result.get('success', False):
                logger.warning(f"{log_prefix}Failed to update episode audio URL for {episode_id}: {update_result.get('error')}")
            else:
                logger.info(f"{log_prefix}Successfully updated episode {episode_id} with audio URL and duration.")
        else:
            # Processing failed
            error_msg = process_result.get('message', 'Unknown processing error')
            logger.error(f"{log_prefix}Podcast processing failed for episode {episode_id}: {error_msg}")
            self.supabase_client.mark_episode_failed(episode_id, error_msg)

    def process_message(self, message: Dict[str, Any], request_id: str = None) -> Dict[str, Any]:
        """
        Process an SQS message by orchestrating steps via helper methods.
        
        Args:
            message: The SQS message to process
            request_id: Request ID for tracing
            
        Returns:
            A dictionary with the overall processing status for this message.
        """
        log_prefix = f"[{request_id}] " if request_id else ""
        logger.info(f"{log_prefix}Processing SQS message: {message}")
        
        # 1. Extract common data
        podcast_config_id = message.get('podcast_config_id')
        podcast_id = message.get('podcast_id', podcast_config_id) # Use event's podcast_id first
        episode_id = message.get('episode_id')

        # Config ID is essential
        if not podcast_config_id:
             logger.critical(f"{log_prefix}FATAL: podcast_config_id missing. Message: {message}")
             return {'status': 'error', 'message': 'Internal error: podcast_config_id missing'}

        # 2. Determine content source and extract specific data
        content_source = None
        processor_event_data = {}
        error_msg = None
        
        # Check config for URL source first
        config_urls = self.podcast_config.get('urls')
        config_source = self.podcast_config.get('content_source')

        if config_source == 'url' or (isinstance(config_urls, list) and config_urls):
            content_source = 'url'
            processor_event_data = {'urls': config_urls}
            logger.info(f"{log_prefix}Detected URL source type from podcast_config.")
            # No download needed for URL type
            telegram_content = None # Ensure telegram_content is None for URL type
            
        # If not URL source from config, check message body for Text source
        elif 'text' in message and isinstance(message.get('text'), str):
            content_source = 'text'
            processor_event_data = {'text': message['text']}
            logger.info(f"{log_prefix}Detected Text source type from message body.")
            # No download needed for Text type
            telegram_content = None # Ensure telegram_content is None for Text type

        # Otherwise, assume Telegram source based on message body content path
        else:
            s3_path = message.get('s3_path')
            content_url = message.get('content_url', s3_path)
            content_path = content_url or s3_path
            if content_path:
                content_source = 'telegram'
                logger.info(f"{log_prefix}Assuming Telegram source type (path: {content_path}). Downloading content.")
                # 3a. Download Telegram Content
                telegram_content = self._download_content(content_path, request_id, log_prefix)
                if telegram_content is None:
                    error_msg = f"Failed to download or validate Telegram content from {content_path}"
                else:
                    processor_event_data = {'telegram_data': telegram_content, 'content_url': content_url}
            else:
                 # If config didn't specify URL/Text and message has no path, it's an invalid state
                 error_msg = "Invalid state: Source not URL/Text in config, and no content path in message."

        # Handle errors from source detection/download
        if error_msg:
            logger.error(f"{log_prefix}{error_msg}. Message: {message}")
            if episode_id:
                self.supabase_client.mark_episode_failed(episode_id, error_msg)
            return {'status': 'error', 'message': error_msg, 'podcast_config_id': podcast_config_id, 'episode_id': episode_id}

        # 3b. Get Episode Data 
        episode_data = self._get_episode_data(episode_id, log_prefix)

        # 4. Prepare event for PodcastProcessor
        processor_event = {
            'podcast_config_id': podcast_config_id,
            'podcast_id': episode_data.get('podcast_id') if episode_data else podcast_id,
            'episode_id': episode_id,
            'content_source': content_source,
            **processor_event_data # Add source-specific data (urls, text, or telegram_data)
        }
        if episode_data and episode_data.get('podcast_id'):
             logger.info(f"{log_prefix}Using podcast_id from fetched episode data: {episode_data.get('podcast_id')}")

        # 5. Process Content
        process_result = self._process_content(processor_event, request_id, log_prefix)

        # 6. Update Episode Result in DB
        self._update_episode_result(episode_id, process_result, log_prefix)

        # 7. Return final status
        final_status = {
            'status': process_result.get('status', 'error'),
            'message': process_result.get('message', 'Processing finished with errors'),
            'podcast_config_id': podcast_config_id,
            'episode_id': episode_id,
            's3_url': process_result.get('s3_url')
        }
        logger.info(f"{log_prefix}Finished processing message. Final status: {final_status['status']}")
        return final_status

    def send_message(self, message_body: Dict[str, Any], request_id: str = None) -> Dict[str, Any]:
        """
        Send a message to the SQS queue.
        
        Args:
            message_body: The message body to send
            request_id: Request ID for tracing
            
        Returns:
            A dictionary with the result of the send operation
        """
        return self.sqs_client.send_message(message_body, request_id) 