"""
Telegram client wrapper for the Telegram collector Lambda function.
"""
import os
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import FloodWaitError, AuthKeyError, SessionPasswordNeededError

from src.utils.logging import get_logger

logger = get_logger(__name__)


class TelegramClientWrapper:
    """
    A wrapper for the Telethon TelegramClient.
    
    This class provides a simplified interface for interacting with Telegram
    and handles authentication, session management, and error handling.
    """
    
    def __init__(self, api_id: str, api_hash: str, session_string: str):
        """
        Initialize the TelegramClientWrapper.
        
        Args:
            api_id: The Telegram API ID
            api_hash: The Telegram API hash
            session_string: The Telegram session string
        """
        self.api_id = api_id
        self.api_hash = api_hash
        self.session_string = session_string
        self.client = None
        self.max_retries = 3
        self.retry_delay = 2  # seconds
    
    async def connect(self) -> bool:
        """
        Connect to Telegram.
        
        Returns:
            True if the connection was successful, False otherwise
        """
        try:
            # Add debug logs
            logger.info(f"API ID: {self.api_id}")
            logger.info(f"API Hash: {self.api_hash[:5]}...{self.api_hash[-5:] if self.api_hash else ''}")
            logger.info(f"Session String Length: {len(self.session_string) if self.session_string else 0}")
            
            self.client = TelegramClient(StringSession(self.session_string), self.api_id, self.api_hash)
            await self.client.connect()
            
            if not await self.client.is_user_authorized():
                logger.error("User is not authorized. Please provide a valid session string.")
                return False
            
            logger.info("Successfully connected to Telegram")
            return True
        except AuthKeyError:
            logger.error("Invalid session string. Please generate a new session string.")
            return False
        except SessionPasswordNeededError:
            logger.error("Two-factor authentication is enabled. Please disable it or use a different account.")
            return False
        except Exception as e:
            logger.error(f"Error connecting to Telegram: {str(e)}")
            return False
    
    async def disconnect(self):
        """Disconnect from Telegram."""
        if self.client and self.client.is_connected():
            await self.client.disconnect()
            logger.info("Disconnected from Telegram")
    
    async def get_messages(self, channel_username: str, days_back: int = 1, limit: int = 100) -> List[Any]:
        """
        Get messages from a Telegram channel.
        
        Args:
            channel_username: The username of the channel to get messages from
            days_back: Number of days back to get messages from
            limit: Maximum number of messages to get
            
        Returns:
            List of messages from the channel
        """
        if not self.client or not self.client.is_connected():
            logger.error("Not connected to Telegram")
            return []
        
        try:
            # Get the channel entity
            channel = await self.client.get_entity(channel_username)
            
            # Calculate the date from which to collect messages
            since_date = datetime.now(timezone.utc) - timedelta(days=days_back)
            
            # Collect messages
            messages = []
            
            logger.info(f"Collecting messages from {channel_username} since {since_date.isoformat()}")
            
            # Use retry logic for the message collection
            for attempt in range(self.max_retries):
                try:
                    async for message in self.client.iter_messages(channel, offset_date=since_date, reverse=True, limit=limit):
                        messages.append(message)
                    
                    logger.info(f"Collected {len(messages)} messages from {channel_username}")
                    return messages
                except FloodWaitError as e:
                    wait_time = e.seconds
                    logger.warning(f"FloodWaitError: Need to wait {wait_time} seconds. Attempt {attempt+1}/{self.max_retries}")
                    
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"Failed to collect messages after {self.max_retries} attempts")
                        return []
                except Exception as e:
                    logger.error(f"Error collecting messages (attempt {attempt+1}/{self.max_retries}): {str(e)}")
                    
                    if attempt < self.max_retries - 1:
                        await asyncio.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff
                    else:
                        logger.error(f"Failed to collect messages after {self.max_retries} attempts")
                        return []
            
            return []
        except Exception as e:
            logger.error(f"Error getting messages from {channel_username}: {str(e)}")
            return [] 