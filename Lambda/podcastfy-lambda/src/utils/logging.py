"""
Logging utilities for the Podcast Generator Lambda.
"""
import logging
import json
import traceback
from typing import Dict, Any, Optional

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with proper configuration.
    
    Args:
        name: Name of the logger
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Only add handler if it doesn't already have one
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger

def log_event(logger: logging.Logger, event: Dict[str, Any]) -> None:
    """
    Log an event, sanitizing sensitive information.
    
    Args:
        logger: Logger instance
        event: Event to log
    """
    # Create a copy of the event to sanitize
    sanitized_event = {}
    
    # Check if event is a dictionary
    if isinstance(event, dict):
        for key, value in event.items():
            # Skip sensitive fields or truncate large values
            if key.lower() in ['api_key', 'secret', 'password', 'token']:
                sanitized_event[key] = '***REDACTED***'
            elif isinstance(value, str) and len(value) > 1000:
                sanitized_event[key] = f"{value[:1000]}... (truncated)"
            else:
                sanitized_event[key] = value
    else:
        sanitized_event = {'event': str(event)[:1000]}
    
    logger.info(f"Event received: {json.dumps(sanitized_event, default=str)}")

def log_error(logger: logging.Logger, error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Log an error with context and traceback.
    
    Args:
        logger: Logger instance
        error: Exception to log
        context: Additional context information
    """
    if context is None:
        context = {}
    
    error_details = {
        'error_type': error.__class__.__name__,
        'error_message': str(error),
        'traceback': traceback.format_exc(),
        'context': context
    }
    
    logger.error(f"Error details: {json.dumps(error_details, default=str)}") 