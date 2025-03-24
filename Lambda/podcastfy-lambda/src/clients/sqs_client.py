"""
Client for interacting with AWS SQS.
"""
import json
import logging
import boto3
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class SQSClient:
    """Client for interacting with AWS SQS."""
    
    def __init__(self, queue_url: Optional[str] = None):
        """
        Initialize the SQS client.
        
        Args:
            queue_url: Optional SQS queue URL, otherwise uses environment variable
        """
        self.sqs_client = boto3.client('sqs')
        self.queue_url = queue_url
    
    def send_message(self, message_body: Dict[str, Any], request_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Send a message to the SQS queue.
        
        Args:
            message_body: The message body to send
            request_id: Optional request ID for tracing
            
        Returns:
            A dictionary with the result of the send operation
        """
        log_prefix = f"[{request_id}] " if request_id else ""
        
        try:
            if not self.queue_url:
                return {
                    'success': False,
                    'error': 'No queue URL specified'
                }
            
            logger.info(f"{log_prefix}Sending message to SQS: {message_body}")
            
            # Convert message body to JSON string
            message_str = json.dumps(message_body)
            
            # Send message to SQS
            response = self.sqs_client.send_message(
                QueueUrl=self.queue_url,
                MessageBody=message_str
            )
            
            logger.info(f"{log_prefix}Successfully sent message to SQS, message ID: {response.get('MessageId')}")
            
            return {
                'success': True,
                'message_id': response.get('MessageId')
            }
            
        except Exception as e:
            logger.error(f"{log_prefix}Error sending message to SQS: {str(e)}")
            return {
                'success': False,
                'error': f"Error sending message: {str(e)}"
            } 