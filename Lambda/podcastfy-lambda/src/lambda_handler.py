"""
Lambda handler for the Podcast Generator Lambda function.
"""
import json
import traceback
from typing import Dict, Any

from src.config import ConfigManager
from src.handlers.podcast_handler import PodcastHandler
from src.utils.logging import get_logger, log_event, log_error
from src.utils.responses import create_error_response, create_success_response

logger = get_logger(__name__)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function handler.
    
    Args:
        event: Event data containing podcast configuration
        context: Lambda context
        
    Returns:
        Response with processing results
    """
    try:
        # Log the event
        log_event(logger, event)
        logger.info("Starting Podcast Generator Lambda function")
        
        # Initialize configuration manager
        config_manager = ConfigManager(event)
        
        # Get valid podcast configurations
        podcast_configs = config_manager.get_podcasts_configs()
        
        if not podcast_configs:
            logger.warning("No valid podcast configurations found")
            return create_error_response(400, "No valid podcast configurations found. Please check your request format.")
        
        # Initialize podcast handler
        handler = PodcastHandler(config_manager)
        
        # Process configurations based on count
        if len(podcast_configs) == 1:
            logger.info("Processing single podcast request")
            return handler.handle_single_podcast(podcast_configs[0])
        else:
            logger.info(f"Processing multiple podcast request with {len(podcast_configs)} configurations")
            return handler.handle_multiple_podcasts(podcast_configs)
        
    except json.JSONDecodeError as e:
        log_error(logger, f"JSON parsing error: {str(e)}")
        return create_error_response(400, f"Invalid JSON format: {str(e)}")
        
    except Exception as e:
        log_error(logger, f"Unhandled error in Lambda handler: {str(e)}")
        logger.error(traceback.format_exc())
        return create_error_response(500, f"Internal server error: {str(e)}") 