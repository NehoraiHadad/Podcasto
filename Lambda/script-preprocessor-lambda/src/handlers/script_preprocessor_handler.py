from __future__ import annotations

"""
Script Pre-Processor Lambda Handler
=================================
Generates clean content, analysis JSON and conversation script from raw Telegram data.
Triggered by SQS messages produced by the Telegram collector.
Outputs artefacts to S3, updates Supabase episode row and pushes a new message to the
Audio-Generation SQS queue so that the Audio Lambda can handle TTS only.
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, List

# Shared layer imports (common across lambdas)
from shared.clients.supabase_client import SupabaseClient  # type: ignore
from shared.clients.s3_client import S3Client  # type: ignore
from shared.clients.telegram_data_client import TelegramDataClient  # type: ignore
from shared.services.voice_config import VoiceConfigManager  # type: ignore
from shared.services.episode_tracker import EpisodeTracker, ProcessingStage  # type: ignore
from shared.utils.logging import get_logger  # type: ignore
from shared.utils.datetime_utils import now_utc  # type: ignore
from shared.utils.language_mapper import language_code_to_full  # type: ignore

# Lambda-specific services (unique to script-preprocessor)
from services.telegram_content_extractor import TelegramContentExtractor  # type: ignore
from services.content_analyzer import ContentAnalyzer, ContentAnalysisResult  # type: ignore
from services.gemini_script_generator import GeminiScriptGenerator  # type: ignore
from services.script_validator import ScriptValidator  # type: ignore

logger = get_logger(__name__)

# Global instance reuse ‑ Lambda container warm
_handler_instance: "ScriptPreprocessorHandler | None" = None

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:  # noqa: D401
    """AWS Lambda entry point (re-uses a singleton handler between invocations)."""
    global _handler_instance
    if _handler_instance is None:
        _handler_instance = ScriptPreprocessorHandler()
    return _handler_instance.handle(event)


class ScriptPreprocessorHandler:  # noqa: D101
    """Processes incoming SQS messages and prepares script artefacts."""

    def __init__(self) -> None:  # noqa: D401
        self.supabase_client = SupabaseClient()
        self.s3_client = S3Client()
        self.telegram_client = TelegramDataClient()
        self.extractor = TelegramContentExtractor()
        self.voice_manager = VoiceConfigManager()
        self.tracker = EpisodeTracker(self.supabase_client)

        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        self.content_analyzer = ContentAnalyzer(gemini_key)
        self.script_generator = GeminiScriptGenerator()

        self.audio_queue_url = os.getenv("AUDIO_GENERATION_QUEUE_URL")
        if self.audio_queue_url:
            import boto3

            self.sqs_client = boto3.client("sqs")
        else:
            self.sqs_client = None
            logger.warning("AUDIO_GENERATION_QUEUE_URL not defined – downstream message will be skipped")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def handle(self, event: Dict[str, Any]) -> Dict[str, Any]:  # noqa: D401
        results: List[Dict[str, Any]] = []
        for record in event.get("Records", []):
            episode_id = None
            try:
                message = json.loads(record.get("body", "{}"))
                episode_id = message.get("episode_id")
                res = self._process(message)
                results.append({"status": "success", **res})
            except Exception as exc:  # noqa: BLE001
                logger.exception("[PREPROC] Failed to process record: %s", exc)

                # Log script stage failure
                if episode_id:
                    self.tracker.log_stage_failure(
                        episode_id,
                        ProcessingStage.SCRIPT_PROCESSING,
                        exc,
                        {'context': 'Exception during script processing'}
                    )

                results.append({"status": "error", "error": str(exc)})
        return {"statusCode": 200, "body": json.dumps({"results": results})}

    # ------------------------------------------------------------------
    # Core processing for single message
    # ------------------------------------------------------------------
    def _process(self, msg: Dict[str, Any]) -> Dict[str, Any]:  # noqa: D401, C901
        episode_id = msg.get("episode_id")
        podcast_id = msg.get("podcast_id")
        if not episode_id or not podcast_id:
            raise ValueError("episode_id & podcast_id required")

        # Log start of script processing stage
        self.tracker.log_stage_start(
            episode_id,
            ProcessingStage.SCRIPT_PROCESSING,
            {'podcast_id': podcast_id}
        )

        telegram_data = self.telegram_client.get_telegram_data(
            podcast_id, episode_id, msg.get("s3_path")
        )
        if not telegram_data:
            raise ValueError("Telegram data missing in S3")

        clean_content = self.extractor.extract_clean_content(telegram_data)
        analysis: ContentAnalysisResult = self.content_analyzer.analyze_content(telegram_data)

        # NEW: Analyze topics and conversation structure
        topic_analysis = self.content_analyzer.analyze_topics_and_structure(telegram_data)

        analysis_dict = {
            "content_type": analysis.content_type.value,
            "specific_role": analysis.specific_role,
            "role_description": analysis.role_description,
            "confidence": analysis.confidence,
            "reasoning": analysis.reasoning,
            "topics": topic_analysis.get('topics', []),
            "conversation_structure": topic_analysis.get('conversation_structure', 'linear'),
            "transition_style": topic_analysis.get('transition_style', 'natural')
        }

        podcast_config = self._get_podcast_config(msg.get("podcast_config_id"), podcast_id)

        # Extract podcast_format from message dynamic_config or message itself
        dynamic_config_in_message = msg.get("dynamic_config", {})
        podcast_format = dynamic_config_in_message.get('podcast_format') or msg.get('podcast_format', 'multi-speaker')

        # Validate and log podcast format
        if podcast_format not in ['single-speaker', 'multi-speaker']:
            logger.warning(f"[SCRIPT_PREP] Invalid format '{podcast_format}', defaulting to 'multi-speaker'")
            podcast_format = 'multi-speaker'

        logger.info(f"[SCRIPT_PREP] Episode {episode_id} podcast_format: {podcast_format}")

        # Extract language_code from message (ISO code like 'he', 'en')
        language_code = msg.get('language_code', 'en')
        # Convert ISO code to full name for Gemini API
        language_full = language_code_to_full(language_code)
        logger.info(f"[SCRIPT_PREP] Episode {episode_id} language_code: {language_code} -> language_full: {language_full}")

        dynamic_config = self._apply_dynamic_role(podcast_config, analysis, episode_id, podcast_format, language_code)

        # Add topic analysis to dynamic config
        dynamic_config['topic_analysis'] = topic_analysis
        # Add podcast_format to dynamic config
        dynamic_config['podcast_format'] = podcast_format

        script, content_metrics = self.script_generator.generate_script(
            clean_content, dynamic_config, episode_id, podcast_format
        )

        # Validate script quality
        validation_report = ScriptValidator.validate_script(
            original_content=clean_content,
            generated_script=script,
            content_metrics=content_metrics
        )
        logger.info(f"[PREPROC] Script validation: quality={validation_report['quality_score']:.2f}, passed={validation_report['passed']}")
        if validation_report.get('recommendations'):
            logger.warning(f"[PREPROC] Recommendations: {', '.join(validation_report['recommendations'])}")

        artefacts = self._upload_artefacts(podcast_id, episode_id, clean_content, analysis_dict, script)

        # Prepare metadata with voice information for recovery in audio-generation
        episode_metadata = {
            "speaker1_voice": dynamic_config['speaker1_voice'],
            "speaker2_voice": dynamic_config.get('speaker2_voice'),
            "speaker1_role": dynamic_config['speaker1_role'],
            "speaker2_role": dynamic_config.get('speaker2_role'),
            "speaker1_gender": dynamic_config.get('speaker1_gender', 'male'),
            "speaker2_gender": dynamic_config.get('speaker2_gender'),
            "language_code": language_code,
            "podcast_format": podcast_format
        }

        # Update DB state
        self.supabase_client.update_episode(
            episode_id,
            {
                "status": "script_ready",
                "script_url": artefacts["script"],
                "analysis": json.dumps(analysis_dict),
                "metadata": json.dumps(episode_metadata),
            },
        )

        # Fan-out to Audio Lambda
        if self.audio_queue_url and self.sqs_client:
            payload = {
                "episode_id": episode_id,
                "podcast_id": podcast_id,
                "podcast_config_id": msg.get("podcast_config_id"),
                "script_url": artefacts["script"],
                "dynamic_config": dynamic_config,
            }
            self.sqs_client.send_message(QueueUrl=self.audio_queue_url, MessageBody=json.dumps(payload))
            logger.info("[PREPROC] SQS message sent to audio queue for episode %s", episode_id)

        # Log successful completion of script processing stage
        self.tracker.log_stage_complete(
            episode_id,
            ProcessingStage.SCRIPT_PROCESSING,
            {
                'script_chars': len(script),
                'script_url': artefacts["script"],
                'validation_score': validation_report.get('quality_score')
            }
        )

        return {"episode_id": episode_id, "script_chars": len(script)}

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _upload_artefacts(
        self,
        podcast_id: str,
        episode_id: str,
        clean_content: Dict[str, Any],
        analysis_dict: Dict[str, Any],
        script: str,
    ) -> Dict[str, str]:
        ts = now_utc().strftime("%Y%m%d_%H%M%S")
        artefacts: Dict[str, str] = {}
        artefacts["clean_content"] = self._upload_json(podcast_id, episode_id, clean_content, f"clean_content_{ts}.json")
        artefacts["analysis"] = self._upload_json(podcast_id, episode_id, analysis_dict, f"analysis_{ts}.json")
        artefacts["script"] = self._upload_text(podcast_id, episode_id, script, f"script_{ts}.txt")
        return artefacts

    def _upload_json(self, pid: str, eid: str, obj: Dict[str, Any], fname: str) -> str:
        return self.s3_client.upload_transcript(json.dumps(obj, ensure_ascii=False, indent=2), pid, eid, fname)

    def _upload_text(self, pid: str, eid: str, text: str, fname: str) -> str:
        return self.s3_client.upload_transcript(text, pid, eid, fname)

    def _get_podcast_config(self, cfg_id: str | None, podcast_id: str) -> Dict[str, Any]:
        cfg = None
        if cfg_id:
            cfg = self.supabase_client.get_podcast_config_by_id(cfg_id)
        if not cfg:
            cfg = self.supabase_client.get_podcast_config(podcast_id)
        if not cfg:
            raise ValueError("Podcast configuration not found")
        return cfg

    def _apply_dynamic_role(self, cfg: Dict[str, Any], analysis: ContentAnalysisResult, episode_id: str, podcast_format: str = 'multi-speaker', language_code: str = 'en') -> Dict[str, Any]:
        new_cfg = cfg.copy()

        # For single-speaker, skip speaker2 configuration
        if podcast_format == 'single-speaker':
            new_cfg["speaker2_role"] = None
            new_cfg["speaker2_gender"] = None
            new_cfg["content_analysis"] = {
                "content_type": analysis.content_type.value,
                "specific_role": analysis.specific_role,
                "role_description": analysis.role_description,
                "confidence": analysis.confidence,
                "reasoning": analysis.reasoning,
            }

            # Select only speaker1 voice
            # Convert ISO language code to full name for voice manager
            language_full = language_code_to_full(language_code)
            speaker1_role = cfg.get("speaker1_role", "Speaker 1")
            speaker1_gender = cfg.get("speaker1_gender", "male")

            # Use dummy values for speaker2 to satisfy voice manager API
            speaker1_voice, _ = self.voice_manager.get_distinct_voices_for_speakers(
                language=language_full,
                speaker1_gender=speaker1_gender,
                speaker2_gender='male',  # dummy
                speaker1_role=speaker1_role,
                speaker2_role='Unused',  # dummy
                episode_id=episode_id,
                randomize_speaker2=False
            )

            new_cfg["speaker1_voice"] = speaker1_voice
            new_cfg["speaker2_voice"] = None
            new_cfg["language_code"] = language_code
            new_cfg["language"] = language_full  # Full language name for Gemini script generation
            logger.info(f"[PREPROC] Selected single voice for episode {episode_id}: {speaker1_role}={speaker1_voice}, language={language_full}")
        else:
            # Multi-speaker: use dynamic role assignment
            new_cfg["speaker2_role"] = analysis.specific_role
            new_cfg["speaker2_gender"] = self.content_analyzer.get_gender_for_category(analysis.content_type)
            new_cfg["content_analysis"] = {
                "content_type": analysis.content_type.value,
                "specific_role": analysis.specific_role,
                "role_description": analysis.role_description,
                "confidence": analysis.confidence,
                "reasoning": analysis.reasoning,
            }

            # Select voices once for the entire episode (ensures consistency across chunks)
            # Convert ISO language code to full name for voice manager
            language_full = language_code_to_full(language_code)
            speaker1_role = cfg.get("speaker1_role", "Speaker 1")
            speaker2_role = new_cfg["speaker2_role"]
            speaker1_gender = cfg.get("speaker1_gender", "male")
            speaker2_gender = new_cfg["speaker2_gender"]

            speaker1_voice, speaker2_voice = self.voice_manager.get_distinct_voices_for_speakers(
                language=language_full,
                speaker1_gender=speaker1_gender,
                speaker2_gender=speaker2_gender,
                speaker1_role=speaker1_role,
                speaker2_role=speaker2_role,
                episode_id=episode_id,
                randomize_speaker2=True
            )

            new_cfg["speaker1_voice"] = speaker1_voice
            new_cfg["speaker2_voice"] = speaker2_voice
            new_cfg["language_code"] = language_code
            new_cfg["language"] = language_full  # Full language name for Gemini script generation
            logger.info(f"[PREPROC] Selected voices for episode {episode_id}: {speaker1_role}={speaker1_voice}, {speaker2_role}={speaker2_voice}, language={language_full}")

        return new_cfg 