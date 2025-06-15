"""
Logging utilities for the Lambda function.
"""
import logging
import json
import sys
import os
from typing import Any, Dict, Optional

# Set up logging
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO').upper()
FORMATTER = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Map string log levels to logging constants
LOG_LEVEL_MAP = {
    'DEBUG': logging.DEBUG,
    'INFO': logging.INFO,
    'WARNING': logging.WARNING,
    'ERROR': logging.ERROR,
    'CRITICAL': logging.CRITICAL
}

def get_logger(name: str) -> logging.Logger:
    """
    Get a configured logger instance.
    
    Args:
        name: Name for the logger
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Set the log level
    level = LOG_LEVEL_MAP.get(LOG_LEVEL, logging.INFO)
    logger.setLevel(level)
    
    # Only add handler if not already added to avoid duplicate logs
    if not logger.handlers:
        # Create console handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(FORMATTER)
        logger.addHandler(handler)
    
    return logger


def log_error(logger: logging.Logger, error: Exception, context: Optional[Dict[str, Any]] = None) -> None:
    """
    Log an error with context information.
    
    Args:
        logger: Logger instance
        error: Exception to log
        context: Additional context dictionary
    """
    context = context or {}
    
    error_info = {
        'error_type': type(error).__name__,
        'error_message': str(error),
        **context
    }
    
    logger.error(f"Error occurred: {json.dumps(error_info)}") 