"""
SQS message handler for the Podcastfy Lambda function.
"""
import json
from typing import Dict, Any, Optional

from src.clients.s3_client import S3Client
from src.clients.supabase_client import SupabaseClient
from src.clients.sqs_client import SQSClient
from src.utils.logging import get_logger

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
    
    def extract_podcast_config_id(self, message: Dict[str, Any]) -> Optional[str]:
        """
        Extract the podcast config ID from an SQS message.
        
        Args:
            message: The SQS message
            
        Returns:
            The podcast config ID, or None if not found
        """
        podcast_config_id = message.get('podcast_config_id')
        
        if podcast_config_id:
            logger.info(f"Found podcast config ID: {podcast_config_id}")
            return str(podcast_config_id)
            
        logger.warning(f"No podcast_config_id found in message: {message}")
        return None
    
    def process_message(self, message: Dict[str, Any], request_id: str = None) -> Dict[str, Any]:
        """
        Process an SQS message.
        
        Args:
            message: The SQS message to process
            request_id: Request ID for tracing
            
        Returns:
            A dictionary with the processing results
        """
        log_prefix = f"[{request_id}] " if request_id else ""
        
        try:
            logger.info(f"{log_prefix}Processing SQS message: {message}")
            
            # Extract data directly from the message
            podcast_config_id = message.get('podcast_config_id')
            episode_id = message.get('episode_id')
            s3_path = message.get('s3_path')
            content_url = message.get('content_url', s3_path)
            
            if not podcast_config_id:
                logger.error(f"{log_prefix}Invalid SQS message: Missing podcast_config_id")
                return {
                    'status': 'error',
                    'message': 'Invalid SQS message: Missing podcast_config_id'
                }
            
            # Find the corresponding episode in the database using ID directly
            episode = None
            if episode_id:
                episode_result = self.supabase_client.get_episode(episode_id)
                
                if not episode_result.get('success', False):
                    logger.warning(f"{log_prefix}Failed to get episode: {episode_result.get('error')}")
                else:
                    episode = episode_result.get('episode')
                    logger.info(f"{log_prefix}Found episode {episode['id']} for podcast config {podcast_config_id}")
                    # Update status to content_collected
                    update_result = self.supabase_client.update_episode_status(episode['id'], 'content_collected')
                    if not update_result.get('success', False):
                        logger.warning(f"{log_prefix}Failed to update episode status: {update_result.get('error')}")
            
            # Download the content from S3 using the direct path
            content_result = None
            content_path = content_url or s3_path
            
            if content_path:
                try:
                    content_result = self.s3_client.download_telegram_content(
                        content_url=content_path,
                        request_id=request_id
                    )
                
                    if not content_result.get('success', False):
                        error_msg = content_result.get('error', 'Failed to download content from S3')
                        logger.error(f"{log_prefix}{error_msg}")
                        
                        if episode:
                            self.supabase_client.mark_episode_failed(episode['id'], error_msg)
                            
                        return {
                            'status': 'error',
                            'message': error_msg
                        }
                except ValueError as e:
                    error_msg = f"Error downloading content: {str(e)}"
                    logger.error(f"{log_prefix}{error_msg}")
                    
                    if episode:
                        self.supabase_client.mark_episode_failed(episode['id'], error_msg)
                        
                    return {
                        'status': 'error',
                        'message': error_msg
                    }
            else:
                error_msg = "No content path (s3_path or content_url) provided in SQS message"
                logger.error(f"{log_prefix}{error_msg}")
                
                if episode:
                    self.supabase_client.mark_episode_failed(episode['id'], error_msg)
                    
                return {
                    'status': 'error',
                    'message': error_msg
                }
            
            # No content available
            if not content_result or not content_result.get('content'):
                error_msg = "No content provided in SQS message or S3"
                logger.error(f"{log_prefix}{error_msg}")
                
                if episode:
                    self.supabase_client.mark_episode_failed(episode['id'], error_msg)
                    
                return {
                    'status': 'error',
                    'message': error_msg
                }
                
            # Process the content using PodcastProcessor
            try:
                from src.podcast_processor import PodcastProcessor
                
                # Create event object for PodcastProcessor
                processor_event = {
                    'podcast_config_id': podcast_config_id,
                    'content_url': content_url,
                    'content_source': 'telegram',  # Explicitly set content source
                    'telegram_data': content_result.get('content'),
                    'episode_id': episode_id  # Explicitly pass the episode_id
                }
                
                logger.info(f"{log_prefix}Initializing PodcastProcessor to generate audio")
                processor = PodcastProcessor(self.podcast_config, processor_event, request_id)
                
                # Process the content
                process_result = processor.process()
                
                if process_result.get('status') != 'success':
                    error_msg = f"Failed to process podcast content: {process_result.get('message')}"
                    logger.error(f"{log_prefix}{error_msg}")
                    
                    if episode:
                        self.supabase_client.mark_episode_failed(episode['id'], error_msg)
                        
                    return {
                        'status': 'error',
                        'message': error_msg
                    }
                
                # Update episode with the S3 URL
                s3_url = process_result.get('s3_url')
                if s3_url and episode:
                    logger.info(f"{log_prefix}S3 URL for episode {episode['id']}: {s3_url}")
                    
                    # Validate S3 URL format
                    if not s3_url.startswith("s3://"):
                        logger.warning(f"{log_prefix}S3 URL has unexpected format: {s3_url}")
                    
                    # Make sure episode_id is in the S3 URL
                    if episode_id not in s3_url:
                        logger.warning(f"{log_prefix}S3 URL does not contain episode_id {episode_id}: {s3_url}")
                    
                    update_result = self.supabase_client.update_episode_audio_url(
                        episode['id'], 
                        s3_url,
                        'completed'
                    )
                    
                    if not update_result.get('success', False):
                        logger.warning(f"{log_prefix}Failed to update episode audio URL: {update_result.get('error')}")
                    else:
                        logger.info(f"{log_prefix}Successfully updated episode {episode['id']} with S3 URL")
                
                # Success with audio generation
                return {
                    'status': 'success',
                    'message': 'Successfully processed SQS message and generated audio',
                    'episode_id': episode['id'] if episode else None,
                    'podcast_config_id': podcast_config_id,
                    's3_url': s3_url
                }
                
            except Exception as e:
                error_msg = f"Error generating podcast audio: {str(e)}"
                logger.error(f"{log_prefix}{error_msg}")
                
                if episode:
                    self.supabase_client.mark_episode_failed(episode['id'], error_msg)
                    
                return {
                    'status': 'error',
                    'message': error_msg
                }
                
            # Successfully processed message - This code will never be reached now
            return {
                'status': 'success',
                'message': 'Successfully processed SQS message',
                'episode_id': episode['id'] if episode else None,
                'podcast_config_id': podcast_config_id
            }
                
        except Exception as e:
            error_msg = f"Error processing SQS message: {str(e)}"
            logger.error(f"{log_prefix}{error_msg}")
            return {
                'status': 'error',
                'message': error_msg
            }
            
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