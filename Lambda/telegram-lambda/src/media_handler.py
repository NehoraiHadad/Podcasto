"""
Media handling module for the Telegram collector Lambda function.
"""
import os
import asyncio
from typing import Optional, List
from telethon.tl.types import Message, MessageMediaPhoto, MessageMediaDocument
from telethon.tl.types import DocumentAttributeVideo, DocumentAttributeAudio
from telethon import TelegramClient

from src.clients.s3_client import S3Client
from src.utils.logging import get_logger

logger = get_logger(__name__)


class MediaHandler:
    """
    Handles downloading and processing media from Telegram messages.
    
    This class is responsible for downloading media files from Telegram messages,
    storing them locally, and optionally uploading them to S3.
    """
    
    def __init__(self, s3_client: S3Client, media_dir: str = "/tmp/media", is_local: bool = False):
        """
        Initialize the MediaHandler.
        
        Args:
            s3_client: The S3 client to use for uploading media
            media_dir: The directory to store media files in
            is_local: Whether the handler is running in local mode
        """
        self.s3_client = s3_client
        self.media_dir = media_dir
        self.is_local = is_local
        self.podcast_id = None
        self.episode_id = None
        self.media_types = ["image"]  # Default to only images
        
        # Create a semaphore to limit concurrent downloads
        self.download_semaphore = asyncio.Semaphore(5)
        
        # Create media directory if it doesn't exist
        os.makedirs(self.media_dir, exist_ok=True)
    
    def set_context(self, podcast_id: str, episode_id: str, media_types: List[str] = None):
        """
        Set the context for media handling.
        
        Args:
            podcast_id: The ID of the podcast
            episode_id: The episode ID for consistent folder structure
            media_types: List of media types to process (e.g., ["image", "video", "audio", "file"])
        """
        self.podcast_id = podcast_id
        self.episode_id = episode_id
        if media_types:
            self.media_types = media_types
        
        # Create podcast-specific media directory using consistent folder structure
        self.podcast_media_dir = os.path.join(self.media_dir, "podcasts", podcast_id, episode_id)
        os.makedirs(self.podcast_media_dir, exist_ok=True)
        
        logger.info(f"Media handler context set: podcast_id={podcast_id}, episode_id={episode_id}, media_types={self.media_types}")
    
    async def download_media(self, client: TelegramClient, message: Message) -> Optional[str]:
        """
        Download media from a message.
        
        Args:
            client: The Telegram client
            message: The message to download media from
            
        Returns:
            A description of the media, or None if no media was found
        """
        if not self.podcast_id or not self.episode_id:
            logger.warning("Media handler context not set. Call set_context() first.")
            return None
            
        async with self.download_semaphore:
            try:
                if not message.media:
                    return None
                
                file_id = f"{message.id}_{message.date.strftime('%Y%m%d')}"
                
                # Handle photos if "image" is in media_types
                if "image" in self.media_types and isinstance(message.media, MessageMediaPhoto):
                    return await self._handle_photo(client, message, file_id)
                
                # For other media types, check if we should process them
                if isinstance(message.media, MessageMediaDocument):
                    for attr in message.document.attributes:
                        if isinstance(attr, DocumentAttributeVideo):
                            if "video" in self.media_types:
                                return await self._handle_video(client, message, file_id)
                            else:
                                logger.debug(f"Skipping video in message {message.id} (not in media_types)")
                                return "[Video: Not downloaded - Not configured to download videos]"
                                
                        elif isinstance(attr, DocumentAttributeAudio):
                            if "audio" in self.media_types:
                                return await self._handle_audio(client, message, file_id)
                            else:
                                logger.debug(f"Skipping audio in message {message.id} (not in media_types)")
                                return "[Audio: Not downloaded - Not configured to download audio]"
                                
                    # If we get here, it's a file
                    if "file" in self.media_types:
                        return await self._handle_file(client, message, file_id)
                    else:
                        logger.debug(f"Skipping file in message {message.id} (not in media_types)")
                        return "[File: Not downloaded - Not configured to download files]"
                        
                return None
                
            except Exception as e:
                logger.error(f"Error downloading media from message {message.id}: {str(e)}")
                return "[Media: Download failed]"
    
    async def _handle_photo(self, client: TelegramClient, message: Message, file_id: str) -> str:
        """Handle photo media."""
        try:
            # Generate filename
            filename = f"photo_{file_id}.jpg"
            local_path = os.path.join(self.podcast_media_dir, filename)
            
            # Download the photo
            await client.download_media(message, local_path)
            
            # Upload to S3 if not in local mode
            if not self.is_local:
                s3_path = self.s3_client.upload_file(
                    local_path=local_path,
                    podcast_id=self.podcast_id,
                    episode_id=self.episode_id,
                    file_type="images",
                    filename=filename
                )
                
                if s3_path:
                    logger.info(f"Uploaded photo to S3: {s3_path}")
                    return f"[Image: {s3_path}]"
                else:
                    logger.warning(f"Failed to upload photo to S3, using local path: {local_path}")
                    return f"[Image: local://{local_path}]"
            else:
                return f"[Image: local://{local_path}]"
                
        except Exception as e:
            logger.error(f"Error handling photo in message {message.id}: {str(e)}")
            return "[Image: Download failed]"
            
    async def _handle_video(self, client: TelegramClient, message: Message, file_id: str) -> str:
        """Handle video media."""
        try:
            # Generate filename
            filename = f"video_{file_id}.mp4"
            local_path = os.path.join(self.podcast_media_dir, filename)
            
            # Download the video
            await client.download_media(message, local_path)
            
            # Upload to S3 if not in local mode
            if not self.is_local:
                s3_path = self.s3_client.upload_file(
                    local_path=local_path,
                    podcast_id=self.podcast_id,
                    episode_id=self.episode_id,
                    file_type="videos",
                    filename=filename
                )
                
                if s3_path:
                    logger.info(f"Uploaded video to S3: {s3_path}")
                    return f"[Video: {s3_path}]"
                else:
                    logger.warning(f"Failed to upload video to S3, using local path: {local_path}")
                    return f"[Video: local://{local_path}]"
            else:
                return f"[Video: local://{local_path}]"
                
        except Exception as e:
            logger.error(f"Error handling video in message {message.id}: {str(e)}")
            return "[Video: Download failed]"
            
    async def _handle_audio(self, client: TelegramClient, message: Message, file_id: str) -> str:
        """Handle audio media."""
        try:
            # Generate filename
            filename = f"audio_{file_id}.mp3"
            local_path = os.path.join(self.podcast_media_dir, filename)
            
            # Download the audio
            await client.download_media(message, local_path)
            
            # Upload to S3 if not in local mode
            if not self.is_local:
                s3_path = self.s3_client.upload_file(
                    local_path=local_path,
                    podcast_id=self.podcast_id,
                    episode_id=self.episode_id,
                    file_type="audio",
                    filename=filename
                )
                
                if s3_path:
                    logger.info(f"Uploaded audio to S3: {s3_path}")
                    return f"[Audio: {s3_path}]"
                else:
                    logger.warning(f"Failed to upload audio to S3, using local path: {local_path}")
                    return f"[Audio: local://{local_path}]"
            else:
                return f"[Audio: local://{local_path}]"
                
        except Exception as e:
            logger.error(f"Error handling audio in message {message.id}: {str(e)}")
            return "[Audio: Download failed]"
            
    async def _handle_file(self, client: TelegramClient, message: Message, file_id: str) -> str:
        """Handle other file types."""
        try:
            # Extract file extension if possible
            extension = ""
            for attr in message.document.attributes:
                if hasattr(attr, 'file_name') and attr.file_name:
                    _, ext = os.path.splitext(attr.file_name)
                    if ext:
                        extension = ext
                        break
            
            # Generate filename
            filename = f"file_{file_id}{extension}"
            local_path = os.path.join(self.podcast_media_dir, filename)
            
            # Download the file
            await client.download_media(message, local_path)
            
            # Upload to S3 if not in local mode
            if not self.is_local:
                s3_path = self.s3_client.upload_file(
                    local_path=local_path,
                    podcast_id=self.podcast_id,
                    episode_id=self.episode_id,
                    file_type="files",
                    filename=filename
                )
                
                if s3_path:
                    logger.info(f"Uploaded file to S3: {s3_path}")
                    return f"[File: {s3_path}]"
                else:
                    logger.warning(f"Failed to upload file to S3, using local path: {local_path}")
                    return f"[File: local://{local_path}]"
            else:
                return f"[File: local://{local_path}]"
                
        except Exception as e:
            logger.error(f"Error handling file in message {message.id}: {str(e)}")
            return "[File: Download failed]" 