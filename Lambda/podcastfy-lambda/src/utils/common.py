"""
Common utility functions used across the Lambda function.
"""
import os
from datetime import datetime
from typing import Dict, Optional

from src.utils.logging import get_logger

logger = get_logger(__name__)

def ensure_directory_exists(directory_path: str) -> None:
    """
    Ensure that a directory exists, creating it if it doesn't.
    
    Args:
        directory_path: Path to the directory to ensure
    """
    if not os.path.exists(directory_path):
        os.makedirs(directory_path)
        logger.info(f"Created directory: {directory_path}")

def get_safe_filename(title: str, timestamp: Optional[str] = None) -> str:
    """
    Generate a safe filename from a title with optional timestamp.
    
    Args:
        title: Title to convert to a safe filename
        timestamp: Optional timestamp to append
        
    Returns:
        A safe filename
    """
    if timestamp is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
    # Handle non-ASCII characters in title
    safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_title = safe_title.encode('ascii', 'ignore').decode('ascii').replace(' ', '_')
    
    return f"{safe_title}_{timestamp}"

def setup_api_environment(config_manager) -> Dict[str, str]:
    """
    Setup environment for API keys.
    
    Args:
        config_manager: Configuration manager instance
        
    Returns:
        Dictionary of API keys or empty dict if setup failed
    """
    try:
        # Get API keys from Secrets Manager or environment variables
        api_keys = {}
        api_keys["GEMINI_API_KEY"] = config_manager.get_secret("GEMINI_API_KEY")
        api_keys["OPENAI_API_KEY"] = config_manager.get_secret("OPENAI_API_KEY")
        
        if not api_keys["GEMINI_API_KEY"] or not api_keys["OPENAI_API_KEY"]:
            logger.error("Missing required API keys. Please configure GEMINI_API_KEY and OPENAI_API_KEY.")
            return {}
        
        # Set API keys as environment variables for podcastfy
        os.environ["GEMINI_API_KEY"] = api_keys["GEMINI_API_KEY"]
        os.environ["OPENAI_API_KEY"] = api_keys["OPENAI_API_KEY"]
        
        return api_keys
    except Exception as e:
        logger.error(f"Error setting up API environment: {str(e)}")
        return {} 