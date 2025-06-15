"""
S3 client for Lambda audio generation function
"""
import os
import boto3
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError

from utils.logging import get_logger

logger = get_logger(__name__)

class S3Client:
    """Client for uploading audio files to S3"""
    
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = os.environ.get('S3_BUCKET_NAME', 'podcasto-podcasts')
    
    def upload_audio(
        self,
        audio_buffer: bytes,
        podcast_id: str,
        episode_id: str,
        file_format: str = 'wav'
    ) -> str:
        """
        Upload audio file to S3
        
        Args:
            audio_buffer: Audio data as bytes
            podcast_id: The podcast ID
            episode_id: The episode ID
            file_format: Audio file format (default: wav)
            
        Returns:
            S3 URL of uploaded file
            
        Raises:
            Exception: If upload fails
        """
        try:
            # Construct S3 key
            s3_key = f"podcasts/{podcast_id}/{episode_id}/audio/podcast.{file_format}"
            
            logger.info(f"[S3] Uploading audio to s3://{self.bucket_name}/{s3_key}")
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=audio_buffer,
                ContentType=f'audio/{file_format}',
                Metadata={
                    'podcast_id': podcast_id,
                    'episode_id': episode_id,
                    'content_type': 'podcast_audio'
                }
            )
            
            # Generate public URL
            s3_url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            logger.info(f"[S3] Successfully uploaded audio: {s3_url}")
            return s3_url
            
        except ClientError as e:
            error_msg = f"Failed to upload audio to S3: {e}"
            logger.error(f"[S3] {error_msg}")
            raise Exception(error_msg)
            
        except Exception as e:
            error_msg = f"Unexpected error uploading audio: {e}"
            logger.error(f"[S3] {error_msg}")
            raise Exception(error_msg)
    
    def upload_file(
        self,
        file_path: str,
        podcast_id: str,
        episode_id: str,
        file_type: str,
        filename: str
    ) -> str:
        """
        Upload a file to S3
        
        Args:
            file_path: Local path to the file
            podcast_id: The podcast ID
            episode_id: The episode ID
            file_type: Type of file (e.g., 'images', 'audio')
            filename: Name of the file
            
        Returns:
            S3 URL of uploaded file
        """
        try:
            s3_key = f"podcasts/{podcast_id}/{episode_id}/{file_type}/{filename}"
            
            logger.info(f"[S3] Uploading file to s3://{self.bucket_name}/{s3_key}")
            
            self.s3_client.upload_file(
                file_path,
                self.bucket_name,
                s3_key
            )
            
            s3_url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            logger.info(f"[S3] Successfully uploaded file: {s3_url}")
            return s3_url
            
        except Exception as e:
            error_msg = f"Failed to upload file {file_path}: {e}"
            logger.error(f"[S3] {error_msg}")
            raise Exception(error_msg)
    
    def upload_transcript(
        self,
        transcript_content: str,
        podcast_id: str,
        episode_id: str,
        filename: str
    ) -> Optional[str]:
        """
        Upload transcript content to S3
        
        Args:
            transcript_content: The transcript text content
            podcast_id: The podcast ID
            episode_id: The episode ID
            filename: Name of the transcript file
            
        Returns:
            S3 URL of uploaded transcript or None if failed
        """
        try:
            # Construct S3 key for transcript
            s3_key = f"podcasts/{podcast_id}/{episode_id}/transcripts/{filename}"
            
            logger.info(f"[S3] Uploading transcript to s3://{self.bucket_name}/{s3_key}")
            
            # Upload transcript content to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=transcript_content.encode('utf-8'),
                ContentType='text/plain',
                Metadata={
                    'podcast_id': podcast_id,
                    'episode_id': episode_id,
                    'content_type': 'podcast_transcript'
                }
            )
            
            # Generate public URL
            s3_url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            logger.info(f"[S3] Successfully uploaded transcript: {s3_url}")
            return s3_url
            
        except ClientError as e:
            logger.error(f"[S3] Failed to upload transcript to S3: {e}")
            return None
            
        except Exception as e:
            logger.error(f"[S3] Unexpected error uploading transcript: {e}")
            return None

    def check_file_exists(self, s3_key: str) -> bool:
        """
        Check if a file exists in S3
        
        Args:
            s3_key: The S3 key to check
            
        Returns:
            True if file exists, False otherwise
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            else:
                logger.error(f"[S3] Error checking file existence: {e}")
                return False 