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
        
        # Check environment variables and S3 access
        self._check_s3_access()
    
    def _check_s3_access(self):
        """Check S3 access and environment variables."""
        # Check if S3_BUCKET_NAME is set
        s3_bucket = os.environ.get('S3_BUCKET_NAME')
        if not s3_bucket:
            logger.error("S3_BUCKET_NAME environment variable is not set. This is required for S3 operations.")
            raise ValueError("S3_BUCKET_NAME environment variable must be set")
        
        # Test S3 access
        try:
            # Try a simple operation to verify S3 access
            self.s3_client.list_objects_v2(Bucket=s3_bucket, MaxKeys=1)
            logger.info(f"Successfully connected to S3 bucket: {s3_bucket}")
        except Exception as e:
            logger.error(f"Error accessing S3 bucket {s3_bucket}: {str(e)}")
            logger.error("This may cause file uploads to fail. Please check AWS credentials and permissions.")
            # We don't raise an exception here to allow the Lambda to continue running
    
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
            # Check if local file exists
            if not os.path.exists(local_path):
                error_msg = f"Local file does not exist: {local_path}"
                logger.error(f"{log_prefix}{error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }
                
            # Check file size to make sure it's not empty
            file_size = os.path.getsize(local_path)
            if file_size == 0:
                error_msg = f"File is empty (0 bytes): {local_path}"
                logger.error(f"{log_prefix}{error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }
                
            logger.info(f"{log_prefix}Uploading file ({file_size} bytes) from {local_path} to s3://{bucket}/{key}")
            
            # Add retry logic
            max_retries = 3
            retry_delay = 1  # seconds
            
            for attempt in range(max_retries):
                try:
                    self.s3_client.upload_file(local_path, bucket, key)
                    
                    # Verify the upload by checking if the object exists
                    try:
                        self.s3_client.head_object(Bucket=bucket, Key=key)
                        logger.info(f"{log_prefix}Successfully uploaded and verified file at s3://{bucket}/{key}")
                        
                        return {
                            'success': True,
                            'url': f"s3://{bucket}/{key}"
                        }
                    except Exception as verify_err:
                        logger.warning(f"{log_prefix}Upload succeeded but verification failed: {str(verify_err)}")
                        # Continue without verification if it fails
                        return {
                            'success': True,
                            'url': f"s3://{bucket}/{key}"
                        }
                        
                except Exception as upload_err:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt)  # Exponential backoff
                        logger.warning(f"{log_prefix}Upload attempt {attempt+1} failed: {str(upload_err)}. Retrying in {wait_time}s...")
                        import time
                        time.sleep(wait_time)
                    else:
                        # Final attempt failed
                        raise upload_err
            
        except Exception as e:
            # Log the full error details for debugging
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"{log_prefix}Error uploading file to S3: {str(e)}\n{error_details}")
            return {
                'success': False,
                'error': f"Error uploading file: {str(e)}"
            }

    def download_s3_object(self, bucket: str, key: str, local_path: str, request_id: Optional[str] = None) -> bool:
        """
        Downloads a specific object from S3 to a local path.

        Args:
            bucket: S3 bucket name.
            key: S3 object key.
            local_path: The local file path to download to.
            request_id: Optional request ID for tracing.

        Returns:
            True if download was successful, False otherwise.
        """
        log_prefix = f"[{request_id}] " if request_id else ""
        try:
            logger.info(f"{log_prefix}Attempting to download s3://{bucket}/{key} to {local_path}")
            self.s3_client.download_file(bucket, key, local_path)
            logger.info(f"{log_prefix}Successfully downloaded s3://{bucket}/{key}")
            return True
        except Exception as e:
            # Log specific boto3 client errors if possible
            if hasattr(e, 'response') and 'Error' in e.response:
                error_code = e.response['Error'].get('Code')
                error_message = e.response['Error'].get('Message')
                logger.error(f"{log_prefix}S3 download error for s3://{bucket}/{key}: {error_code} - {error_message}")
            else:
                logger.error(f"{log_prefix}Error downloading s3://{bucket}/{key}: {str(e)}")
            return False

    def get_s3_object_content(self, bucket: str, key: str, request_id: Optional[str] = None) -> Optional[bytes]:
        """
        Downloads the raw content (bytes) of an S3 object.

        Args:
            bucket: S3 bucket name.
            key: S3 object key.
            request_id: Optional request ID for tracing.

        Returns:
            The object content as bytes, or None if download fails.
        """
        log_prefix = f"[{request_id}] " if request_id else ""
        try:
            logger.info(f"{log_prefix}Attempting to get content for s3://{bucket}/{key}")
            response = self.s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read()
            logger.info(f"{log_prefix}Successfully retrieved {len(content)} bytes for s3://{bucket}/{key}")
            return content
        except Exception as e:
            if hasattr(e, 'response') and 'Error' in e.response:
                error_code = e.response['Error'].get('Code')
                error_message = e.response['Error'].get('Message')
                logger.error(f"{log_prefix}S3 get_object error for s3://{bucket}/{key}: {error_code} - {error_message}")
            else:
                logger.error(f"{log_prefix}Error getting content for s3://{bucket}/{key}: {str(e)}")
            return None 