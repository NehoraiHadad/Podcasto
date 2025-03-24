"""
Utilities for creating consistent Lambda function responses.
"""
from typing import Dict, Any


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a standardized Lambda function response.
    
    Args:
        status_code: HTTP status code
        body: Response body content
        
    Returns:
        A dictionary with the formatted response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': body
    } 