"""
S3 client for the Podcastfy Lambda function.
This module provides functions to interact with AWS S3.
"""
import os
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
        self.s3_bucket_name = os.getenv('S3_BUCKET_NAME', 'podcasto-podcasts')
        # Always use real S3 client, remove local simulation mode
        self.s3_client = boto3.client('s3')
        self.max_retries = 3
        self.retry_delay = 1  # seconds
        
        logger.info(f"S3Client initialized with bucket: {self.s3_bucket_name}")
    
    def upload_podcast(self, local_path: str, podcast_id: str) -> Optional[Tuple[str, str]]:
        """
        Upload a podcast file to S3.
        
        Args:
            local_path: The local path of the podcast file
            podcast_id: The ID of the podcast
        
        Returns:
            Tuple of (S3 URL, timestamp) if upload was successful, None otherwise
        """
        if not os.path.exists(local_path):
            logger.error(f"Podcast file does not exist at {local_path}")
            return None
            
        # Create timestamp once to use for both files
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(local_path)
        s3_key = f"{podcast_id}/{timestamp}/{filename}"
        
        for attempt in range(self.max_retries):
            try:
                self.s3_client.upload_file(local_path, self.s3_bucket_name, s3_key)
                s3_url = f"s3://{self.s3_bucket_name}/{s3_key}"
                logger.info(f"Successfully uploaded podcast to S3: {s3_url}")
                return s3_url, timestamp
            except Exception as e:
                logger.error(f"Error uploading podcast to S3 (attempt {attempt+1}/{self.max_retries}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
        
        return None
    
    def upload_metadata(self, metadata: Dict[str, Any], podcast_id: str, audio_s3_url: str, timestamp: str) -> Optional[str]:
        """
        Upload podcast metadata to S3.
        
        Args:
            metadata: The podcast metadata
            podcast_id: The ID of the podcast
            audio_s3_url: The S3 URL of the audio file
            timestamp: The timestamp to use in the S3 key (same as audio file)
            
        Returns:
            The S3 URL if upload was successful, None otherwise
        """
        import json
        
        s3_key = f"{podcast_id}/{timestamp}/metadata.json"
        
        # Add the audio S3 URL to the metadata
        metadata_with_url = metadata.copy()
        metadata_with_url['audio_url'] = audio_s3_url
        
        # Convert metadata to JSON
        metadata_json = json.dumps(metadata_with_url, ensure_ascii=False, indent=2)
        
        for attempt in range(self.max_retries):
            try:
                self.s3_client.put_object(
                    Bucket=self.s3_bucket_name,
                    Key=s3_key,
                    Body=metadata_json
                )
                s3_url = f"s3://{self.s3_bucket_name}/{s3_key}"
                logger.info(f"Successfully uploaded metadata to S3: {s3_url}")
                return s3_url
            except Exception as e:
                logger.error(f"Error uploading metadata to S3 (attempt {attempt+1}/{self.max_retries}): {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
        
        # Create a local copy as backup
        try:
            local_path = f"/tmp/{podcast_id}_{timestamp}_metadata.json"
            with open(local_path, 'w', encoding='utf-8') as f:
                f.write(metadata_json)
            logger.info(f"Saved metadata locally as backup: {local_path}")
        except Exception as e:
            logger.error(f"Error saving metadata locally: {str(e)}")
        
        return None 