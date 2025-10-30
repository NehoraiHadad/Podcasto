"""
Supabase client for Lambda audio generation function
"""
import os
from typing import Dict, Any, Optional, List
from supabase import create_client, Client

from shared.utils.logging import get_logger

logger = get_logger(__name__)

class SupabaseClient:
    """Client for interacting with Supabase database"""

    def __init__(self):
        self.url = os.environ.get('SUPABASE_URL')
        self.key = os.environ.get('SUPABASE_SERVICE_KEY')

        # Debug logging
        logger.info(f"[SUPABASE] URL: '{self.url}' (length: {len(self.url) if self.url else 'None'})")
        logger.info(f"[SUPABASE] Key: '{self.key[:20] if self.key else 'None'}...' (length: {len(self.key) if self.key else 'None'})")

        if not self.url or not self.key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required")

        # Clean URL - remove whitespace and ensure proper format
        self.url = self.url.strip()
        self.key = self.key.strip()

        if not self.url.startswith('https://'):
            raise ValueError(f"SUPABASE_URL must start with https://, got: {self.url}")

        self.client: Client = create_client(self.url, self.key)

    def get_episode(self, episode_id: str) -> Optional[Dict[str, Any]]:
        """
        Get episode by ID

        Args:
            episode_id: The episode ID

        Returns:
            Episode data or None if not found
        """
        try:
            result = self.client.table('episodes').select('*').eq('id', episode_id).execute()

            if result.data and len(result.data) > 0:
                episode = result.data[0]
                logger.info(f"[SUPABASE] Found episode: {episode_id}")
                return episode
            else:
                logger.warning(f"[SUPABASE] Episode not found: {episode_id}")
                return None

        except Exception as e:
            logger.error(f"[SUPABASE] Error getting episode {episode_id}: {e}")
            return None

    def get_podcast(self, podcast_id: str) -> Optional[Dict[str, Any]]:
        """
        Get podcast by ID

        Args:
            podcast_id: The podcast ID

        Returns:
            Podcast data or None if not found
        """
        try:
            result = self.client.table('podcasts').select('*').eq('id', podcast_id).execute()

            if result.data and len(result.data) > 0:
                podcast = result.data[0]
                logger.info(f"[SUPABASE] Found podcast: {podcast_id}")
                return podcast
            else:
                logger.warning(f"[SUPABASE] Podcast not found: {podcast_id}")
                return None

        except Exception as e:
            logger.error(f"[SUPABASE] Error getting podcast {podcast_id}: {e}")
            return None

    def get_podcast_config(self, podcast_id: str) -> Optional[Dict[str, Any]]:
        """
        Get podcast configuration by podcast ID using RPC function to bypass RLS

        Args:
            podcast_id: The podcast ID

        Returns:
            Podcast config data or None if not found
        """
        try:
            result = self.client.rpc(
                "get_podcast_config_by_podcast_id",
                {"p_podcast_id": podcast_id}
            ).execute()

            if result.data and result.data.get('success', False):
                config = result.data.get('data')
                logger.info(f"[SUPABASE] Found podcast config for: {podcast_id}")
                return config
            else:
                error = result.data.get('error') if result.data else "Unknown error"
                logger.warning(f"[SUPABASE] Podcast config not found for: {podcast_id}, error: {error}")
                return None

        except Exception as e:
            logger.error(f"[SUPABASE] Error getting podcast config for {podcast_id}: {e}")
            return None

    def get_podcast_config_by_id(self, config_id: str) -> Optional[Dict[str, Any]]:
        """
        Get podcast configuration by config ID using RPC function to bypass RLS

        Args:
            config_id: The podcast config ID

        Returns:
            Podcast config data or None if not found
        """
        try:
            result = self.client.rpc(
                "get_podcast_config_by_id",
                {"config_id": config_id}
            ).execute()

            if result.data and result.data.get('success', False):
                config = result.data.get('data')
                logger.info(f"[SUPABASE] Found podcast config by ID: {config_id}")
                return config
            else:
                error = result.data.get('error') if result.data else "Unknown error"
                logger.warning(f"[SUPABASE] Podcast config not found by ID: {config_id}, error: {error}")
                return None

        except Exception as e:
            logger.error(f"[SUPABASE] Error getting podcast config by ID {config_id}: {e}")
            return None

    def update_podcast_config(self, podcast_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update podcast configuration by podcast ID.

        Args:
            podcast_id: The podcast ID
            update_data: Data to update

        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.client.table('podcast_configs').update(update_data).eq('podcast_id', podcast_id).execute()

            if result.data and len(result.data) > 0:
                logger.info(f"[SUPABASE] Updated podcast config for: {podcast_id}")
                return True
            else:
                # Supabase update returns an empty list on success with RLS, check for error in response
                if result.error:
                     logger.error(f"[SUPABASE] Failed to update podcast config for {podcast_id}: {result.error}")
                     return False
                logger.info(f"[SUPABASE] Podcast config update call for {podcast_id} completed.")
                return True


        except Exception as e:
            logger.error(f"[SUPABASE] Error updating podcast config for {podcast_id}: {e}")
            return False


    def update_episode(self, episode_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update episode with new data using RPC functions to bypass RLS

        Args:
            episode_id: The episode ID
            update_data: Data to update

        Returns:
            True if successful, False otherwise
        """
        try:
            # Handle different update scenarios using appropriate RPC functions
            if 'audio_url' in update_data and 'status' in update_data:
                # Use update_episode_audio_url RPC function for audio-related updates
                result = self.client.rpc(
                    "update_episode_audio_url",
                    {
                        "episode_id": episode_id,
                        "audio_url": update_data.get('audio_url', ''),
                        "new_status": update_data.get('status', 'completed'),
                        "duration": update_data.get('duration', 0)
                    }
                ).execute()

                if result.data and result.data.get('success', False):
                    logger.info(f"[SUPABASE] Updated episode {episode_id} with audio URL: {list(update_data.keys())}")
                    return True
                else:
                    error = result.data.get('error') if result.data else "Unknown error"
                    logger.error(f"[SUPABASE] Failed to update episode {episode_id} with audio URL: {error}")
                    return False

            elif 'script_url' in update_data and 'status' in update_data:
                # Use update_episode_script_data RPC function for script-related updates
                result = self.client.rpc(
                    "update_episode_script_data",
                    {
                        "episode_id": episode_id,
                        "script_url": update_data.get('script_url', ''),
                        "new_status": update_data.get('status', 'script_ready'),
                        "analysis_data": update_data.get('analysis')
                    }
                ).execute()

                if result.data and result.data.get('success', False):
                    logger.info(f"[SUPABASE] Updated episode {episode_id} with script URL: {list(update_data.keys())}")
                    return True
                else:
                    error = result.data.get('error') if result.data else "Unknown error"
                    logger.error(f"[SUPABASE] Failed to update episode {episode_id} with script URL: {error}")
                    return False

            elif 'status' in update_data:
                # Use update_episode_status RPC function for status-only updates
                result = self.client.rpc(
                    "update_episode_status",
                    {
                        "episode_id": episode_id,
                        "new_status": update_data['status']
                    }
                ).execute()

                if result.data and result.data.get('success', False):
                    logger.info(f"[SUPABASE] Updated episode {episode_id} status: {update_data['status']}")
                    return True
                else:
                    error = result.data.get('error') if result.data else "Unknown error"
                    logger.error(f"[SUPABASE] Failed to update episode {episode_id} status: {error}")
                    return False
            else:
                # For other updates, we'll need to use direct table update
                # This might fail due to RLS, but we'll log it clearly
                logger.warning(f"[SUPABASE] Using direct table update for episode {episode_id} - may fail due to RLS")
                result = self.client.table('episodes').update(update_data).eq('id', episode_id).execute()

                if result.data:
                    logger.info(f"[SUPABASE] Updated episode {episode_id}: {list(update_data.keys())}")
                    return True
                else:
                    logger.error(f"[SUPABASE] Failed to update episode {episode_id} - likely RLS permission issue")
                    return False

        except Exception as e:
            logger.error(f"[SUPABASE] Error updating episode {episode_id}: {e}")
            return False

    def get_episodes_by_status(self, statuses: List[str]) -> List[Dict[str, Any]]:
        """
        Get episodes by status

        Args:
            statuses: List of statuses to filter by

        Returns:
            List of episodes
        """
        try:
            result = self.client.table('episodes').select('*').in_('status', statuses).order('created_at', desc=True).execute()

            episodes = result.data or []
            logger.info(f"[SUPABASE] Found {len(episodes)} episodes with statuses: {statuses}")
            return episodes

        except Exception as e:
            logger.error(f"[SUPABASE] Error getting episodes by status {statuses}: {e}")
            return []

    def mark_episode_failed(self, episode_id: str, error_message: str) -> bool:
        """
        Mark episode as failed with error message using RPC function to bypass RLS

        Args:
            episode_id: The episode ID
            error_message: Error message to store

        Returns:
            True if successful, False otherwise
        """
        try:
            # Use mark_episode_failed RPC function which stores error in metadata
            result = self.client.rpc(
                "mark_episode_failed",
                {
                    "episode_id": episode_id,
                    "error_message": error_message
                }
            ).execute()

            if result.data and result.data.get('success', False):
                logger.info(f"[SUPABASE] Successfully marked episode {episode_id} as failed")
                return True
            else:
                error = result.data.get('error') if result.data else "Unknown error"
                logger.error(f"[SUPABASE] Failed to mark episode {episode_id} as failed: {error}")
                return False

        except Exception as e:
            logger.error(f"[SUPABASE] Error marking episode {episode_id} as failed: {e}")
            return False

    def update_episode_status(self, episode_id: str, status: str, podcast_id: Optional[str] = None) -> bool:
        """
        Update episode status using RPC function to bypass RLS

        Args:
            episode_id: The episode ID
            status: New status to set
            podcast_id: The podcast ID (not used, kept for backward compatibility)

        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"[SUPABASE] Updating episode {episode_id} status to: {status}")

            result = self.client.rpc(
                "update_episode_status",
                {
                    "episode_id": episode_id,
                    "new_status": status
                }
            ).execute()

            if result.data and result.data.get('success', False):
                logger.info(f"[SUPABASE] Successfully updated episode {episode_id} status to: {status}")
                return True
            else:
                error = result.data.get('error') if result.data else "Unknown error"
                logger.error(f"[SUPABASE] Failed to update episode {episode_id} status: {error}")
                return False

        except Exception as e:
            logger.error(f"[SUPABASE] Error updating episode {episode_id} status to {status}: {e}")
            return False

    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from shared.utils.datetime_utils import now_utc, to_iso_utc
        return to_iso_utc(now_utc())
