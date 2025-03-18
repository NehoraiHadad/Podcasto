"""
Response utility functions for API responses.
"""
import json
from typing import Dict, Any

from src.utils.logging import get_logger

logger = get_logger(__name__)

def create_error_response(status_code: int, message: str) -> Dict[str, Any]:
    """
    Create an error response for API Gateway.
    
    Args:
        status_code: The HTTP status code
        message: The error message
        
    Returns:
        A dictionary with the error response
    """
    logger.error(f"Error response: {status_code} - {message}")
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': message
        })
    }

def create_success_response(body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a success response for API Gateway.
    
    Args:
        body: The response body
        
    Returns:
        A dictionary with the success response
    """
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body)
    } 