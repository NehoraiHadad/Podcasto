"""
Configuration module for the Telegram collector Lambda function.
This module provides classes for managing Lambda configuration.
"""
import os
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

from src.utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class PodcastConfig:
    """
    Podcast configuration data structure.
    """
    id: str  # This is the podcast_config_id
    telegram_channel: str
    media_types: List[str] = field(default_factory=list)
    filtered_domains: List[str] = field(default_factory=list)
    days_back: int = 1
    episode_id: Optional[str] = None
    podcast_id: Optional[str] = None  # Actual podcast ID, separate from config ID
    start_date: Optional[str] = None  # ISO format datetime string
    end_date: Optional[str] = None    # ISO format datetime string
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PodcastConfig':
        """
        Create a PodcastConfig instance from a dictionary.
        
        Args:
            data: Dictionary with configuration data
            
        Returns:
            A PodcastConfig instance
        """
        # Extract required fields
        podcast_config_id = data.get('id')
        telegram_channel = data.get('telegram_channel')
        
        # Extract optional fields with defaults
        media_types = data.get('media_types', [])
        filtered_domains = data.get('filtered_domains', [])
        days_back = data.get('telegram_hours', 24) // 24 or 1  # Convert hours to days, default to 1
        
        # Extract episode_id if available
        episode_id = data.get('episode_id')

        # Extract podcast_id if available (separate from config_id)
        podcast_id = data.get('podcast_id')

        # Extract date_range if available (takes precedence over telegram_hours)
        start_date = None
        end_date = None
        if 'date_range' in data and data['date_range']:
            start_date = data['date_range'].get('start_date')
            end_date = data['date_range'].get('end_date')
            logger.info(f"Using custom date range: {start_date} to {end_date}")

        # Create and return the config object
        return cls(
            id=podcast_config_id,
            telegram_channel=telegram_channel,
            media_types=media_types,
            filtered_domains=filtered_domains,
            days_back=days_back,
            episode_id=episode_id,
            podcast_id=podcast_id,
            start_date=start_date,
            end_date=end_date
        )


class ConfigManager:
    """
    Manages configuration for the Lambda function.
    
    This class is responsible for loading and validating configuration
    from environment variables and the Lambda event.
    """
    
    def __init__(self, event: Dict[str, Any]):
        """
        Initialize the ConfigManager.
        
        Args:
            event: The Lambda event
        """
        self.event = event
        self.is_local = os.environ.get('AWS_SAM_LOCAL') == 'true'
        
        # Load environment variables
        self.telegram_api_id = os.getenv('TELEGRAM_API_ID')
        self.telegram_api_hash = os.getenv('TELEGRAM_API_HASH')
        self.telegram_session = os.getenv('TELEGRAM_SESSION', '')
        self.s3_bucket_name = os.getenv('S3_BUCKET_NAME', 'telegram-data-collector')
        
        # Validate required environment variables
        self._validate_env_vars()
        
        logger.info(f"Initialized ConfigManager with IS_LOCAL={self.is_local}")
    
    def _validate_env_vars(self):
        """Validate required environment variables."""
        if not self.telegram_api_id:
            raise ValueError("TELEGRAM_API_ID environment variable must be set")
        if not self.telegram_api_hash:
            raise ValueError("TELEGRAM_API_HASH environment variable must be set")
        if not self.telegram_session:
            raise ValueError("TELEGRAM_SESSION environment variable must be set")
    
    def get_podcast_configs(self) -> List[PodcastConfig]:
        """
        Get podcast configurations from the event.
        
        Returns:
            List of podcast configurations
        """
        # Check if a complete podcast config is provided directly
        if 'podcast_config' in self.event:
            config_data = self.event['podcast_config']
            
            # If episode_id is in the event but not in the podcast_config, add it
            if 'episode_id' in self.event and 'episode_id' not in config_data:
                config_data['episode_id'] = self.event['episode_id']

            # If podcast_id is in the event but not in the podcast_config, add it
            if 'podcast_id' in self.event and 'podcast_id' not in config_data:
                config_data['podcast_id'] = self.event['podcast_id']

            # If date_range is in the event, add it to config_data
            if 'date_range' in self.event and self.event['date_range']:
                config_data['date_range'] = self.event['date_range']
                logger.info(f"Adding date_range from event: {self.event['date_range']}")

            config = PodcastConfig.from_dict(config_data)
            
            # Validate the config
            if not config.telegram_channel:
                logger.warning(f"No Telegram channel specified for podcast config {config.id}")
                return []
            
            logger.info(f"Using provided podcast config with ID: {config.id}")
            if config.episode_id:
                logger.info(f"Using episode ID: {config.episode_id}")
            if config.podcast_id:
                logger.info(f"Using podcast ID: {config.podcast_id}")
            return [config]
        
        # No valid configurations found
        logger.warning("No valid podcast configurations found in event")
        return [] 