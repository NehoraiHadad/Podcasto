"""
SQS client for the Telegram collector Lambda function.
This module provides functions to interact with AWS SQS.
"""
import os
import json
import boto3
from typing import Dict, Any, Optional

from src.utils.logging import get_logger

logger = get_logger(__name__)


class SQSClient:
    """
    A simple SQS client for the Lambda function.
    """
    
    def __init__(self):
        """Initialize the SQS client."""
        self.queue_url = os.getenv('SQS_QUEUE_URL')
        self.is_local = os.environ.get('AWS_SAM_LOCAL') == 'true'
        
        if not self.queue_url:
            logger.warning("SQS_QUEUE_URL environment variable not set")
            
        if not self.is_local:
            session = boto3.Session()
            self.sqs_client = session.client('sqs')
        else:
            self.sqs_client = None
            logger.info("Running in local environment, SQS operations will be simulated")
    
    def send_message(self, podcast_config_id: str, result_data: Dict[str, Any], timestamp: str) -> bool:
        """
        Send a message to the SQS queue.
        
        Args:
            podcast_config_id: The ID of the podcast configuration
            result_data: The result data from the channel processor
            timestamp: The timestamp for consistent folder structure
        
        Returns:
            True if the message was sent successfully, False otherwise
        """
        if not self.queue_url:
            logger.error("Cannot send SQS message: SQS_QUEUE_URL environment variable not set")
            return False
            
        # Extract the episode_id from result_data if available
        episode_id = result_data.get('episode_id', timestamp)
        s3_path = result_data.get('s3_path', '')
        
        # Extract the podcast_id from result_data if available (separate from config_id)
        podcast_id = result_data.get('podcast_id', podcast_config_id)
            
        # Create message with necessary data for podcast generation
        message = {
            'podcast_config_id': podcast_config_id,
            'podcast_id': podcast_id,  # Add actual podcast_id to the message
            'timestamp': timestamp,
            'episode_id': episode_id,
            's3_path': s3_path,
            'content_url': s3_path  # Use the full S3 path for content URL
        }
        
        message_body = json.dumps(message)
        
        if self.is_local or not self.sqs_client:
            logger.info(f"Simulating sending message to SQS: {message_body}")
            return True
            
        try:
            response = self.sqs_client.send_message(
                QueueUrl=self.queue_url,
                MessageBody=message_body
            )
            
            logger.info(f"Message sent to SQS: {response['MessageId']}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending message to SQS: {str(e)}")
            return False 