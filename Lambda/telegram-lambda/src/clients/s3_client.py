"""
S3 client for the Telegram collector Lambda function.
This module provides functions to interact with AWS S3.
"""
import os
import json
import boto3
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import time

from src.utils.logging import get_logger

logger = get_logger(__name__)


class S3Client:
    """
    A simple S3 client for the Lambda function.
    """
    
    def __init__(self):
        """Initialize the S3 client."""
        self.s3_bucket_name = os.getenv('S3_BUCKET_NAME', 'telegram-data-collector')
        self.is_local = os.environ.get('AWS_SAM_LOCAL') == 'true'
        self.max_retries = 3
        self.retry_delay = 1  # seconds
        
        if not self.is_local:
            session = boto3.Session()
            self.s3_client = session.client('s3')
        else:
            self.s3_client = None
            logger.info("Running in local environment, S3 operations will be simulated")
    
    def upload_data(self, data: Dict[str, Any], podcast_id: str, episode_id: str) -> Optional[str]:
        """
        Upload data to S3.
        
        Args:
            data: The data to upload
            podcast_id: The ID of the podcast
            episode_id: The episode ID for consistent folder structure
        
        Returns:
            S3 key of the uploaded file or local path if running locally
        """
        filename = "content.json"
        
        # Convert data to JSON
        json_data = json.dumps(data, ensure_ascii=False, indent=2)
        
        if not self.is_local and self.s3_client:
            s3_path = self._upload_to_s3(filename, json_data, podcast_id, episode_id)
            return s3_path
        else:
            local_path = self._save_locally(filename, json_data, podcast_id, episode_id)
            return local_path
    
    def _upload_to_s3(self, filename: str, json_data: str, podcast_id: str, episode_id: str) -> str:
        """Upload data to S3 with retry logic."""
        # Use consistent folder structure: podcasts/{podcast_id}/{episode_id}/
        s3_key = f"podcasts/{podcast_id}/{episode_id}/{filename}"
        
        for attempt in range(self.max_retries):
            try:
                self.s3_client.put_object(
                    Bucket=self.s3_bucket_name,
                    Key=s3_key,
                    Body=json_data
                )
                logger.info(f"Successfully uploaded data to S3: s3://{self.s3_bucket_name}/{s3_key}")
                return f"s3://{self.s3_bucket_name}/{s3_key}"
            except Exception as e:
                logger.error(f"Error uploading to S3 (attempt {attempt+1}/{self.max_retries}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
                else:
                    # Fall back to local storage on final failure
                    return self._save_locally(filename, json_data, podcast_id, episode_id)
    
    def _save_locally(self, filename: str, json_data: str, podcast_id: str, episode_id: str) -> str:
        """Save data locally."""
        # Create directory structure if it doesn't exist - use consistent structure with episode_id
        local_dir = f"/tmp/podcasts/{podcast_id}/{episode_id}"
        os.makedirs(local_dir, exist_ok=True)
        
        # Save to local file
        local_path = f"{local_dir}/{filename}"
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(json_data)
        
        logger.info(f"Saved data locally: {local_path}")
        return local_path
    
    def upload_file(self, local_path: str, podcast_id: str, episode_id: str, file_type: str, filename: str) -> Optional[str]:
        """
        Upload a file to S3.
        
        Args:
            local_path: The local path of the file to upload
            podcast_id: The ID of the podcast
            episode_id: The episode ID for consistent folder structure
            file_type: The type of file (e.g., 'images')
            filename: The name of the file
        
        Returns:
            The S3 URL if the upload was successful, None otherwise
        """
        if self.is_local or not self.s3_client:
            logger.info(f"Simulating upload of {local_path} to s3://{self.s3_bucket_name}/podcasts/{podcast_id}/{episode_id}/{file_type}/{filename}")
            return f"local://{local_path}"
        
        # Use consistent folder structure: podcasts/{podcast_id}/{episode_id}/
        s3_key = f"podcasts/{podcast_id}/{episode_id}/{file_type}/{filename}"
        
        for attempt in range(self.max_retries):
            try:
                self.s3_client.upload_file(local_path, self.s3_bucket_name, s3_key)
                logger.info(f"Successfully uploaded file to S3: s3://{self.s3_bucket_name}/{s3_key}")
                return f"s3://{self.s3_bucket_name}/{s3_key}"
            except Exception as e:
                logger.error(f"Error uploading file to S3 (attempt {attempt+1}/{self.max_retries}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
        
        return None 