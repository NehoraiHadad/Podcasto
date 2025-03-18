"""
Logging utilities for the Telegram collector Lambda function.
"""
import logging
import json
import os
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s - %(message)s'
)

# Sensitive keys that should be masked in logs
SENSITIVE_KEYS = [
    'api_id',
    'api_hash',
    'session',
    'token',
    'key',
    'password',
    'secret',
    'telegram_api_id',
    'telegram_api_hash',
    'telegram_session'
]


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name.
    
    Args:
        name: The name of the logger
        
    Returns:
        A configured logger
    """
    logger = logging.getLogger(name)
    
    # Set log level based on environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    return logger


def mask_sensitive_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mask sensitive data in a dictionary.
    
    Args:
        data: The dictionary to mask
        
    Returns:
        A dictionary with sensitive data masked
    """
    if not isinstance(data, dict):
        return data
    
    masked_data = {}
    for key, value in data.items():
        if isinstance(value, dict):
            masked_data[key] = mask_sensitive_data(value)
        elif isinstance(key, str) and any(sensitive_key in key.lower() for sensitive_key in SENSITIVE_KEYS):
            masked_data[key] = '***MASKED***'
        else:
            masked_data[key] = value
    
    return masked_data


def log_event(logger: logging.Logger, event: Dict[str, Any], level: str = 'info') -> None:
    """
    Log an event with sensitive data masked.
    
    Args:
        logger: The logger to use
        event: The event to log
        level: The log level to use
    """
    masked_event = mask_sensitive_data(event)
    log_message = json.dumps(masked_event, indent=2)
    
    log_method = getattr(logger, level.lower(), logger.info)
    log_method(f"Event: {log_message}")


def log_error(logger: logging.Logger, error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Log an error with context.
    
    Args:
        logger: The logger to use
        error: The error to log
        context: Additional context for the error
    """
    error_message = str(error)
    error_type = type(error).__name__
    
    log_data = {
        'error_type': error_type,
        'error_message': error_message
    }
    
    if context:
        masked_context = mask_sensitive_data(context)
        log_data['context'] = masked_context
    
    logger.error(f"Error: {json.dumps(log_data, indent=2)}", exc_info=True) 