"""
Client for interacting with AWS S3.
"""
import json
import logging
import os
import tempfile
import boto3
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class S3Client:
    """Client for interacting with AWS S3."""
    
    def __init__(self):
        """Initialize the S3 client."""
        self.s3_client = boto3.client('s3')
    
    def download_telegram_content(self, content_url: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Download content from S3 using content URL.
        
        Args:
            content_url: S3 URL or path in format s3://bucket/key
            request_id: Optional request ID for tracing
            
        Returns:
            Dictionary with download results
        """
        log_prefix = f"[{request_id}] " if request_id else ""
        
        try:
            logger.info(f"{log_prefix}Downloading content from {content_url}")
            
            # Parse S3 URL
            if content_url.startswith('s3://'):
                s3_parts = content_url.replace('s3://', '').split('/', 1)
                if len(s3_parts) != 2:
                    raise ValueError(f"Invalid S3 URL format: {content_url}")
                    
                bucket = s3_parts[0]
                key = s3_parts[1]
            else:
                raise ValueError(f"Invalid S3 URL format: {content_url}")
            
            # Create a temporary file
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                temp_path = temp_file.name
                
                # Download the file
                self.s3_client.download_file(bucket, key, temp_path)
                
                # Read the file content
                with open(temp_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                
                # Clean up temporary file
                os.unlink(temp_path)
                
                logger.info(f"{log_prefix}Successfully downloaded content from {content_url}")
                
                return {
                    'success': True,
                    'content': content
                }
                
        except ValueError as e:
            logger.error(f"{log_prefix}Error parsing S3 URL: {str(e)}")
            return {
                'success': False,
                'error': f"Invalid S3 URL format: {str(e)}"
            }
        except Exception as e:
            logger.error(f"{log_prefix}Error downloading content from S3: {str(e)}")
            return {
                'success': False,
                'error': f"Error downloading content: {str(e)}"
            }
    
    def upload_file(self, local_path: str, bucket: str, key: str, request_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload a file to S3.
        
        Args:
            local_path: Local file path
            bucket: S3 bucket name
            key: S3 object key
            request_id: Optional request ID for tracing
            
        Returns:
            Dictionary with upload results
        """
        log_prefix = f"[{request_id}] " if request_id else ""
        
        try:
            logger.info(f"{log_prefix}Uploading file from {local_path} to s3://{bucket}/{key}")
            
            self.s3_client.upload_file(local_path, bucket, key)
            
            logger.info(f"{log_prefix}Successfully uploaded file to s3://{bucket}/{key}")
            
            return {
                'success': True,
                'url': f"s3://{bucket}/{key}"
            }
            
        except Exception as e:
            logger.error(f"{log_prefix}Error uploading file to S3: {str(e)}")
            return {
                'success': False,
                'error': f"Error uploading file: {str(e)}"
            } 