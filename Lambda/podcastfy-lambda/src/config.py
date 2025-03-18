"""
Configuration management for the Podcast Generator Lambda.
"""
import os
import boto3
import json
from typing import Dict, Any, List, Optional, Tuple
from src.utils.logging import get_logger

logger = get_logger(__name__)

class ConfigManager:
    """
    Manages configuration for the podcast generator.
    """
    # JSON Schema for podcast configuration validation
    PODCAST_SCHEMA = {
        "type": "object",
        "properties": {
            "id": {"type": "string"},
            "type": {"type": "string", "enum": ["url", "text", "telegram"]},
            "urls": {"type": "array", "items": {"type": "string"}},
            "text": {"type": "string"},
            "telegram_data": {"type": "object"},
            "metadata": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"}
                }
            },
            "language": {"type": "string"},
            "longform": {"type": "boolean"},
            "conversation_style": {"type": "array", "items": {"type": "string"}},
            "techniques": {"type": "array", "items": {"type": "string"}},
            "host1": {"type": "string"},
            "host2": {"type": "string"},
            "creativity": {"type": ["number", "string"]},
            "instructions": {"type": "string"},
            "max_chunks": {"type": ["integer", "string"]},
            "min_chunk_size": {"type": ["integer", "string"]}
        }
    }

    def __init__(self, event: Dict[str, Any]):
        """
        Initialize the config manager with the Lambda event.
        
        Args:
            event: The Lambda event containing configuration
        """
        self.event = event
        self.storage_dir = os.environ.get("STORAGE_DIR", "/tmp/podcasts")
        
        # Default conversation styles and engagement techniques
        self.conversation_styles = [
            'Engaging', 'Fast-paced', 'Enthusiastic', 'Educational',
            'Casual', 'Professional', 'Friendly', 'Formal'
        ]
        self.engagement_techniques = [
            'Debate', 'Storytelling', 'Q&A format', 'Humor',
            'Deep-dive analysis', 'Interviews', 'Pop culture references',
            'Expert explanations', 'Devil\'s advocate', 'Case studies'
        ]
    
    def validate_config(self, config: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate a podcast configuration against the schema.
        
        Args:
            config: Podcast configuration to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Basic type check
            if not isinstance(config, dict):
                return False, "Configuration must be a dictionary"
                
            # Check required fields based on podcast type
            podcast_type = config.get("type", "url")
            
            if podcast_type == "url" and not config.get("urls"):
                return False, "URL podcast type requires 'urls' field"
                
            if podcast_type == "text" and not config.get("text"):
                return False, "Text podcast type requires 'text' field"
                
            if podcast_type == "telegram" and not config.get("telegram_data"):
                return False, "Telegram podcast type requires 'telegram_data' field"
                
            # Additional checks can be implemented based on requirements
                
            return True, ""
        except Exception as e:
            logger.error(f"Error validating config: {str(e)}")
            return False, f"Validation error: {str(e)}"
    
    def get_podcasts_configs(self) -> List[Dict[str, Any]]:
        """
        Get all podcast configurations from the event.
        
        Returns:
            List of podcast configurations
        """
        configs = []
        
        # Extract configurations from the event
        if 'podcasts' in self.event:
            configs = self.event['podcasts']
        elif 'body' in self.event:
            try:
                body = (
                    json.loads(self.event['body']) 
                    if isinstance(self.event['body'], str) 
                    else self.event['body']
                )
                if 'podcasts' in body:
                    configs = body['podcasts']
                else:
                    # Treat body as a single podcast config
                    configs = [body]
            except Exception as e:
                logger.error(f"Error parsing event body: {str(e)}")
        else:
            # If no configurations found, try to build a single config
            try:
                configs = [self._build_single_podcast_config()]
            except Exception as e:
                logger.error(f"Error building single podcast config: {str(e)}")
        
        # Validate configurations and filter out invalid ones
        valid_configs = []
        for config in configs:
            is_valid, error = self.validate_config(config)
            if is_valid:
                valid_configs.append(config)
            else:
                logger.warning(f"Invalid podcast configuration: {error}")
        
        return valid_configs
    
    def _build_single_podcast_config(self) -> Dict[str, Any]:
        """
        Build a single podcast configuration from the event.
        
        Returns:
            A podcast configuration
        """
        # First check if we have a body with the config
        if 'body' in self.event:
            try:
                body = (
                    json.loads(self.event['body']) 
                    if isinstance(self.event['body'], str) 
                    else self.event['body']
                )
                return body
            except Exception as e:
                logger.error(f"Error parsing event body: {str(e)}")
        
        # If no body, use the event itself
        return self.event
    
    def get_secret(self, secret_name: str) -> Optional[str]:
        """
        Retrieve a secret from AWS Secrets Manager or environment variables.
        
        Args:
            secret_name: Name of the secret to retrieve
            
        Returns:
            Secret value or None if not found
        """
        # First try to get from environment variables
        secret_value = os.environ.get(secret_name)
        if secret_value:
            logger.info(f"Retrieved {secret_name} from environment variables")
            return secret_value
        
        # If not found in environment variables, try AWS Secrets Manager
        try:
            logger.info(f"Attempting to retrieve {secret_name} from AWS Secrets Manager")
            session = boto3.session.Session()
            client = session.client(service_name='secretsmanager')
            response = client.get_secret_value(SecretId="PodcastGeneratorSecrets")
            if 'SecretString' in response:
                secrets = json.loads(response['SecretString'])
                if secret_name in secrets:
                    return secrets[secret_name]
        except Exception as e:
            logger.error(f"Error retrieving secret {secret_name}: {str(e)}")
            return None 