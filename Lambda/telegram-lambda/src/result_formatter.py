"""
Result formatting module for the Telegram collector Lambda function.
"""
import json
from typing import Dict, Any, List

from src.utils.logging import get_logger

logger = get_logger(__name__)


class ResultFormatter:
    """
    Formats results for the Lambda function response.
    
    This class is responsible for formatting the results of the channel processing
    into a standardized response format.
    """
    
    def __init__(self, results: Dict[str, Any]):
        """
        Initialize the ResultFormatter.
        
        Args:
            results: The results to format
        """
        self.results = results
    
    def create_response(self) -> Dict[str, Any]:
        """
        Create a standardized response.
        
        Returns:
            A dictionary with the formatted response
        """
        try:
            # Format the response
            response = {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Processing completed',
                    'results': self.results
                }, default=str)
            }
            
            logger.info("Created response successfully")
            return response
        except Exception as e:
            logger.error(f"Error creating response: {str(e)}")
            return self._create_error_response(500, f"Error creating response: {str(e)}")
    
    def _create_error_response(self, status_code: int, message: str) -> Dict[str, Any]:
        """
        Create an error response.
        
        Args:
            status_code: The HTTP status code
            message: The error message
            
        Returns:
            A dictionary with the error response
        """
        return {
            'statusCode': status_code,
            'body': json.dumps({
                'message': message
            })
        }
    
    @staticmethod
    def calculate_statistics(results: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Calculate statistics from the results.
        
        Args:
            results: The results to calculate statistics from
            
        Returns:
            A dictionary with the statistics
        """
        statistics = {
            'total_messages': 0,
            'messages_per_channel': {},
            'media_stats': {},
            'url_stats': {}
        }
        
        for channel, messages in results.items():
            # Count messages
            message_count = len(messages)
            statistics['total_messages'] += message_count
            statistics['messages_per_channel'][channel] = message_count
            
            # Count media
            media_stats = {
                'תמונה': 0,
                'סרטון': 0,
                'הקלטה': 0,
                'קובץ': 0,
                'הורדה נכשלה': 0
            }
            
            for msg in messages:
                media_info = msg.get('media_info', '')
                if media_info:
                    if 'תמונה' in media_info:
                        media_stats['תמונה'] += 1
                    elif 'סרטון' in media_info:
                        media_stats['סרטון'] += 1
                    elif 'הקלטה' in media_info:
                        media_stats['הקלטה'] += 1
                    elif 'קובץ' in media_info:
                        media_stats['קובץ'] += 1
                    
                    if 'הורדה נכשלה' in media_info:
                        media_stats['הורדה נכשלה'] += 1
            
            statistics['media_stats'][channel] = media_stats
            
            # Count URLs
            url_count = sum(len(msg.get('urls', [])) for msg in messages)
            statistics['url_stats'][channel] = url_count
        
        return statistics 