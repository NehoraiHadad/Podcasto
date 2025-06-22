"""
Telegram Data Client for accessing Telegram content from S3
"""
import json
import os
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError

from utils.logging import get_logger

logger = get_logger(__name__)

class TelegramDataClient:
    """Client for retrieving Telegram data from S3"""
    
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = os.environ.get('S3_BUCKET_NAME', 'podcasto-podcasts')
        
    def get_telegram_data(
        self,
        podcast_id: str,
        episode_id: str,
        custom_path: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve Telegram data from S3
        
        Args:
            podcast_id: The podcast ID
            episode_id: The episode ID
            custom_path: Custom S3 path if provided (can be full s3:// URL or just key)
            
        Returns:
            Telegram data or None if not found
        """
        # Construct S3 key
        if custom_path:
            s3_key = self._parse_s3_path(custom_path)
        else:
            s3_key = self._construct_s3_key(podcast_id, episode_id)
        
        try:
            logger.info(f"[TELEGRAM_DATA] Fetching data from S3: s3://{self.bucket_name}/{s3_key}")
            
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            # Read and parse JSON content
            content = response['Body'].read().decode('utf-8')
            telegram_data = json.loads(content)
            
            # Validate and log data structure
            if self.validate_telegram_data(telegram_data):
                message_count = self._count_messages(telegram_data)
                logger.info(f"[TELEGRAM_DATA] Successfully retrieved data for episode {episode_id}")
                logger.info(f"[TELEGRAM_DATA] Data structure: {self._describe_structure(telegram_data)}")
                logger.info(f"[TELEGRAM_DATA] Total messages: {message_count}")
            else:
                logger.warning(f"[TELEGRAM_DATA] Retrieved data for episode {episode_id} but structure validation failed")
                logger.warning(f"[TELEGRAM_DATA] Data keys: {list(telegram_data.keys()) if isinstance(telegram_data, dict) else type(telegram_data)}")
            
            return telegram_data
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            
            if error_code == 'NoSuchKey':
                logger.warning(f"[TELEGRAM_DATA] No data found at s3://{self.bucket_name}/{s3_key}")
                
                # Try alternative paths if custom path wasn't provided
                if not custom_path:
                    return self._try_alternative_paths(podcast_id, episode_id)
                    
            else:
                logger.error(f"[TELEGRAM_DATA] S3 error: {e}")
                
            return None
            
        except json.JSONDecodeError as e:
            logger.error(f"[TELEGRAM_DATA] Invalid JSON in S3 object: {e}")
            return None
            
        except Exception as e:
            logger.error(f"[TELEGRAM_DATA] Unexpected error: {e}")
            return None
    
    def _parse_s3_path(self, path: str) -> str:
        """
        Parse S3 path and extract the key part
        
        Args:
            path: Either full S3 URL (s3://bucket/key) or just the key
            
        Returns:
            The S3 key (path without s3://bucket/ prefix)
        """
        if path.startswith('s3://'):
            # Remove s3:// prefix and bucket name
            # Format: s3://bucket-name/key/path
            parts = path[5:].split('/', 1)  # Remove s3:// and split on first /
            if len(parts) > 1:
                return parts[1]  # Return everything after bucket name
            else:
                logger.warning(f"[TELEGRAM_DATA] Invalid S3 URL format: {path}")
                return path
        else:
            # Already a key, return as-is
            return path
    
    def _construct_s3_key(self, podcast_id: str, episode_id: str) -> str:
        """Construct the primary S3 key for Telegram data"""
        return f"podcasts/{podcast_id}/{episode_id}/content.json"
    
    def _try_alternative_paths(
        self,
        podcast_id: str,
        episode_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Try alternative S3 paths for backward compatibility
        """
        alternative_paths = [
            f"podcasts/{podcast_id}/{episode_id}/telegram_data.json",
            f"podcasts/{podcast_id}/telegram_data.json",
            f"telegram/{podcast_id}/{episode_id}.json",
            f"data/podcasts/{podcast_id}/{episode_id}/telegram.json",
            f"telegram_data/{podcast_id}_{episode_id}.json"
        ]
        
        for path in alternative_paths:
            try:
                logger.info(f"[TELEGRAM_DATA] Trying alternative path: {path}")
                
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=path
                )
                
                content = response['Body'].read().decode('utf-8')
                telegram_data = json.loads(content)
                
                logger.info(f"[TELEGRAM_DATA] Found data at alternative path: {path}")
                return telegram_data
                
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchKey':
                    logger.warning(f"[TELEGRAM_DATA] Error accessing {path}: {e}")
                    
            except Exception as e:
                logger.warning(f"[TELEGRAM_DATA] Error processing {path}: {e}")
        
        logger.warning(f"[TELEGRAM_DATA] No Telegram data found for episode {episode_id}")
        return None
    
    def validate_telegram_data(self, data: Any) -> bool:
        """
        Validate that Telegram data has the expected structure
        
        Args:
            data: The Telegram data to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not isinstance(data, dict):
            logger.warning("[TELEGRAM_DATA] Data is not a dictionary")
            return False
        
        # Check for different valid structures
        has_results = 'results' in data
        has_messages = 'messages' in data
        
        if not has_results and not has_messages:
            # Look for any array that might contain messages
            for key, value in data.items():
                if isinstance(value, list) and value and isinstance(value[0], dict):
                    if any(field in value[0] for field in ['text', 'message', 'content']):
                        logger.info(f"[TELEGRAM_DATA] Found messages in '{key}' field")
                        return True
            logger.warning("[TELEGRAM_DATA] No valid message structure found")
            return False
            
        # Validate results structure (channel-based)
        if has_results:
            results = data['results']
            if not isinstance(results, dict):
                logger.warning("[TELEGRAM_DATA] 'results' is not a dictionary")
                return False
                
            # Check that at least one channel has messages
            total_messages = 0
            for channel, messages in results.items():
                if isinstance(messages, list):
                    total_messages += len(messages)
                    
            if total_messages == 0:
                logger.warning("[TELEGRAM_DATA] No messages found in any channel")
                return False
            
            logger.info(f"[TELEGRAM_DATA] Validated results structure: {len(results)} channels, {total_messages} total messages")
            return True
                    
        # Validate direct messages structure
        if has_messages:
            messages = data['messages']
            if isinstance(messages, list) and len(messages) > 0:
                logger.info(f"[TELEGRAM_DATA] Validated direct messages structure: {len(messages)} messages")
                return True
            else:
                logger.warning("[TELEGRAM_DATA] 'messages' field is empty or not a list")
                return False
                
        return False
    
    def _count_messages(self, data: Dict[str, Any]) -> int:
        """Count total messages in telegram data"""
        total = 0
        
        if 'results' in data:
            for channel, messages in data['results'].items():
                if isinstance(messages, list):
                    total += len(messages)
        elif 'messages' in data:
            if isinstance(data['messages'], list):
                total = len(data['messages'])
        else:
            # Count messages in any array field
            for key, value in data.items():
                if isinstance(value, list):
                    total += len(value)
                    
        return total
    
    def _describe_structure(self, data: Dict[str, Any]) -> str:
        """Describe the structure of telegram data"""
        if 'results' in data:
            channels = list(data['results'].keys())
            return f"channel-based ({len(channels)} channels: {channels})"
        elif 'messages' in data:
            return "direct messages array"
        else:
            return f"custom structure with keys: {list(data.keys())}" 