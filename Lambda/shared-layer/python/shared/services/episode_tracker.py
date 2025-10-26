"""
Episode Processing Tracker Service
Tracks episode processing stages across Lambda functions
Provides visibility into where and why episode processing fails
"""
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from enum import Enum

from shared.clients.supabase_client import SupabaseClient
from shared.utils.logging import get_logger
from shared.utils.datetime_utils import now_utc, to_iso_utc

logger = get_logger(__name__)


class ProcessingStage(str, Enum):
    """All possible processing stages an episode can go through"""
    CREATED = 'created'
    TELEGRAM_QUEUED = 'telegram_queued'
    TELEGRAM_PROCESSING = 'telegram_processing'
    TELEGRAM_COMPLETED = 'telegram_completed'
    TELEGRAM_FAILED = 'telegram_failed'
    SCRIPT_QUEUED = 'script_queued'
    SCRIPT_PROCESSING = 'script_processing'
    SCRIPT_COMPLETED = 'script_completed'
    SCRIPT_FAILED = 'script_failed'
    AUDIO_QUEUED = 'audio_queued'
    AUDIO_PROCESSING = 'audio_processing'
    AUDIO_COMPLETED = 'audio_completed'
    AUDIO_FAILED = 'audio_failed'
    IMAGE_PROCESSING = 'image_processing'
    IMAGE_FAILED = 'image_failed'
    POST_PROCESSING = 'post_processing'
    PUBLISHED = 'published'
    FAILED = 'failed'


class StageStatus(str, Enum):
    """Status of a processing stage"""
    STARTED = 'started'
    COMPLETED = 'completed'
    FAILED = 'failed'


class EpisodeTracker:
    """Tracks episode processing through various stages"""

    def __init__(self, supabase_client: Optional[SupabaseClient] = None):
        """Initialize tracker with Supabase client"""
        self.supabase = supabase_client or SupabaseClient()
        self._stage_start_times: Dict[str, datetime] = {}

    def log_stage_start(
        self,
        episode_id: str,
        stage: ProcessingStage,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Log the start of a processing stage

        Args:
            episode_id: Episode UUID
            stage: Processing stage being started
            metadata: Additional metadata (Lambda request ID, SQS message ID, etc.)

        Returns:
            True if logged successfully, False otherwise
        """
        try:
            now = now_utc()
            self._stage_start_times[f"{episode_id}:{stage}"] = now

            # Insert processing log
            log_entry = {
                'episode_id': episode_id,
                'stage': stage.value,
                'status': StageStatus.STARTED.value,
                'started_at': to_iso_utc(now),
                'metadata': metadata or {},
                'created_at': to_iso_utc(now)
            }

            result = self.supabase.client.table('episode_processing_logs').insert(log_entry).execute()

            if not result.data:
                logger.error(f"[TRACKER] Failed to insert processing log for {episode_id} stage {stage}")
                return False

            # Update episode current_stage and processing_started_at
            episode_update = {
                'current_stage': stage.value,
                'last_stage_update': to_iso_utc(now)
            }

            # Set processing_started_at only on first stage
            if stage == ProcessingStage.TELEGRAM_QUEUED or stage == ProcessingStage.CREATED:
                episode_update['processing_started_at'] = to_iso_utc(now)

            self.supabase.client.table('episodes').update(episode_update).eq('id', episode_id).execute()

            logger.info(f"[TRACKER] Started stage {stage} for episode {episode_id}")
            return True

        except Exception as e:
            logger.error(f"[TRACKER] Error logging stage start: {str(e)}")
            return False

    def log_stage_complete(
        self,
        episode_id: str,
        stage: ProcessingStage,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Log the completion of a processing stage

        Args:
            episode_id: Episode UUID
            stage: Processing stage that completed
            metadata: Additional metadata

        Returns:
            True if logged successfully, False otherwise
        """
        try:
            now = now_utc()

            # Calculate duration if we have a start time
            start_key = f"{episode_id}:{stage}"
            duration_ms = None
            if start_key in self._stage_start_times:
                duration_ms = int((now - self._stage_start_times[start_key]).total_seconds() * 1000)
                del self._stage_start_times[start_key]

            # Update the most recent log entry for this stage
            # Find the latest started log for this episode and stage
            existing_logs = self.supabase.client.table('episode_processing_logs')\
                .select('id')\
                .eq('episode_id', episode_id)\
                .eq('stage', stage.value)\
                .eq('status', StageStatus.STARTED.value)\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()

            if existing_logs.data and len(existing_logs.data) > 0:
                log_id = existing_logs.data[0]['id']
                update_data = {
                    'status': StageStatus.COMPLETED.value,
                    'completed_at': to_iso_utc(now),
                    'duration_ms': duration_ms
                }
                if metadata:
                    update_data['metadata'] = metadata

                self.supabase.client.table('episode_processing_logs')\
                    .update(update_data)\
                    .eq('id', log_id)\
                    .execute()
            else:
                # No started log found, create a completed log
                log_entry = {
                    'episode_id': episode_id,
                    'stage': stage.value,
                    'status': StageStatus.COMPLETED.value,
                    'completed_at': to_iso_utc(now),
                    'duration_ms': duration_ms,
                    'metadata': metadata or {},
                    'created_at': to_iso_utc(now)
                }
                self.supabase.client.table('episode_processing_logs').insert(log_entry).execute()

            # Add to stage_history
            self._add_to_stage_history(episode_id, stage.value, StageStatus.COMPLETED.value, duration_ms)

            # Update episode
            episode_update = {
                'current_stage': stage.value,
                'last_stage_update': to_iso_utc(now)
            }
            self.supabase.client.table('episodes').update(episode_update).eq('id', episode_id).execute()

            logger.info(f"[TRACKER] Completed stage {stage} for episode {episode_id} in {duration_ms}ms")
            return True

        except Exception as e:
            logger.error(f"[TRACKER] Error logging stage completion: {str(e)}")
            return False

    def log_stage_failure(
        self,
        episode_id: str,
        stage: ProcessingStage,
        error: Exception,
        error_details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Log the failure of a processing stage

        Args:
            episode_id: Episode UUID
            stage: Processing stage that failed
            error: The exception that caused the failure
            error_details: Additional error context (stack trace, retry count, etc.)

        Returns:
            True if logged successfully, False otherwise
        """
        try:
            now = now_utc()

            # Calculate duration if we have a start time
            start_key = f"{episode_id}:{stage}"
            duration_ms = None
            if start_key in self._stage_start_times:
                duration_ms = int((now - self._stage_start_times[start_key]).total_seconds() * 1000)
                del self._stage_start_times[start_key]

            error_message = str(error)

            # Build error_details
            details = error_details or {}
            if not details.get('error_type'):
                details['error_type'] = type(error).__name__

            # Update the most recent started log for this stage
            existing_logs = self.supabase.client.table('episode_processing_logs')\
                .select('id')\
                .eq('episode_id', episode_id)\
                .eq('stage', stage.value)\
                .eq('status', StageStatus.STARTED.value)\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()

            if existing_logs.data and len(existing_logs.data) > 0:
                log_id = existing_logs.data[0]['id']
                self.supabase.client.table('episode_processing_logs')\
                    .update({
                        'status': StageStatus.FAILED.value,
                        'error_message': error_message,
                        'error_details': details,
                        'completed_at': to_iso_utc(now),
                        'duration_ms': duration_ms
                    })\
                    .eq('id', log_id)\
                    .execute()
            else:
                # No started log found, create a failed log
                log_entry = {
                    'episode_id': episode_id,
                    'stage': stage.value,
                    'status': StageStatus.FAILED.value,
                    'error_message': error_message,
                    'error_details': details,
                    'completed_at': to_iso_utc(now),
                    'duration_ms': duration_ms,
                    'created_at': to_iso_utc(now)
                }
                self.supabase.client.table('episode_processing_logs').insert(log_entry).execute()

            # Add to stage_history
            self._add_to_stage_history(episode_id, stage.value, StageStatus.FAILED.value, duration_ms)

            # Determine failed stage variant (telegram_failed, script_failed, audio_failed)
            failed_stage = self._get_failed_stage_variant(stage)

            # Update episode status to failed
            episode_update = {
                'status': 'failed',
                'current_stage': failed_stage,
                'last_stage_update': now.isoformat()
            }
            self.supabase.client.table('episodes').update(episode_update).eq('id', episode_id).execute()

            logger.error(f"[TRACKER] Failed stage {stage} for episode {episode_id}: {error_message}")
            return True

        except Exception as e:
            logger.error(f"[TRACKER] Error logging stage failure: {str(e)}")
            return False

    def _add_to_stage_history(
        self,
        episode_id: str,
        stage: str,
        status: str,
        duration_ms: Optional[int] = None
    ) -> None:
        """Add an entry to episode's stage_history array"""
        try:
            # Fetch current stage_history
            episode = self.supabase.client.table('episodes')\
                .select('stage_history')\
                .eq('id', episode_id)\
                .single()\
                .execute()

            stage_history = episode.data.get('stage_history', []) if episode.data else []
            if not isinstance(stage_history, list):
                stage_history = []

            # Add new entry
            history_entry = {
                'stage': stage,
                'status': status,
                'timestamp': to_iso_utc(now_utc())
            }
            if duration_ms is not None:
                history_entry['duration_ms'] = duration_ms

            stage_history.append(history_entry)

            # Update
            self.supabase.client.table('episodes')\
                .update({'stage_history': stage_history})\
                .eq('id', episode_id)\
                .execute()

        except Exception as e:
            logger.warning(f"[TRACKER] Could not update stage_history: {str(e)}")

    def _get_failed_stage_variant(self, stage: ProcessingStage) -> str:
        """Map a processing stage to its failure variant"""
        stage_mapping = {
            ProcessingStage.TELEGRAM_QUEUED: ProcessingStage.TELEGRAM_FAILED.value,
            ProcessingStage.TELEGRAM_PROCESSING: ProcessingStage.TELEGRAM_FAILED.value,
            ProcessingStage.SCRIPT_QUEUED: ProcessingStage.SCRIPT_FAILED.value,
            ProcessingStage.SCRIPT_PROCESSING: ProcessingStage.SCRIPT_FAILED.value,
            ProcessingStage.AUDIO_QUEUED: ProcessingStage.AUDIO_FAILED.value,
            ProcessingStage.AUDIO_PROCESSING: ProcessingStage.AUDIO_FAILED.value,
            ProcessingStage.IMAGE_PROCESSING: ProcessingStage.IMAGE_FAILED.value,
        }
        return stage_mapping.get(stage, ProcessingStage.FAILED.value)
