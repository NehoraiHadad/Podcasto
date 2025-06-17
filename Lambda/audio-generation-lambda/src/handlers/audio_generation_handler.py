"""
Audio Generation Lambda Handler
Processes SQS messages to generate podcast audio using Google TTS
"""
import json
import os
import logging
import boto3
import tempfile
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from clients.supabase_client import SupabaseClient
from clients.s3_client import S3Client
from clients.telegram_data_client import TelegramDataClient
from services.google_podcast_generator import GooglePodcastGenerator
from services.gemini_script_generator import GeminiScriptGenerator
from services.content_analyzer import ContentAnalyzer
from utils.logging import get_logger

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
        self.telegram_client = TelegramDataClient()
        
        # Get API keys from environment
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        # Initialize content analyzer
        self.content_analyzer = ContentAnalyzer(self.gemini_api_key)
        
    def process_event(self, event: Dict[str, Any], context: Any) -> Dict[str, Any]:
        """Process SQS event containing episode generation requests"""
        logger.info(f"[AUDIO_GEN] Lambda invoked with event: {json.dumps(event, default=str)}")
        
        results = []
        records = event.get('Records', [])
        
        for record in records:
            try:
                message_body = record.get('body', '{}')
                message = json.loads(message_body)
                request_id = record.get('messageId', 'unknown')
                
                logger.info(f"[AUDIO_GEN] Processing message {request_id}: {message}")
                
                if not self.should_process_for_audio(message):
                    logger.info(f"[AUDIO_GEN] Message {request_id} not relevant for audio generation, skipping")
                    results.append({
                        'status': 'skipped',
                        'message_id': request_id,
                        'reason': 'Not an audio generation request'
                    })
                    continue
                
                result = self.process_audio_generation_request(message, request_id)
                result['message_id'] = request_id
                results.append(result)
                
            except Exception as e:
                logger.error(f"[AUDIO_GEN] Error processing record: {str(e)}")
                results.append({
                    'status': 'error',
                    'message_id': record.get('messageId', 'unknown'),
                    'error': str(e)
                })
        
        logger.info(f"[AUDIO_GEN] Processed {len(records)} messages, results: {results}")
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(records),
                'results': results
            })
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
            
            if episode_status == 'content_collected' and not has_audio:
                logger.info(f"[AUDIO_GEN] Episode {episode_id} is ready for audio generation")
                return True
            else:
                logger.debug(f"[AUDIO_GEN] Episode {episode_id} status: {episode_status}, has_audio: {bool(has_audio)}")
                return False
                
        except Exception as e:
            logger.error(f"[AUDIO_GEN] Error checking episode status: {str(e)}")
            return False

    def process_audio_generation_request(self, message: Dict[str, Any], request_id: str) -> Dict[str, Any]:
        """Process individual audio generation request"""
        episode_id = None
        
        try:
            episode_id = message.get('episode_id')
            podcast_id = message.get('podcast_id')
            podcast_config_id = message.get('podcast_config_id')
            
            logger.info(f"[AUDIO_GEN] [{request_id}] Processing audio generation for episode {episode_id}")
            
            self.update_episode_status(episode_id, 'processing')
            
            # Get episode and podcast configuration
            episode = self.supabase_client.get_episode(episode_id)
            if not episode:
                raise ValueError(f"Episode {episode_id} not found")
            
            podcast_config = self._get_podcast_config(podcast_config_id, podcast_id, request_id)
            
            # Get Telegram data from S3
            telegram_data = self.telegram_client.get_telegram_data(
                podcast_id, episode_id, message.get('s3_path')
            )
            
            if not telegram_data:
                raise ValueError("No Telegram data found for episode")
            
            # Analyze content and get dynamic speaker role
            content_analysis = self.content_analyzer.analyze_content(telegram_data)
            logger.info(f"[AUDIO_GEN] [{request_id}] Content analysis: {content_analysis.content_type} -> {content_analysis.speaker2_role}")
            
            # Update podcast config with dynamic role
            dynamic_config = self._apply_dynamic_role(podcast_config, content_analysis)
            
            # Generate script with dynamic roles
            script = self._generate_script(telegram_data, dynamic_config, request_id, episode_id)
            
            # Generate audio
            audio_data, duration = self._generate_audio(
                script, dynamic_config, request_id, episode_id
            )
            
            # Upload script as transcript to S3
            self._upload_script_as_transcript(episode_id, podcast_id, script, request_id)
            
            # Upload and update
            audio_url = self.s3_client.upload_audio(
                audio_data, podcast_id, episode_id, 'wav'
            )
            
            self._update_episode_with_audio(episode_id, audio_url, audio_data, duration, episode)
            
            logger.info(f"[AUDIO_GEN] [{request_id}] Successfully generated audio for episode {episode_id}")
            
            return {
                'status': 'success',
                'episode_id': episode_id,
                'audio_url': audio_url,
                'duration': duration,
                'content_type': content_analysis.content_type.value,
                'speaker2_role': content_analysis.speaker2_role.value,
                'confidence': content_analysis.confidence
            }
            
        except Exception as e:
            logger.error(f"[AUDIO_GEN] [{request_id}] Error: {str(e)}")
            
            if episode_id:
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

    def _generate_script(self, telegram_data: Dict[str, Any], podcast_config: Dict[str, Any], request_id: str, episode_id: str = None) -> str:
        """Generate conversation script using Gemini"""
        script_generator = GeminiScriptGenerator()
        configured_language = podcast_config.get('language', 'en')
        logger.info(f"[AUDIO_GEN] [{request_id}] Using podcast language: {configured_language}")
        
        return script_generator.generate_script(telegram_data, podcast_config, episode_id)

    def _generate_audio(self, script: str, podcast_config: Dict[str, Any], request_id: str, episode_id: str = None) -> Tuple[bytes, float]:
        """Generate audio using Google Gemini TTS with gender-aware voices"""
        logger.info(f"[AUDIO_GEN] Generating audio for episode {episode_id}")
        
        generator = GooglePodcastGenerator()
        
        language = podcast_config.get('language', 'en')
        speaker1_role = podcast_config.get('speaker1_role', 'Speaker 1')
        speaker2_role = podcast_config.get('speaker2_role', 'Speaker 2')
        speaker1_gender = podcast_config.get('speaker1_gender', 'male')
        speaker2_gender = podcast_config.get('speaker2_gender', 'female')
        
        logger.info(f"[AUDIO_GEN] Language: {language}")
        logger.info(f"[AUDIO_GEN] Speakers: {speaker1_role} ({speaker1_gender}), {speaker2_role} ({speaker2_gender})")
        
        try:
            audio_data, duration = generator.generate_podcast_audio(
                script_content=script,
                language=language,
                speaker1_role=speaker1_role,
                speaker2_role=speaker2_role,
                speaker1_gender=speaker1_gender,
                speaker2_gender=speaker2_gender,
                episode_id=episode_id
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

    def _upload_script_as_transcript(self, episode_id: str, podcast_id: str, script: str, request_id: str):
        """Upload the generated script as a transcript file to S3"""
        try:
            # Create transcript filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            transcript_filename = f"transcript_{timestamp}.txt"
            
            # Upload script as transcript to S3
            transcript_url = self.s3_client.upload_transcript(
                script, podcast_id, episode_id, transcript_filename
            )
            
            if transcript_url:
                logger.info(f"[AUDIO_GEN] [{request_id}] Successfully uploaded transcript for episode {episode_id}: {transcript_url}")
            else:
                logger.warning(f"[AUDIO_GEN] [{request_id}] Failed to upload transcript for episode {episode_id}")
                
        except Exception as e:
            logger.warning(f"[AUDIO_GEN] [{request_id}] Error uploading transcript for episode {episode_id}: {str(e)}")
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
                'timestamp': datetime.now().isoformat()
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
                    'failed_at': datetime.now().isoformat()
                })
            
            self.supabase_client.update_episode(episode_id, update_data)
            logger.info(f"[AUDIO_GEN] Updated episode {episode_id} status to {status}")
            
        except Exception as e:
            logger.error(f"[AUDIO_GEN] Failed to update episode status: {str(e)}")

    def _apply_dynamic_role(self, podcast_config: Dict[str, Any], content_analysis) -> Dict[str, Any]:
        """Apply dynamic speaker role to podcast configuration"""
        dynamic_config = podcast_config.copy()
        
        # Update speaker2_role with analyzed role
        dynamic_config['speaker2_role'] = content_analysis.speaker2_role.value
        
        # Add content analysis metadata
        dynamic_config['content_analysis'] = {
            'content_type': content_analysis.content_type.value,
            'confidence': content_analysis.confidence,
            'reasoning': content_analysis.reasoning
        }
        
        logger.info(f"[AUDIO_GEN] Updated speaker2_role: {dynamic_config['speaker2_role']}")
        
        return dynamic_config 