"""
Configuration management for the Telegram collector Lambda function.
"""
import os
from typing import List, Dict, Any
from dataclasses import dataclass, field

from src.utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class PodcastConfig:
    """Podcast configuration data class."""
    id: str
    telegram_channel: str
    telegram_hours: int = 24
    filtered_domains: List[str] = field(default_factory=list)
    media_types: List[str] = field(default_factory=lambda: ["image"])  # Default to only images
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PodcastConfig':
        """Create a PodcastConfig from a dictionary."""
        return cls(
            id=data.get('id', ''),
            telegram_channel=data.get('telegram_channel', ''),
            telegram_hours=data.get('telegram_hours', 24),
            filtered_domains=data.get('filtered_domains', []),
            media_types=data.get('media_types', ["image"])  # Default to only images
        )
    
    @property
    def days_back(self) -> int:
        """Calculate days back from hours."""
        days = self.telegram_hours // 24
        return max(1, days)  # Ensure at least 1 day


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
            config = PodcastConfig.from_dict(config_data)
            
            # Validate the config
            if not config.telegram_channel:
                logger.warning(f"No Telegram channel specified for podcast config {config.id}")
                return []
            
            logger.info(f"Using provided podcast config with ID: {config.id}")
            return [config]
        
        # No valid configurations found
        logger.warning("No valid podcast configurations found in event")
        return [] 