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
        self.episode_folder = None
        self.media_types = ["image"]  # Default to only images
        
        # Create a semaphore to limit concurrent downloads
        self.download_semaphore = asyncio.Semaphore(5)
        
        # Create media directory if it doesn't exist
        os.makedirs(self.media_dir, exist_ok=True)
    
    def set_context(self, podcast_id: str, episode_folder: str, media_types: List[str] = None):
        """
        Set the context for media handling.
        
        Args:
            podcast_id: The ID of the podcast
            episode_folder: The folder name for the episode
            media_types: List of media types to process (e.g., ["image", "video", "audio", "file"])
        """
        self.podcast_id = podcast_id
        self.episode_folder = episode_folder
        if media_types:
            self.media_types = media_types
        
        # Create podcast-specific media directory
        self.podcast_media_dir = os.path.join(self.media_dir, podcast_id, episode_folder)
        os.makedirs(self.podcast_media_dir, exist_ok=True)
        
        logger.info(f"Media handler context set: podcast_id={podcast_id}, episode_folder={episode_folder}, media_types={self.media_types}")
    
    async def download_media(self, client: TelegramClient, message: Message) -> Optional[str]:
        """
        Download media from a message.
        
        Args:
            client: The Telegram client
            message: The message to download media from
            
        Returns:
            A description of the media, or None if no media was found
        """
        if not self.podcast_id or not self.episode_folder:
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
                            return "[Video: Not downloaded - Not configured to download videos]"
                        elif isinstance(attr, DocumentAttributeAudio):
                            if "audio" in self.media_types:
                                return await self._handle_audio(client, message, file_id)
                            return "[Audio: Not downloaded - Not configured to download audio]"
                    
                    # Generic file
                    if "file" in self.media_types:
                        return await self._handle_file(client, message, file_id)
                    return "[File: Not downloaded - Not configured to download files]"
                
                return None
                
            except Exception as e:
                logger.error(f"Error downloading media: {str(e)}")
                return f"[Media: Download failed - {str(e)}]"
    
    async def _handle_photo(self, client: TelegramClient, message: Message, file_id: str) -> str:
        """Handle photo media type."""
        media_path = os.path.join(self.podcast_media_dir, f"photo_{file_id}.jpg")
        
        # Download only if the file doesn't exist
        if not os.path.exists(media_path):
            try:
                # Set a timeout for the download
                download_task = message.download_media(media_path)
                await asyncio.wait_for(download_task, timeout=30)  # 30 seconds timeout
            except asyncio.TimeoutError:
                logger.warning(f"Timeout downloading photo for message {message.id}")
                return f"[Image: Download failed - Timeout]"
            except Exception as e:
                logger.error(f"Error downloading photo: {str(e)}")
                return f"[Image: Download failed - {str(e)}]"
        
        # Upload to S3 if not running locally
        if not self.is_local and self.s3_client and os.path.exists(media_path):
            try:
                filename = f"photo_{file_id}.jpg"
                s3_url = self.s3_client.upload_file(
                    media_path, 
                    self.podcast_id, 
                    self.episode_folder, 
                    "images", 
                    filename
                )
                if s3_url:
                    return f"[Image: {s3_url}]"
            except Exception as e:
                logger.error(f"Error uploading to S3: {str(e)}")
                # Fall back to local path
        
        return f"[Image: {media_path}]"
    
    async def _handle_video(self, client: TelegramClient, message: Message, file_id: str) -> str:
        """Handle video media type."""
        media_path = os.path.join(self.podcast_media_dir, f"video_{file_id}.mp4")
        
        # Download only if the file doesn't exist
        if not os.path.exists(media_path):
            try:
                # Set a timeout for the download
                download_task = message.download_media(media_path)
                await asyncio.wait_for(download_task, timeout=120)  # 2 minutes timeout for videos
            except asyncio.TimeoutError:
                logger.warning(f"Timeout downloading video for message {message.id}")
                return f"[Video: Download failed - Timeout]"
            except Exception as e:
                logger.error(f"Error downloading video: {str(e)}")
                return f"[Video: Download failed - {str(e)}]"
        
        # Upload to S3 if not running locally
        if not self.is_local and self.s3_client and os.path.exists(media_path):
            try:
                filename = f"video_{file_id}.mp4"
                s3_url = self.s3_client.upload_file(
                    media_path, 
                    self.podcast_id, 
                    self.episode_folder, 
                    "videos", 
                    filename
                )
                if s3_url:
                    return f"[Video: {s3_url}]"
            except Exception as e:
                logger.error(f"Error uploading to S3: {str(e)}")
                # Fall back to local path
        
        return f"[Video: {media_path}]"
    
    async def _handle_audio(self, client: TelegramClient, message: Message, file_id: str) -> str:
        """Handle audio media type."""
        media_path = os.path.join(self.podcast_media_dir, f"audio_{file_id}.mp3")
        
        # Download only if the file doesn't exist
        if not os.path.exists(media_path):
            try:
                # Set a timeout for the download
                download_task = message.download_media(media_path)
                await asyncio.wait_for(download_task, timeout=60)  # 1 minute timeout for audio
            except asyncio.TimeoutError:
                logger.warning(f"Timeout downloading audio for message {message.id}")
                return f"[Audio: Download failed - Timeout]"
            except Exception as e:
                logger.error(f"Error downloading audio: {str(e)}")
                return f"[Audio: Download failed - {str(e)}]"
        
        # Upload to S3 if not running locally
        if not self.is_local and self.s3_client and os.path.exists(media_path):
            try:
                filename = f"audio_{file_id}.mp3"
                s3_url = self.s3_client.upload_file(
                    media_path, 
                    self.podcast_id, 
                    self.episode_folder, 
                    "audio", 
                    filename
                )
                if s3_url:
                    return f"[Audio: {s3_url}]"
            except Exception as e:
                logger.error(f"Error uploading to S3: {str(e)}")
                # Fall back to local path
        
        return f"[Audio: {media_path}]"
    
    async def _handle_file(self, client: TelegramClient, message: Message, file_id: str) -> str:
        """Handle generic file media type."""
        # Get original filename if available
        original_filename = None
        for attr in message.document.attributes:
            if hasattr(attr, 'file_name') and attr.file_name:
                original_filename = attr.file_name
                break
        
        if not original_filename:
            original_filename = f"file_{file_id}"
        
        media_path = os.path.join(self.podcast_media_dir, original_filename)
        
        # Download only if the file doesn't exist
        if not os.path.exists(media_path):
            try:
                # Set a timeout for the download
                download_task = message.download_media(media_path)
                await asyncio.wait_for(download_task, timeout=60)  # 1 minute timeout for files
            except asyncio.TimeoutError:
                logger.warning(f"Timeout downloading file for message {message.id}")
                return f"[File: Download failed - Timeout]"
            except Exception as e:
                logger.error(f"Error downloading file: {str(e)}")
                return f"[File: Download failed - {str(e)}]"
        
        # Upload to S3 if not running locally
        if not self.is_local and self.s3_client and os.path.exists(media_path):
            try:
                s3_url = self.s3_client.upload_file(
                    media_path, 
                    self.podcast_id, 
                    self.episode_folder, 
                    "files", 
                    original_filename
                )
                if s3_url:
                    return f"[File: {s3_url}]"
            except Exception as e:
                logger.error(f"Error uploading to S3: {str(e)}")
                # Fall back to local path
        
        return f"[File: {media_path}]" 