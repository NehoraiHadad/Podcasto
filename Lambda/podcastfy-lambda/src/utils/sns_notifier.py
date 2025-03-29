"""
SNS notification utilities for podcastfy Lambda function.
"""
import json
import datetime
import boto3
from typing import Dict, Any, Optional

from src.utils.logging import get_logger

logger = get_logger(__name__)

class SNSNotifier:
    """
    SNS notification service for podcast completion events.
    """
    
    def __init__(self, region: Optional[str] = None):
        """
        Initialize the SNS client.
        
        Args:
            region: AWS region, if not specified uses default region
        """
        self.sns_client = boto3.client('sns', region_name=region)
        self.topic_arn = None
    
    def set_topic_arn(self, topic_arn: str):
        """
        Set the SNS topic ARN.
        
        Args:
            topic_arn: ARN of the SNS topic to publish to
        """
        self.topic_arn = topic_arn
    
    def notify_completion(
        self, 
        podcast_config_id: str, 
        episode_id: str, 
        status: str = "success", 
        additional_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send podcast creation completion notification.
        
        Args:
            podcast_config_id: The ID of the podcast configuration
            episode_id: The ID of the episode created
            status: Status of the creation (success/error)
            additional_data: Any additional data to include in the notification
            
        Returns:
            True if notification was sent successfully, False otherwise
        """
        if not self.topic_arn:
            logger.warning("SNS topic ARN not set, skipping notification")
            return False
        
        try:
            # Build the message
            message = {
                "podcast_config_id": podcast_config_id,
                "episode_id": episode_id,
                "status": status,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            if additional_data:
                message.update(additional_data)
                
            # Convert message to JSON
            message_json = json.dumps(message)
            
            # Create a subject line appropriate for the status
            subject = f"Podcast Creation {status.upper()}: {episode_id}"
            
            # Publish to SNS
            response = self.sns_client.publish(
                TopicArn=self.topic_arn,
                Message=message_json,
                Subject=subject
            )
            
            logger.info(f"Successfully sent completion notification for episode {episode_id}")
            logger.debug(f"SNS response: {response}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send SNS notification: {str(e)}")
            return False 