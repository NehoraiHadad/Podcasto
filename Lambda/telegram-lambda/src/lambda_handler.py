"""
Lambda handler for the Telegram collector Lambda function.
"""
import json
import asyncio
from typing import Dict, Any

from src.config import ConfigManager
from src.channel_processor import ChannelProcessor
from src.result_formatter import ResultFormatter
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