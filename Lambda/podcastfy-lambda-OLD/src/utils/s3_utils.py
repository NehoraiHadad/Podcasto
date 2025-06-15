"""
Utilities for interacting with AWS S3.
"""
import os
import glob
from typing import List, Dict, Any

from src.clients.s3_client import S3Client
from src.utils.logging import get_logger

logger = get_logger(__name__)

def upload_podcast_audio(local_path: str, podcast_id: str, episode_id: str, s3_bucket: str) -> Dict[str, Any]:
    """
    Uploads the podcast audio file to S3.

    Args:
        local_path: The local path to the audio file.
        podcast_id: The actual ID of the podcast.
        episode_id: The ID of the episode.
        s3_bucket: The target S3 bucket name.

    Returns:
        A dictionary containing the upload result ('success', 'url', 'error').
    """
    s3_client = S3Client()
    filename = os.path.basename(local_path)
    s3_key = f"podcasts/{podcast_id}/{episode_id}/{filename}"
    
    logger.info(f"Attempting to upload podcast audio to S3: s3://{s3_bucket}/{s3_key}")
    result = s3_client.upload_file(local_path, s3_bucket, s3_key)
    
    if result.get('success', False):
        logger.info(f"Successfully uploaded podcast audio to S3: {result.get('url')}")
    else:
        error_msg = result.get('error', 'Unknown error')
        logger.error(f"Failed to upload podcast audio to S3: {error_msg}")
        
    return result

def upload_transcripts(transcript_dir: str, podcast_id: str, episode_id: str, s3_bucket: str) -> List[Dict[str, Any]]:
    """
    Upload transcript files from a directory to S3.

    Args:
        transcript_dir: The local directory containing transcript files.
        podcast_id: The actual ID of the podcast.
        episode_id: The ID of the episode.
        s3_bucket: The target S3 bucket name.

    Returns:
        A list of dictionaries, each containing the upload result for a file.
    """
    s3_client = S3Client()
    upload_results = []
    
    if not os.path.exists(transcript_dir):
        logger.warning(f"Transcript directory does not exist: {transcript_dir}")
        return upload_results

    # Find all transcript files (e.g., .txt)
    transcript_files = glob.glob(os.path.join(transcript_dir, "*.txt"))

    if not transcript_files:
        logger.info(f"No transcript files found in {transcript_dir}")
        return upload_results

    logger.info(f"Found {len(transcript_files)} transcript files to upload")

    for file_path in transcript_files:
        try:
            filename = os.path.basename(file_path)
            s3_key = f"podcasts/{podcast_id}/{episode_id}/transcripts/{filename}"
            
            logger.info(f"Uploading transcript file {filename} to S3: s3://{s3_bucket}/{s3_key}")
            result = s3_client.upload_file(file_path, s3_bucket, s3_key)
            upload_results.append(result)

            if result.get('success', False):
                logger.info(f"Successfully uploaded transcript to S3: {result.get('url')}")
            else:
                error_msg = result.get('error', 'Unknown error')
                logger.error(f"Failed to upload transcript to S3: {error_msg}")
        except Exception as e:
            logger.error(f"Error uploading transcript file {file_path}: {str(e)}")
            upload_results.append({
                'success': False,
                'error': f"Error uploading transcript file: {str(e)}"
            })

    return upload_results 