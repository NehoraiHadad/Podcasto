"""
Supabase client for the Podcastfy Lambda function.
"""
import os
import logging
from typing import Dict, Any, Optional
from supabase import create_client, Client

# Set up logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

class SupabaseClient:
    """Client for interacting with Supabase"""
    
    def __init__(self):
        """Initialize the Supabase client with environment variables"""
        self.supabase_url = os.environ.get('SUPABASE_URL', '')
        self.supabase_key = os.environ.get('SUPABASE_KEY', '')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        
        try:
            self.client = create_client(self.supabase_url, self.supabase_key)
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            raise
    
    def get_podcast_config(self, podcast_id: str, request_id: str = None) -> Dict[str, Any]:
        """Get a podcast configuration by ID"""
        try:
            logger.info(f"Getting podcast config for ID: {podcast_id}")
            
            # Make sure we're using a properly formatted query
            response = self.client.table("podcast_configs").select("*").eq("id", podcast_id).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"Found podcast config for ID: {podcast_id}")
                return {"success": True, "config": response.data[0]}
            
            # If not found by ID, log the failure and return error
            logger.error(f"Podcast config not found for ID: {podcast_id}")
            return {"success": False, "error": f"Podcast config not found for ID: {podcast_id}"}
        except Exception as e:
            logger.error(f"Error getting podcast config: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_podcast_config_flexible(self, id_value: str, request_id: str = None) -> Dict[str, Any]:
        """
        Get a podcast configuration by either podcast_id or podcast_config_id
        using the custom database function get_podcast_config.
        
        This helps solve the admin-user-id-1 error by providing more flexibility
        in how podcast configs can be retrieved.
        
        Args:
            id_value: Either a podcast_id or podcast_config_id
            request_id: Optional request ID for tracing
            
        Returns:
            Dictionary with success flag and config data or error message
        """
        try:
            logger.info(f"Getting podcast config using flexible lookup for ID: {id_value}")
            
            # Call the PostgreSQL function we created
            response = self.client.rpc(
                "get_podcast_config", 
                {"input_id": id_value}
            ).execute()
            
            if response.data:
                logger.info(f"Found podcast config for ID: {id_value}")
                return {"success": True, "config": response.data}
            
            # If not found, return error
            logger.error(f"Podcast config not found for ID: {id_value}")
            return {"success": False, "error": f"Podcast config not found for ID: {id_value}"}
            
        except Exception as e:
            logger.error(f"Error getting podcast config with flexible lookup: {str(e)}")
            return {"success": False, "error": str(e)}
    
    def get_episode(self, episode_id: str) -> Dict[str, Any]:
        """Get an episode by ID"""
        try:
            response = self.client.table("episodes").select("*") \
                .eq("id", episode_id) \
                .execute()
            
            if response.data:
                return {"success": True, "episode": response.data[0]}
            return {"success": False, "error": "Episode not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_episode(self, episode_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an episode with the given data"""
        try:
            self.client.table("episodes").update(update_data) \
                .eq("id", episode_id) \
                .execute()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_episode_status(self, episode_id: str, status: str) -> Dict[str, Any]:
        """Update the status of an episode"""
        return self.update_episode(episode_id, {"status": status})
    
    def update_episode_audio_url(self, episode_id: str, audio_url: str, status: str = 'completed', duration: int = 0) -> Dict[str, Any]:
        """Update the audio URL, status, and duration of an episode"""
        return self.update_episode(episode_id, {
            "audio_url": audio_url,
            "status": status,
            "duration": duration
        })
    
    def mark_episode_failed(self, episode_id: str, error_message: str) -> Dict[str, Any]:
        """Mark an episode as failed with an error message"""
        return self.update_episode(episode_id, {"status": "failed", "error": error_message})
    
    def close_session(self):
        """Close any resources - not needed with the official client"""
        pass 