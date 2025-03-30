"""
Lambda function handler for podcastfy processing.
"""
import json
import os
import uuid
from typing import Dict, Any, Optional
from contextlib import contextmanager

from src.clients.supabase_client import SupabaseClient
from src.handlers.sqs_handler import SQSHandler
from src.utils.logging import get_logger
from src.utils.response import create_response
from src.podcast_processor import PodcastProcessor

logger = get_logger(__name__)

# Log environment variables at module initialization for debugging
def log_environment():
    """Log important environment variables for debugging."""
    env_vars = {
        'S3_BUCKET_NAME': os.environ.get('S3_BUCKET_NAME', 'Not set'),
        'STORAGE_DIR': os.environ.get('STORAGE_DIR', 'Not set'),
        'AWS_REGION': os.environ.get('AWS_REGION', 'Not set'),
        'AWS_LAMBDA_FUNCTION_NAME': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'Not set')
    }
    
    logger.info("Lambda environment variables:")
    for key, value in env_vars.items():
        # Don't log values that might contain secrets
        if 'KEY' in key or 'SECRET' in key or 'PASSWORD' in key:
            logger.info(f"  {key}: [Redacted]")
        else:
            logger.info(f"  {key}: {value}")

# Log environment variables when module is loaded
log_environment()

@contextmanager
def resource_manager():
    """Context manager for Supabase client resources."""
    supabase_client = None
    try:
        # Create resources
        supabase_client = SupabaseClient()
        yield supabase_client
    finally:
        # Clean up resources
        if supabase_client:
            supabase_client.close_session()

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function entry point.
    
    Args:
        event: The event dict from AWS Lambda
        context: The context object from AWS Lambda
        
    Returns:
        A dictionary with the Lambda response
    """
    request_id = context.aws_request_id if hasattr(context, 'aws_request_id') else None
    log_prefix = f"[{request_id}] " if request_id else ""
    
    logger.info(f"{log_prefix}Received event: {event}")
    
    try:
        # Handle SQS event
        if 'Records' in event and isinstance(event['Records'], list):
            result = process_sqs_event(event, request_id)
            return create_response(200, result)
        
        # Handle direct invocation
        if 'podcast_config_id' in event:
            result = process_direct_invocation(event, request_id)
            return create_response(200, result)
            
        # Invalid event
        logger.error(f"{log_prefix}Invalid event format: {event}")
        return create_response(400, {
            'status': 'error',
            'message': 'Invalid event format'
        })
        
    except Exception as e:
        logger.error(f"{log_prefix}Error in lambda_handler: {str(e)}")
        return create_response(500, {
            'status': 'error',
            'message': f'Error: {str(e)}'
        })

def is_valid_uuid(val: str) -> bool:
    """
    Check if a string is a valid UUID.
    
    Args:
        val: The string to validate
        
    Returns:
        True if the string is a valid UUID, False otherwise
    """
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError):
        return False

def process_sqs_event(event: Dict[str, Any], request_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Process an SQS event.
    
    Args:
        event: The SQS event
        request_id: Request ID for tracing
        
    Returns:
        A dictionary with the processing results
    """
    log_prefix = f"[{request_id}] " if request_id else ""
    logger.info(f"{log_prefix}Processing SQS event with {len(event['Records'])} records")
    
    results = []
    
    with resource_manager() as supabase_client:
        for record in event['Records']:
            try:
                # Parse message body
                message_body = record.get('body', '{}')
                try:
                    message = json.loads(message_body)
                except json.JSONDecodeError:
                    logger.error(f"{log_prefix}Failed to parse message body: {message_body}")
                    results.append({
                        'status': 'error',
                        'message': 'Failed to parse message body'
                    })
                    continue
                
                # Get podcast_config_id from message
                podcast_config_id = message.get('podcast_config_id')
                if not podcast_config_id:
                    logger.error(f"{log_prefix}No podcast_config_id in message: {message}")
                    results.append({
                        'status': 'error',
                        'message': 'No podcast_config_id in message'
                    })
                    continue
                
                # Validate UUID format
                if not is_valid_uuid(podcast_config_id):
                    error_msg = f"Invalid UUID format for podcast_config_id: {podcast_config_id}"
                    logger.error(f"{log_prefix}{error_msg}")
                    results.append({
                        'status': 'error',
                        'message': error_msg
                    })
                    continue
                
                # Get podcast configuration using the flexible method
                logger.info(f"{log_prefix}Getting podcast config for ID: {podcast_config_id}")
                config_result = supabase_client.get_podcast_config_flexible(podcast_config_id)
                if not config_result.get('success', False):
                    error_msg = f"Failed to get podcast config: {config_result.get('error')}"
                    logger.error(f"{log_prefix}{error_msg}")
                    results.append({
                        'status': 'error',
                        'message': error_msg
                    })
                    continue
                
                podcast_config = config_result.get('config')
                logger.info(f"{log_prefix}Successfully retrieved podcast config: {podcast_config.get('id')}")
                
                # Process SQS message
                sqs_handler = SQSHandler(podcast_config, supabase_client)
                result = sqs_handler.process_message(message, request_id)
                results.append(result)
                
                # Log success or failure
                if result.get('status') == 'success':
                    episode_id = message.get('episode_id') or podcast_config.get('episode_id')
                    s3_path = result.get('s3_url') or result.get('s3_path')
                    
                    if episode_id:
                        logger.info(f"{log_prefix}Successfully processed episode {episode_id} with s3_path: {s3_path}")
                else:
                    # Log error
                    episode_id = message.get('episode_id') or podcast_config.get('episode_id')
                    error_msg = result.get('message', 'Unknown error')
                    if episode_id:
                        logger.error(f"{log_prefix}Error processing episode {episode_id}: {error_msg}")
                
            except Exception as e:
                logger.error(f"{log_prefix}Error processing SQS record: {str(e)}")
                results.append({
                    'status': 'error',
                    'message': f'Error: {str(e)}'
                })
    
    return {
        'status': 'success',
        'results': results
    }

def process_direct_invocation(event: Dict[str, Any], request_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Process a direct Lambda invocation.
    
    Args:
        event: The direct invocation event
        request_id: Request ID for tracing
        
    Returns:
        A dictionary with the processing results
    """
    log_prefix = f"[{request_id}] " if request_id else ""
    logger.info(f"{log_prefix}Processing direct invocation")
    
    # Get podcast_config_id from event
    podcast_config_id = event.get('podcast_config_id')
    
    # Validate UUID format
    if not is_valid_uuid(podcast_config_id):
        error_msg = f"Invalid UUID format for podcast_config_id: {podcast_config_id}"
        logger.error(f"{log_prefix}{error_msg}")
        return {
            'status': 'error',
            'message': error_msg
        }
    
    with resource_manager() as supabase_client:
        # Get podcast configuration using the flexible method
        logger.info(f"{log_prefix}Getting podcast config for ID: {podcast_config_id}")
        config_result = supabase_client.get_podcast_config_flexible(podcast_config_id)
        if not config_result.get('success', False):
            error_msg = f"Failed to get podcast config: {config_result.get('error')}"
            logger.error(f"{log_prefix}{error_msg}")
            return {
                'status': 'error',
                'message': error_msg
            }
        
        podcast_config = config_result.get('config')
        logger.info(f"{log_prefix}Successfully retrieved podcast config: {podcast_config.get('id')}")
        
        # Check if this is a content request or SQS message request
        if event.get('content_source') or event.get('urls') or event.get('text'):
            # Log the episode_id if present in the event
            episode_id = event.get('episode_id')
            if episode_id:
                logger.info(f"{log_prefix}Direct invocation with episode_id: {episode_id}")
            
            # Use podcast processor for direct content generation
            processor = PodcastProcessor(podcast_config, event, request_id)
            result = processor.process()
            
            # Log success or failure
            if result.get('status') == 'success':
                episode_id = event.get('episode_id') or podcast_config.get('episode_id')
                s3_path = result.get('s3_url') or result.get('s3_path')
                
                if episode_id:
                    logger.info(f"{log_prefix}Successfully processed episode {episode_id} with s3_path: {s3_path}")
            else:
                # Log error
                episode_id = event.get('episode_id') or podcast_config.get('episode_id')
                error_msg = result.get('message', 'Unknown error')
                if episode_id:
                    logger.error(f"{log_prefix}Error processing episode {episode_id}: {error_msg}")
            
            return result
        else:
            # Create SQS message for processing
            message = {
                'podcast_config_id': podcast_config_id,
                'episode_id': event.get('episode_id'),
                's3_path': event.get('s3_path'),
                'content_url': event.get('content_url')
            }
            
            # Process the message
            sqs_handler = SQSHandler(podcast_config, supabase_client)
            result = sqs_handler.process_message(message, request_id)
            
            # Log success or failure
            if result.get('status') == 'success':
                episode_id = event.get('episode_id') or podcast_config.get('episode_id')
                s3_path = result.get('s3_url') or result.get('s3_path')
                
                if episode_id:
                    logger.info(f"{log_prefix}Successfully processed episode {episode_id} with s3_path: {s3_path}")
            else:
                # Log error
                episode_id = event.get('episode_id') or podcast_config.get('episode_id')
                error_msg = result.get('message', 'Unknown error')
                if episode_id:
                    logger.error(f"{log_prefix}Error processing episode {episode_id}: {error_msg}")
            
            return result 