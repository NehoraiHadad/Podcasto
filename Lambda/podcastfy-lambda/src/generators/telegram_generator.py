"""
Telegram-based podcast generator.
"""
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
from podcastfy.client import generate_podcast
import os
import re
import tempfile
import base64
import mimetypes

from src.utils.logging import get_logger
from src.generators.base_generator import BaseGenerator, get_safe_filename
from src.clients.s3_client import S3Client

logger = get_logger(__name__)

class TelegramGenerator(BaseGenerator):
    """
    Generate podcasts from Telegram content.
    """
    
    def __init__(self, podcast_config: Dict[str, Any], storage_dir: Optional[str] = None):
        # Ensure BaseGenerator init is called if not already
        super().__init__(podcast_config, storage_dir)
        # You might not need to store podcast_config/storage_dir here if Base handles it
        # self.podcast_config = podcast_config
        # self.storage_dir = storage_dir

    def _parse_s3_uri(self, s3_uri: str) -> Optional[Tuple[str, str]]:
        """
        Parses an S3 URI into bucket and key.
        """
        match = re.match(r"s3://([^/]+)/(.+)", s3_uri)
        if match:
            return match.groups()
        return None

    def create_podcast(
        self,
        telegram_data: Dict[str, Any],
        metadata: Dict[str, Any],
        conversation_config: Dict[str, Any] = None,
        longform: bool = False,
        max_num_chunks: Optional[int] = None,
        min_chunk_size: Optional[int] = None,
        request_id: Optional[str] = None
    ) -> Optional[Tuple[str, Optional[str], int]]:
        """
        Create a podcast from Telegram data, including images passed as data URIs.
        
        Args:
            telegram_data: Telegram data structure
            metadata: Podcast metadata (title, description, etc.)
            conversation_config: Configuration for the conversation
            longform: Whether to generate a longform podcast
            max_num_chunks: Maximum number of chunks to process
            min_chunk_size: Minimum size of each chunk
            request_id: Optional request ID for tracing
            
        Returns:
            Tuple of (local_path, s3_url, duration) for the generated podcast file or None if failed
        """
        try:
            logger.info("Creating podcast from Telegram data (with image processing)")
            
            # Prepare API environment
            if not self.prepare_api_environment():
                return None
            
            # Check if we have results in the Telegram data
            if 'results' not in telegram_data:
                logger.error("No 'results' field found in Telegram data")
                return None
                
            # Process the Telegram results into text
            content = self._process_telegram_results(telegram_data['results'])
            if not content:
                logger.error("Failed to process Telegram data, no text extracted")
                return None
            
            # --- Image Processing Start ---
            s3_client = S3Client() # Initialize S3 client
            image_data_uris = [] # Changed list name
            image_s3_uris = []

            # Extract image S3 URIs from media_info
            for channel, messages in telegram_data.get('results', {}).items():
                for message in messages:
                    media_info = message.get('media_info')
                    # Log the media_info being checked
                    logger.debug(f"Checking media_info: {media_info}")
                    if isinstance(media_info, str) and media_info.startswith("[Image: s3://"):
                        # Extract the s3://... part using the corrected regex
                        # The regex looks for s3:// followed by any characters except ]
                        match = re.search("s3://[^\]]+", media_info) # Standard string with escaped ]
                        if match:
                            image_s3_uris.append(match.group(0))
            
            if image_s3_uris:
                logger.info(f"Found {len(image_s3_uris)} potential image S3 URIs to process into data URIs.")
                for s3_uri in image_s3_uris:
                    parsed_uri = self._parse_s3_uri(s3_uri)
                    if not parsed_uri:
                        logger.warning(f"Could not parse S3 URI: {s3_uri}")
                        continue

                    bucket, key = parsed_uri
                    filename = os.path.basename(key)
                    # Ensure filename is safe for the local filesystem
                    safe_filename = get_safe_filename(filename)

                    try:
                        # Get image content as bytes
                        logger.info(f"Attempting to get image content from s3://{bucket}/{key}")
                        image_bytes = s3_client.get_s3_object_content(bucket, key, request_id) # Use new method
                        if image_bytes:
                            # Guess MIME type
                            mime_type, _ = mimetypes.guess_type(filename)
                            if not mime_type:
                                mime_type = 'application/octet-stream' # Default if unknown
                                logger.warning(f"Could not guess MIME type for {filename}, using default.")
                            
                            # Encode as Base64
                            encoded_bytes = base64.b64encode(image_bytes)
                            base64_string = encoded_bytes.decode('utf-8')
                            
                            # Construct data URI
                            data_uri = f"data:{mime_type};base64,{base64_string}"
                            image_data_uris.append(data_uri)
                            logger.info(f"Successfully created data URI for {filename} (approx {len(data_uri)} chars).")
                        else:
                            logger.warning(f"Failed to get content for image: {s3_uri}")
                    except Exception as get_content_err:
                        logger.error(f"Error getting/processing image content for {s3_uri}: {get_content_err}")
            else:
                logger.info("No image S3 URIs found in media_info.")
            # --- Image Processing End ---
            
            # Create a custom title if not provided
            if "title" not in metadata:
                metadata["title"] = f"Telegram_Podcast_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
            # Create output path
            output_path = self.get_output_path(metadata)
            
            # Create required directories for podcast generation
            os.makedirs("/tmp/podcastify-demo/tmp", exist_ok=True)
            os.makedirs("/tmp/podcastify-demo/transcripts", exist_ok=True)
            os.makedirs("/tmp/podcastify-demo/audio", exist_ok=True)
            
            # Update conversation config with max_num_chunks and min_chunk_size if provided
            if conversation_config is None:
                conversation_config = {}
                
            if max_num_chunks is not None:
                conversation_config["max_num_chunks"] = max_num_chunks
            if min_chunk_size is not None:
                conversation_config["min_chunk_size"] = min_chunk_size
                
            logger.info("Conversation config:")
            for key, value in conversation_config.items():
                logger.info(f"  {key}: {value}")
                
            # Generate podcast using the podcastfy library, passing data URIs
            logger.info(f"Calling generate_podcast with {len(image_data_uris)} image data URIs.")
            audio_file = generate_podcast(
                text=content,
                conversation_config={
                    **conversation_config,
                    "text_to_speech": {
                        "temp_audio_dir": "../../../../../../../../../../../../tmp/podcastify-demo/tmp",
                        "output_directories": {
                            "transcripts": "/tmp/podcastify-demo/transcripts",
                            "audio": "/tmp/podcastify-demo/audio"
                        }
                    }
                },
                longform=longform,
                image_paths=image_data_uris if image_data_uris else None
            )
            
            # Process generated file and upload to S3
            return self.generate_podcast(audio_file, metadata, output_path)
                
        except Exception as e:
            logger.exception(f"Error creating podcast from Telegram data: {str(e)}")
            return None

    def _process_telegram_results(self, results: Dict[str, List[Dict[str, Any]]]) -> str:
        """
        Process Telegram results to create content for podcast generation
        
        Args:
            results: Results from Telegram data
            
        Returns:
            Processed content as a string
        """
        content_parts = []
        
        # Process each channel
        for channel_name, messages in results.items():
            content_parts.append(f"# Content from channel {channel_name}")
            content_parts.append("")
            
            # Skip processing if there are no messages
            if not messages or not isinstance(messages, list):
                content_parts.append("No messages found in this channel.")
                content_parts.append("---")
                content_parts.append("")
                continue
            
            # Sort messages by date if possible
            try:
                sorted_messages = sorted(messages, key=lambda x: x.get('date', ''))
            except Exception:
                # If sorting fails, use the original order
                sorted_messages = messages
            
            # Process each message
            for message in sorted_messages:
                if not isinstance(message, dict):
                    continue
                
                message_text = message.get('text', '')
                if not message_text:
                    continue
                
                # Add date if available
                date_str = message.get('date', '')
                if date_str:
                    try:
                        # Parse ISO format date and format it
                        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        formatted_date = date_obj.strftime("%d/%m/%Y %H:%M")
                        content_parts.append(f"## {formatted_date}")
                    except Exception:
                        # If date parsing fails, use the original string
                        content_parts.append(f"## {date_str}")
                
                # Add message text
                content_parts.append(message_text)
                
                # Add media info if available
                media_info = message.get('media_info')
                if media_info and isinstance(media_info, str) and not media_info.startswith("[Video:"):
                    content_parts.append(f"[Media attached: {media_info}]")
                
                # Add URLs if available
                urls = message.get('urls', [])
                if urls and isinstance(urls, list):
                    content_parts.append("Links:")
                    for url in urls:
                        content_parts.append(f"- {url}")
                
                # Add separator between messages
                content_parts.append("---")
                content_parts.append("")
        
        # Return empty string if no content was processed
        if not content_parts:
            return ""
            
        # Join all parts with newlines
        return "\n".join(content_parts) 