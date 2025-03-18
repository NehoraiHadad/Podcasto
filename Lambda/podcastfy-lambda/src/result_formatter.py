"""
Results formatter for the Podcast Generator Lambda.
"""
import json
import base64
import os
from typing import Dict, Any, Optional
from src.utils.logging import get_logger
from src.utils.responses import create_error_response

logger = get_logger(__name__)

class ResultFormatter:
    """
    Formats results from podcast generation for Lambda response.
    """
    
    def encode_file(self, file_path: str) -> Optional[str]:
        """
        Base64 encode a file for API response.
        
        Args:
            file_path: Path to the file to encode
            
        Returns:
            Base64 encoded string or None if failed
        """
        try:
            if not os.path.exists(file_path):
                logger.error(f"File not found: {file_path}")
                return None
                
            with open(file_path, 'rb') as file:
                encoded = base64.b64encode(file.read()).decode('utf-8')
                logger.info(f"Successfully encoded file: {file_path}")
                return encoded
                
        except Exception as e:
            logger.error(f"Error encoding file {file_path}: {str(e)}")
            return None
    
    def create_file_response(self, file_path: str, file_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a response with a file attachment.
        
        Args:
            file_path: Path to the file to include
            file_name: Optional filename to use in the response
            
        Returns:
            Response dictionary with file data
        """
        if not file_name:
            file_name = os.path.basename(file_path)
            
        # Get file content as base64
        file_content = self.encode_file(file_path)
        if not file_content:
            return create_error_response(404, f"File not found: {file_path}")
            
        # Create response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': f'attachment; filename="{file_name}"'
            },
            'body': file_content,
            'isBase64Encoded': True
        }
    
    def format_single_podcast_result(
        self, 
        podcast_id: str, 
        local_path: str, 
        s3_url: Optional[str], 
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Format the result of processing a single podcast.
        
        Args:
            podcast_id: ID of the podcast
            local_path: Local path to the podcast file
            s3_url: S3 URL of the uploaded podcast file (if available)
            metadata: Podcast metadata
            
        Returns:
            Formatted result
        """
        result = {
            "podcast_id": podcast_id,
            "status": "success",
            "message": "Podcast successfully generated",
            "local_path": local_path,
            "metadata": metadata
        }
        
        # Add S3 URL if available
        if s3_url:
            result["s3_url"] = s3_url
            
        return result
    
    def format_multiple_podcasts_result(
        self, 
        results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Format the result of processing multiple podcasts.
        
        Args:
            results: Dictionary of podcast results keyed by podcast ID
            
        Returns:
            Formatted result
        """
        formatted_results = {}
        success_count = 0
        error_count = 0
        
        for podcast_id, result in results.items():
            # Check if result contains an error
            if isinstance(result, dict) and result.get('error', False):
                error_count += 1
                formatted_results[podcast_id] = {
                    "status": "error",
                    "message": result.get('message', 'Unknown error'),
                }
            else:
                success_count += 1
                formatted_results[podcast_id] = result
        
        return {
            "status": "complete",
            "success_count": success_count,
            "error_count": error_count,
            "results": formatted_results
        } 