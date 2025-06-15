"""
Supabase client for Telegram collector Lambda function
"""
import os
import json
from typing import Dict, Any, Optional
from supabase import create_client, Client

from src.utils.logging import get_logger

logger = get_logger(__name__)

class SupabaseClient:
    """Client for interacting with Supabase database"""
    
    def __init__(self):
        self.url = os.environ.get('SUPABASE_URL')
        self.key = os.environ.get('SUPABASE_KEY')
        
        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")
        
        # Clean URL - remove whitespace and ensure proper format
        self.url = self.url.strip()
        self.key = self.key.strip()
        
        if not self.url.startswith('https://'):
            raise ValueError(f"SUPABASE_URL must start with https://, got: {self.url}")
        
        self.client: Client = create_client(self.url, self.key)
        logger.info("Supabase client initialized successfully")
    
    def update_episode_status(self, episode_id: str, status: str, podcast_id: Optional[str] = None) -> bool:
        """
        Update episode status using RPC function to bypass RLS, creating the episode if it doesn't exist
        
        Args:
            episode_id: The episode ID
            status: New status to set
            podcast_id: The podcast ID (required if episode needs to be created)
            
        Returns:
            True if successful, False otherwise
            
        Raises:
            ValueError: If required parameters are missing or invalid
            Exception: If database operation fails
        """
        try:
            # Validate inputs
            if not episode_id or not episode_id.strip():
                error_msg = "Episode ID is empty or None"
                logger.error(error_msg)
                raise ValueError(error_msg)
                
            if not status or not status.strip():
                error_msg = "Status is empty or None"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            episode_id = episode_id.strip()
            status = status.strip()
            
            logger.info(f"Attempting to update episode {episode_id} status to: {status}")
            
            # First, check if the episode exists
            check_result = self.client.table('episodes').select('id, status, podcast_id').eq('id', episode_id).execute()
            
            if not check_result.data:
                logger.warning(f"Episode {episode_id} not found in database")
                
                # Try to create the episode if podcast_id is provided
                if podcast_id:
                    logger.info(f"Attempting to create episode {episode_id} for podcast {podcast_id}")
                    if self._create_episode_if_missing(episode_id, podcast_id, status):
                        logger.info(f"Successfully created episode {episode_id} with status {status}")
                        return True
                    else:
                        error_msg = f"Failed to create episode {episode_id} for podcast {podcast_id}"
                        logger.error(error_msg)
                        raise Exception(error_msg)
                else:
                    error_msg = f"Cannot create episode {episode_id} - podcast_id not provided and episode doesn't exist"
                    logger.error(error_msg)
                    raise ValueError(error_msg)
            
            current_episode = check_result.data[0]
            logger.info(f"Found episode {episode_id} with current status: {current_episode.get('status')}")
            
            # Use RPC function to update status (bypasses RLS)
            result = self.client.rpc(
                "update_episode_status", 
                {"episode_id": episode_id, "new_status": status}
            ).execute()
            
            # Check the result
            if result.data and result.data.get('success', False):
                logger.info(f"Successfully updated episode {episode_id} status to: {status}")
                logger.debug(f"Update result: {result.data}")
                return True
            else:
                error = result.data.get('error') if result.data else "Unknown error"
                error_msg = f"Update failed for episode {episode_id}: {error}"
                logger.error(error_msg)
                logger.error(f"Full result: {result}")
                raise Exception(error_msg)
                
        except ValueError as ve:
            # Re-raise validation errors
            raise ve
        except Exception as e:
            error_msg = f"Database error updating episode {episode_id} status to {status}: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Exception details: {repr(e)}")
            raise Exception(error_msg) from e
    
    def _create_episode_if_missing(self, episode_id: str, podcast_id: str, status: str) -> bool:
        """
        Create an episode record if it doesn't exist
        
        Args:
            episode_id: The episode ID
            podcast_id: The podcast ID
            status: Initial status to set
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Create episode data
            episode_data = {
                'id': episode_id,
                'podcast_id': podcast_id,
                'title': f'Episode {self._get_current_timestamp()[:10]}',  # Use date as title
                'description': 'Generated from Telegram content',
                'audio_url': '',  # Will be set later by audio generation
                'status': status,
                'duration': 0,
                'language': 'english',  # Default language
                'created_at': self._get_current_timestamp(),
                'updated_at': self._get_current_timestamp()
            }
            
            result = self.client.table('episodes').insert(episode_data).execute()
            
            if hasattr(result, 'data') and result.data:
                logger.info(f"Successfully created episode {episode_id} for podcast {podcast_id}")
                return True
            else:
                logger.error(f"Failed to create episode {episode_id} - no data returned")
                logger.error(f"Create result: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Exception creating episode {episode_id}: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.error(f"Exception details: {repr(e)}")
            return False
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z' 