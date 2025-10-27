"""
Audio Generation Lambda Handler
Processes SQS messages to generate podcast audio using Google TTS
Updated: 2025-10-27 - Added DeferrableError handling for smart retry
"""
import json
import os
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from shared.clients.supabase_client import SupabaseClient
from shared.clients.s3_client import S3Client
from shared.services.google_podcast_generator import GooglePodcastGenerator
from shared.services.hebrew_niqqud import HebrewNiqqudProcessor
from shared.services.episode_tracker import EpisodeTracker, ProcessingStage
from shared.services.tts_client import DeferrableError
from shared.utils.logging import get_logger
from shared.utils.datetime_utils import now_utc, to_iso_utc

logger = get_logger(__name__)

# Global handler instance for Lambda reuse
handler_instance = None

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """AWS Lambda handler entry point"""
    global handler_instance
    if handler_instance is None:
        handler_instance = AudioGenerationHandler()
    
    return handler_instance.process_event(event, context)

class AudioGenerationHandler:
    """Main handler for audio generation Lambda function"""
    
    def __init__(self):
        """Initialize handler with required clients and services"""
        self.supabase_client = SupabaseClient()
        self.s3_client = S3Client()
        self.tracker = EpisodeTracker(self.supabase_client)

        # Get API keys from environment
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
    def process_event(self, event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """
        Process SQS event containing episode generation requests

        Uses ReportBatchItemFailures pattern for partial batch success.
        Deferred episodes return to SQS for retry, successful ones are deleted.
        """
        logger.info(f"[AUDIO_GEN] Lambda invoked with event: {json.dumps(event, default=str)}")

        results = []
        batch_item_failures = []
        records = event.get('Records', [])

        for record in records:
            message_id = record.get('messageId', 'unknown')

            try:
                message_body = record.get('body', '{}')
                message = json.loads(message_body)

                logger.info(f"[AUDIO_GEN] Processing message {message_id}: {message}")

                if not self.should_process_for_audio(message):
                    logger.info(f"[AUDIO_GEN] Message {message_id} not relevant for audio generation, skipping")
                    results.append({
                        'status': 'skipped',
                        'message_id': message_id,
                        'reason': 'Not an audio generation request'
                    })
                    continue

                result = self.process_audio_generation_request(message, message_id, context)
                result['message_id'] = message_id
                results.append(result)

                # If deferred, add to batch failures so SQS retries the message
                if result.get('status') == 'deferred':
                    batch_item_failures.append({'itemIdentifier': message_id})
                    logger.info(f"[AUDIO_GEN] Message {message_id} deferred - will return to SQS for retry")

            except Exception as e:
                logger.error(f"[AUDIO_GEN] Error processing record: {str(e)}")
                results.append({
                    'status': 'error',
                    'message_id': message_id,
                    'error': str(e)
                })
                # Add to batch failures for retry
                batch_item_failures.append({'itemIdentifier': message_id})

        logger.info(f"[AUDIO_GEN] Processed {len(records)} messages, results: {results}")
        logger.info(f"[AUDIO_GEN] Batch item failures (for retry): {len(batch_item_failures)} messages")

        # Return response with ReportBatchItemFailures pattern
        return {
            'batchItemFailures': batch_item_failures
        }
    
    def should_process_for_audio(self, message: Dict[str, Any]) -> bool:
        """Determine if this SQS message should trigger audio generation"""
        episode_id = message.get('episode_id')
        podcast_id = message.get('podcast_id')
        
        if not episode_id or not podcast_id:
            logger.debug(f"[AUDIO_GEN] Missing episode_id or podcast_id, skipping")
            return False
        
        try:
            episode = self.supabase_client.get_episode(episode_id)
            if not episode:
                logger.debug(f"[AUDIO_GEN] Episode {episode_id} not found in database")
                return False
            
            episode_status = episode.get('status')
            has_audio = episode.get('audio_url')

            if episode_status == 'script_ready' and not has_audio:
                logger.info(f"[AUDIO_GEN] Episode {episode_id} is ready for audio generation")
                return True
            else:
                logger.debug(f"[AUDIO_GEN] Episode {episode_id} status: {episode_status}, has_audio: {bool(has_audio)}")
                return False
                
        except Exception as e:
            logger.error(f"[AUDIO_GEN] Error checking episode status: {str(e)}")
            return False

    def process_audio_generation_request(self, message: Dict[str, Any], request_id: str, context: Any) -> Dict[str, Any]:
        """Process individual audio generation request with timeout detection"""
        episode_id = None

        try:
            episode_id = message.get('episode_id')
            podcast_id = message.get('podcast_id')
            podcast_config_id = message.get('podcast_config_id')

            # TIMEOUT DETECTION: Check remaining time at start
            remaining_time_ms = context.get_remaining_time_in_millis()
            # TTS timeout per chunk: 480s (8 minutes)
            # Need time for: setup + at least 1 chunk + safety buffer
            # Minimum: 480s + 60s setup + 60s buffer = 600s = 600000ms
            MIN_TIME_REQUIRED_MS = 600000  # 10 minutes minimum to start processing

            logger.info(f"[AUDIO_GEN] [{request_id}] Remaining time: {remaining_time_ms}ms ({remaining_time_ms/1000:.0f}s)")
            logger.info(f"[AUDIO_GEN] [{request_id}] Required minimum: {MIN_TIME_REQUIRED_MS}ms ({MIN_TIME_REQUIRED_MS/1000:.0f}s)")

            if remaining_time_ms < MIN_TIME_REQUIRED_MS:
                error_msg = f"Insufficient time remaining to process episode ({remaining_time_ms/1000:.0f}s < {MIN_TIME_REQUIRED_MS/1000:.0f}s required). Deferring to prevent timeout."
                logger.error(f"[AUDIO_GEN] [{request_id}] {error_msg}")
                # Use DeferrableError instead of TimeoutError so episode returns to script_ready
                raise DeferrableError(error_msg)

            logger.info(f"[AUDIO_GEN] [{request_id}] Processing audio generation for episode {episode_id}")

            # Log start of audio processing stage
            self.tracker.log_stage_start(
                episode_id,
                ProcessingStage.AUDIO_PROCESSING,
                {
                    'request_id': request_id,
                    'podcast_id': podcast_id,
                    'podcast_config_id': podcast_config_id
                }
            )

            self.update_episode_status(episode_id, 'processing')
            
            # Get episode and podcast configuration
            episode = self.supabase_client.get_episode(episode_id)
            if not episode:
                raise ValueError(f"Episode {episode_id} not found")
            
            podcast_config = self._get_podcast_config(podcast_config_id, podcast_id, request_id)

            # Get script_url and dynamic_config from message (required, preprocessed by script-preprocessor)
            script_url = message.get('script_url')
            if not script_url:
                raise ValueError("script_url is required - must be preprocessed by script-preprocessor Lambda")

            dynamic_config = message.get('dynamic_config')
            if not dynamic_config:
                raise ValueError("dynamic_config is required - must be preprocessed by script-preprocessor Lambda")

            logger.info(f"[AUDIO_GEN] [{request_id}] Reading pre-generated script from S3: {script_url}")
            script = self.s3_client.read_from_url(script_url)
            logger.info(f"[AUDIO_GEN] [{request_id}] Script loaded from S3: {len(script)} characters")
            logger.info(f"[AUDIO_GEN] [{request_id}] Using dynamic_config with speaker2_role: {dynamic_config.get('speaker2_role')}")

            # Process Hebrew script with niqqud if needed
            processed_script, niqqud_script = self._process_hebrew_script(
                script, dynamic_config.get('language', 'en'), request_id
            )

            # TIMEOUT DETECTION: Check remaining time before expensive audio generation
            remaining_time_ms = context.get_remaining_time_in_millis()
            # Need at least one full chunk timeout (480s) + safety buffer (60s)
            MIN_TIME_FOR_AUDIO_MS = 540000  # 9 minutes minimum for audio generation

            logger.info(f"[AUDIO_GEN] [{request_id}] Before audio generation - remaining time: {remaining_time_ms/1000:.0f}s (required: {MIN_TIME_FOR_AUDIO_MS/1000:.0f}s)")

            if remaining_time_ms < MIN_TIME_FOR_AUDIO_MS:
                error_msg = f"Insufficient time for audio generation ({remaining_time_ms/1000:.0f}s < {MIN_TIME_FOR_AUDIO_MS/1000:.0f}s required). Deferring to prevent timeout."
                logger.error(f"[AUDIO_GEN] [{request_id}] {error_msg}")
                # Use DeferrableError instead of TimeoutError so episode returns to script_ready
                raise DeferrableError(error_msg)

            # Generate audio using processed script
            # If we got a niqqud script, it means the text was pre-processed
            is_pre_processed = niqqud_script is not None
            audio_data, duration = self._generate_audio(
                processed_script, dynamic_config, request_id, episode_id, is_pre_processed
            )
            
            # Upload both original and niqqud scripts as transcripts to S3
            self._upload_script_as_transcript(
                episode_id, podcast_id, script, niqqud_script, 
                dynamic_config.get('language', 'en'), request_id
            )
            
            # Upload and update
            audio_url = self.s3_client.upload_audio(
                audio_data, podcast_id, episode_id, 'wav'
            )
            
            self._update_episode_with_audio(episode_id, audio_url, audio_data, duration, episode)

            logger.info(f"[AUDIO_GEN] [{request_id}] Successfully generated audio for episode {episode_id}")

            # Log successful completion of audio processing stage
            self.tracker.log_stage_complete(
                episode_id,
                ProcessingStage.AUDIO_PROCESSING,
                {
                    'audio_url': audio_url,
                    'duration': duration,
                    'audio_size_bytes': len(audio_data),
                    'has_niqqud': niqqud_script is not None
                }
            )

            # Get content analysis from dynamic_config (preprocessed by script-preprocessor)
            content_info = dynamic_config.get('content_analysis', {})

            return {
                'status': 'success',
                'episode_id': episode_id,
                'audio_url': audio_url,
                'duration': duration,
                'content_type': content_info.get('content_type', 'general'),
                'speaker2_role': dynamic_config.get('speaker2_role', 'Speaker 2'),
                'role_description': content_info.get('role_description', ''),
                'confidence': content_info.get('confidence', 0.0),
                'has_niqqud': niqqud_script is not None
            }

        except DeferrableError as de:
            # Timeout or rate limit - defer episode to script_ready for retry
            logger.warning(f"[AUDIO_GEN] [{request_id}] DeferrableError: {str(de)}")
            logger.info(f"[AUDIO_GEN] [{request_id}] Returning episode {episode_id} to script_ready for retry")

            if episode_id:
                # Log deferral in processing logs
                self.tracker.log_stage_failure(
                    episode_id,
                    ProcessingStage.AUDIO_PROCESSING,
                    de,
                    {
                        'request_id': request_id,
                        'context': 'Episode deferred for retry',
                        'deferred': True
                    }
                )
                # Return episode to script_ready status (not failed)
                self.update_episode_status(episode_id, 'script_ready', f"Deferred: {str(de)}")

            return {
                'status': 'deferred',
                'episode_id': episode_id,
                'reason': str(de),
                'next_action': 'Episode returned to script_ready for retry'
            }

        except Exception as e:
            logger.error(f"[AUDIO_GEN] [{request_id}] Error: {str(e)}")

            # Log audio stage failure
            if episode_id:
                self.tracker.log_stage_failure(
                    episode_id,
                    ProcessingStage.AUDIO_PROCESSING,
                    e,
                    {
                        'request_id': request_id,
                        'context': 'Exception during audio generation'
                    }
                )
                self.update_episode_status(episode_id, 'failed', str(e))

            return {
                'status': 'error',
                'episode_id': episode_id,
                'error': str(e)
            }

    def _get_podcast_config(self, podcast_config_id: str, podcast_id: str, request_id: str) -> Dict[str, Any]:
        """Get podcast configuration with fallback logic"""
        podcast_config = None
        
        if podcast_config_id:
            podcast_config = self.supabase_client.get_podcast_config_by_id(podcast_config_id)
            if not podcast_config:
                logger.warning(f"[AUDIO_GEN] [{request_id}] Podcast config not found by ID {podcast_config_id}, trying podcast_id")
        
        if not podcast_config and podcast_id:
            podcast_config = self.supabase_client.get_podcast_config(podcast_id)
        
        if not podcast_config:
            raise ValueError(f"Podcast configuration not found for config_id={podcast_config_id} or podcast_id={podcast_id}")
        
        return podcast_config

    def _generate_audio(self, script: str, podcast_config: Dict[str, Any], request_id: str, episode_id: str = None, is_pre_processed: bool = False) -> Tuple[bytes, float]:
        """Generate audio using Google Gemini TTS with pre-selected voices from script-preprocessor"""
        logger.info(f"[AUDIO_GEN] Generating audio for episode {episode_id}")

        generator = GooglePodcastGenerator()

        language = podcast_config.get('language', 'en')
        speaker1_role = podcast_config.get('speaker1_role', 'Speaker 1')
        speaker2_role = podcast_config.get('speaker2_role', 'Speaker 2')
        speaker1_gender = podcast_config.get('speaker1_gender', 'male')
        speaker2_gender = podcast_config.get('speaker2_gender', 'female')

        # Extract pre-selected voices from dynamic_config (selected by script-preprocessor for consistency)
        speaker1_voice = podcast_config.get('speaker1_voice')
        speaker2_voice = podcast_config.get('speaker2_voice')

        logger.info(f"[AUDIO_GEN] Language: {language}")
        logger.info(f"[AUDIO_GEN] Speakers: {speaker1_role} ({speaker1_gender}), {speaker2_role} ({speaker2_gender})")
        logger.info(f"[AUDIO_GEN] Using pre-selected voices: {speaker1_role}={speaker1_voice}, {speaker2_role}={speaker2_voice}")
        logger.info(f"[AUDIO_GEN] Using pre-processed script: {is_pre_processed}")

        # Get content type from dynamic config (preprocessed by script-preprocessor)
        content_info = podcast_config.get('content_analysis', {})
        content_type = content_info.get('content_type', 'general')

        try:
            audio_data, duration = generator.generate_podcast_audio(
                script_content=script,
                language=language,
                speaker1_role=speaker1_role,
                speaker2_role=speaker2_role,
                speaker1_gender=speaker1_gender,
                speaker2_gender=speaker2_gender,
                episode_id=episode_id,
                is_pre_processed=is_pre_processed,
                content_type=content_type,
                speaker1_voice=speaker1_voice,
                speaker2_voice=speaker2_voice
            )
        except Exception as e:
            logger.error(f"[AUDIO_GEN] Audio generation failed: {str(e)}")
            raise

        return audio_data, duration

    def _update_episode_with_audio(self, episode_id: str, audio_url: str, audio_data: bytes, duration: float, episode: Dict[str, Any]):
        """Update episode with audio results and send completion callback"""
        # Update episode in database
        self.supabase_client.update_episode(episode_id, {
            'audio_url': audio_url,
            'duration': duration,
            'status': 'completed',
            'description': episode.get('description'),
            'title': episode.get('title')
        })
        
        # Send completion callback to trigger immediate post-processing
        self._send_completion_callback(episode_id, audio_url, duration)

    def _process_hebrew_script(self, script: str, language: str, request_id: str) -> Tuple[str, Optional[str]]:
        """
        Process Hebrew script with niqqud if needed
        
        Args:
            script: Original script content
            language: Language code
            request_id: Request ID for logging
            
        Returns:
            Tuple of (processed_script_for_tts, niqqud_script_for_storage)
        """
        # Only process Hebrew text
        if language.lower() not in ['he', 'hebrew', 'heb', 'עברית']:
            logger.info(f"[AUDIO_GEN] [{request_id}] Non-Hebrew language ({language}), skipping niqqud processing")
            return script, None
        
        try:
            logger.info(f"[AUDIO_GEN] [{request_id}] Processing Hebrew script with niqqud")
            
            # Initialize niqqud processor
            niqqud_processor = HebrewNiqqudProcessor()
            
            # Check if text contains Hebrew characters
            if not niqqud_processor.is_hebrew_text(script):
                logger.info(f"[AUDIO_GEN] [{request_id}] No Hebrew text detected, skipping niqqud processing")
                return script, None
            
            # Process the entire script with niqqud once
            niqqud_script = niqqud_processor.process_script_for_tts(script, language)
            
            logger.info(f"[AUDIO_GEN] [{request_id}] Successfully processed Hebrew script with niqqud")
            logger.info(f"[AUDIO_GEN] [{request_id}] Original: {len(script)} chars -> Niqqud: {len(niqqud_script)} chars")
            
            return niqqud_script, niqqud_script
            
        except Exception as e:
            logger.error(f"[AUDIO_GEN] [{request_id}] Error processing Hebrew script: {str(e)}")
            logger.info(f"[AUDIO_GEN] [{request_id}] Falling back to original script")
            return script, None

    def _upload_script_as_transcript(self, episode_id: str, podcast_id: str, original_script: str, 
                                   niqqud_script: Optional[str], language: str, request_id: str):
        """Upload both original and niqqud scripts as transcript files to S3"""
        try:
            # Create timestamp for filenames
            timestamp = now_utc().strftime('%Y%m%d_%H%M%S')
            
            # Upload original script as transcript
            original_filename = f"transcript_{timestamp}.txt"
            original_url = self.s3_client.upload_transcript(
                original_script, podcast_id, episode_id, original_filename
            )
            
            if original_url:
                logger.info(f"[AUDIO_GEN] [{request_id}] Successfully uploaded original transcript: {original_url}")
            else:
                logger.warning(f"[AUDIO_GEN] [{request_id}] Failed to upload original transcript")
            
            # Upload niqqud script if available
            if niqqud_script and language.lower() in ['he', 'hebrew', 'heb', 'עברית']:
                niqqud_filename = f"transcript_niqqud_{timestamp}.txt"
                niqqud_url = self.s3_client.upload_transcript(
                    niqqud_script, podcast_id, episode_id, niqqud_filename
                )
                
                if niqqud_url:
                    logger.info(f"[AUDIO_GEN] [{request_id}] Successfully uploaded niqqud transcript: {niqqud_url}")
                else:
                    logger.warning(f"[AUDIO_GEN] [{request_id}] Failed to upload niqqud transcript")
                
        except Exception as e:
            logger.warning(f"[AUDIO_GEN] [{request_id}] Error uploading transcripts: {str(e)}")
            # Don't fail the entire process if transcript upload fails

    def _send_completion_callback(self, episode_id: str, audio_url: str, duration: float):
        """Send completion callback to Next.js API for immediate post-processing"""
        try:
            import requests
            
            api_base_url = os.getenv('API_BASE_URL')
            lambda_secret = os.getenv('LAMBDA_CALLBACK_SECRET')
            
            if not api_base_url or not lambda_secret:
                logger.warning(f"[AUDIO_GEN] Missing callback configuration - API_BASE_URL: {bool(api_base_url)}, LAMBDA_CALLBACK_SECRET: {bool(lambda_secret)}")
                return
            
            callback_url = f"{api_base_url}/api/episodes/{episode_id}/completed"
            
            payload = {
                'status': 'completed',
                'audio_url': audio_url,
                'duration': duration,
                'timestamp': to_iso_utc(now_utc())
            }
            
            headers = {
                'Authorization': f'Bearer {lambda_secret}',
                'Content-Type': 'application/json'
            }
            
            logger.info(f"[AUDIO_GEN] Sending completion callback for episode {episode_id} to {callback_url}")
            
            response = requests.post(
                callback_url,
                json=payload,
                headers=headers,
                timeout=30  # 30 second timeout
            )
            
            if response.status_code == 200:
                logger.info(f"[AUDIO_GEN] Completion callback successful for episode {episode_id}")
            else:
                logger.warning(f"[AUDIO_GEN] Completion callback failed for episode {episode_id}: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.warning(f"[AUDIO_GEN] Failed to send completion callback for episode {episode_id}: {str(e)}")
            # Don't fail the entire process if callback fails - episode is still completed

    def update_episode_status(self, episode_id: str, status: str, error_message: Optional[str] = None):
        """Update episode status in database"""
        try:
            update_data = {'status': status}
            
            if error_message and status == 'failed':
                update_data['metadata'] = json.dumps({
                    'error': error_message,
                    'failed_at': to_iso_utc(now_utc())
                })
            
            self.supabase_client.update_episode(episode_id, update_data)
            logger.info(f"[AUDIO_GEN] Updated episode {episode_id} status to {status}")
            
        except Exception as e:
            logger.error(f"[AUDIO_GEN] Failed to update episode status: {str(e)}")

 