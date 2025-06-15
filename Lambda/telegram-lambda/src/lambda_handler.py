"""
Lambda handler for the Telegram collector Lambda function.
"""
import json
import os
import asyncio
from typing import Dict, Any

from src.config import ConfigManager
from src.channel_processor import ChannelProcessor
from src.result_formatter import ResultFormatter
from src.clients.sqs_client import SQSClient
from src.clients.supabase_client import SupabaseClient
from src.utils.logging import get_logger, log_event, log_error

logger = get_logger(__name__)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function handler.
    
    Args:
        event: Event data which must contain podcast configuration
        context: Lambda context
        
    Returns:
        Response with processing results
    """
    try:
        log_event(logger, event)
        logger.info("Starting Telegram collector Lambda function")
        
        # Initialize clients
        sqs_client = SQSClient()
        supabase_client = SupabaseClient()
        
        # Parse configuration from event
        config_manager = ConfigManager(event)
        podcast_configs = config_manager.get_podcast_configs()
        
        if not podcast_configs:
            logger.warning("No valid podcast configurations found")
            return _create_error_response(400, "No valid podcast configurations found")
        
        # Process each podcast configuration
        all_results = {}
        for config in podcast_configs:
            try:
                logger.info(f"Processing podcast config: {config.id}")
                
                # Create channel processor
                processor = ChannelProcessor(config)
                
                # Process channels
                loop = asyncio.get_event_loop()
                result = loop.run_until_complete(processor.process())
                
                # Store results
                all_results[config.id] = result
                
                # Check if processing was successful
                if result.get('status') == 'success':
                    # Extract information from the result
                    s3_path = result.get('s3_path', '')
                    timestamp = result.get('timestamp', '')
                    episode_id = result.get('episode_id', timestamp)
                    podcast_id = result.get('podcast_id', config.id)
                    
                    # Update episode status to content_collected after successful S3 upload
                    if episode_id and s3_path:
                        logger.info(f"Updating episode {episode_id} status after successful S3 upload to {s3_path}")
                        try:
                            status_updated = supabase_client.update_episode_status(episode_id, 'content_collected', podcast_id)
                            if status_updated:
                                logger.info(f"Episode {episode_id} status successfully updated to content_collected")
                            else:
                                logger.error(f"Failed to update episode {episode_id} status to content_collected - check Supabase logs for details")
                                logger.warning(f"Continuing with SQS message despite status update failure")
                        except Exception as status_update_error:
                            logger.error(f"Exception while updating episode {episode_id} status: {str(status_update_error)}")
                            logger.error(f"Exception type: {type(status_update_error).__name__}")
                            logger.warning(f"Continuing with SQS message despite status update failure")
                    else:
                        logger.warning(f"Missing episode_id ({episode_id}) or s3_path ({s3_path}) - skipping status update")
                    
                    # Send to SQS for asynchronous processing by audio generation lambda
                    # This ensures the content is fully uploaded to S3 before audio generation begins
                    sqs_sent = sqs_client.send_message(
                        podcast_config_id=config.id,
                        result_data=result,
                        timestamp=timestamp
                    )
                    
                    # Log the result
                    result['sqs_message_sent'] = sqs_sent
                    logger.info(f"Podcast {episode_id}: Content uploaded to S3, status updated, SQS message {'sent' if sqs_sent else 'failed'}")
                
            except Exception as e:
                logger.error(f"Error processing podcast config {config.id}: {str(e)}")
                log_error(logger, e, {'podcast_config_id': config.id})
                all_results[config.id] = {
                    'message': f'Error: {str(e)}',
                    'podcast_config_id': config.id
                }
        
        # Format and return results
        formatter = ResultFormatter(all_results)
        response = formatter.create_response()
        
        logger.info("Telegram collector Lambda function completed successfully")
        return response
        
    except Exception as e:
        logger.exception(f"Error in lambda_handler: {str(e)}")
        log_error(logger, e)
        return _create_error_response(500, f"Error: {str(e)}")


def _create_error_response(status_code: int, message: str) -> Dict[str, Any]:
    """
    Create an error response.
    
    Args:
        status_code: The HTTP status code
        message: The error message
        
    Returns:
        A dictionary with the error response
    """
    logger.error(f"Error response: {status_code} - {message}")
    return {
        'statusCode': status_code,
        'body': json.dumps({
            'message': message
        })
    } 