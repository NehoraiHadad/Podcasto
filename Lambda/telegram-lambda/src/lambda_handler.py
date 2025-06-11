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
        
        # Initialize SQS client
        sqs_client = SQSClient()
        
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
                    # Extract timestamp from the S3 path
                    s3_path = result.get('s3_path', '')
                    timestamp = result.get('timestamp', '')
                    episode_id = result.get('episode_id', timestamp)
                    podcast_id = result.get('podcast_id', config.id)
                    
                    # 1. Try immediate API call to generate podcast
                    api_success = False
                    try:
                        import urllib3
                        import json as json_lib
                        
                        http = urllib3.PoolManager()
                        api_endpoint = os.getenv('API_ENDPOINT')
                        
                        if api_endpoint:
                            response = http.request(
                                'POST',
                                f"{api_endpoint}/api/episodes/generate-audio",
                                body=json_lib.dumps({
                                    'episodeId': episode_id,
                                    'podcastId': podcast_id,
                                    's3Path': s3_path,
                                    'timestamp': timestamp
                                }),
                                headers={
                                    'Content-Type': 'application/json',
                                    'Authorization': f"Bearer {os.getenv('INTERNAL_API_KEY', '')}"
                                },
                                timeout=5.0  # Quick timeout for immediate processing
                            )
                            
                            if response.status == 200:
                                api_success = True
                                logger.info(f"Successfully triggered immediate podcast generation for {episode_id}")
                            else:
                                logger.warning(f"API call failed with status {response.status}, will fallback to SQS")
                        else:
                            logger.warning("API_ENDPOINT not configured, using SQS only")
                            
                    except Exception as e:
                        logger.warning(f"Immediate API call failed: {str(e)}, will fallback to SQS")
                    
                    # 2. Always send to SQS as backup (even if API succeeded)
                    sqs_sent = sqs_client.send_message(
                        podcast_config_id=config.id,
                        result_data=result,
                        timestamp=timestamp
                    )
                    
                    # Add status to result
                    result['immediate_processing'] = api_success
                    result['sqs_message_sent'] = sqs_sent
                    logger.info(f"Podcast {episode_id}: Immediate={'Success' if api_success else 'Failed'}, SQS={'Sent' if sqs_sent else 'Failed'}")
                
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