"""
URL-based podcast generator.
"""
from typing import Dict, Any, Optional, Tuple, List
from podcastfy.client import generate_podcast
import os

from src.utils.logging import get_logger
from src.generators.google_tts_generator import generate_google_tts_audio
from src.generators.base_generator import BaseGenerator

logger = get_logger(__name__)

class UrlGenerator(BaseGenerator):
    """
    Generate podcasts from URL content sources.
    """
    
    def create_podcast(
        self,
        urls: List[str],
        metadata: Dict[str, Any],
        conversation_config: Dict[str, Any] = None,
        longform: bool = False,
        transcript_only: bool = False,
        max_num_chunks: Optional[int] = None,
        min_chunk_size: Optional[int] = None,
        llm_model_name: Optional[str] = None,
        api_key_label: Optional[str] = None
    ) -> Optional[Tuple[str, Optional[str], int]]:
        """
        Create a podcast from URLs.
        
        Args:
            urls: List of URLs to use as content sources
            metadata: Podcast metadata (title, description, etc.)
            conversation_config: Configuration for the conversation
            longform: Whether to generate a longform podcast
            transcript_only: Whether to generate a transcript only
            max_num_chunks: Maximum number of chunks to process
            min_chunk_size: Minimum size of each chunk
            llm_model_name: Optional LLM model name
            api_key_label: Optional API key label
            
        Returns:
            Tuple of (local_path, s3_url, duration) for the generated podcast file or None if failed
        """
        try:
            logger.info("Creating podcast from URLs")
            
            # Prepare API environment
            if not self.prepare_api_environment():
                return None
            
            # Create output path
            output_path = self.get_output_path(metadata)
            
            # Create required directories for podcast generation
            os.makedirs("/tmp/podcastify-demo/tmp", exist_ok=True)
            os.makedirs("/tmp/podcastify-demo/transcripts", exist_ok=True)
            os.makedirs("/tmp/podcastify-demo/audio", exist_ok=True)
            
            # Update conversation config with max_num_chunks and min_chunk_size if provided
            if conversation_config is None:
                conversation_config = {}
                
            if max_num_chunks is not None:
                conversation_config["max_num_chunks"] = max_num_chunks
            if min_chunk_size is not None:
                conversation_config["min_chunk_size"] = min_chunk_size
            
            # Prepare arguments for generate_podcast
            podcast_args = {
                "urls": urls,
                "metadata": metadata,
                "llm_model_name": llm_model_name,
                "api_key_label": api_key_label,
                "conversation_config": conversation_config, # TTS config removed
                "transcript_only": True, # Step 1: Generate transcript only
                "longform": longform
            }

            logger.info("Generating transcript from URLs using podcastfy library...")
            # Generate transcript using the podcastfy library
            # Assuming this now returns the transcript string directly or a path to it.
            transcript_content = generate_podcast(**podcast_args)

            if not transcript_content:
                logger.error("Transcript generation failed or returned empty content.")
                return None

            # TODO: Add file reading if generate_podcast with transcript_only=True returns a path.
            # For now, assume transcript_content is the actual transcript string.
            logger.info(f"Transcript generated. Length: {len(transcript_content)} characters.")

            # Step 2: Generate audio using Google TTS
            logger.info("Proceeding with Google Text-to-Speech generation.")
            # Construct a suitable filename for the Google TTS output
            base_output_name, _ = os.path.splitext(os.path.basename(output_path))
            google_tts_output_filename = f"google_tts_{base_output_name}.mp3" # Assuming MP3 output
            google_tts_output_path = os.path.join(self.storage_dir, google_tts_output_filename)

            google_api_key = self.podcast_config.get('gemini_api_key', os.environ.get('GEMINI_API_KEY'))
            if not google_api_key:
                logger.error("GEMINI_API_KEY not found in config or environment variables.")
                return None

            voice_name_speaker1 = self.podcast_config.get('voice_name_speaker1', 'Zephyr')
            voice_name_speaker2 = self.podcast_config.get('voice_name_speaker2', 'Puck')
            language_code = metadata.get('language', 'en-US')

            logger.info(f"Calling Google TTS with parameters: voice1={voice_name_speaker1}, voice2={voice_name_speaker2}, lang={language_code}")

            google_audio_file_path = generate_google_tts_audio(
                google_api_key=google_api_key,
                text_input=transcript_content,
                output_filename=google_tts_output_path,
                voice_name_speaker1=voice_name_speaker1,
                voice_name_speaker2=voice_name_speaker2,
                language_code=language_code
                # Add other relevant parameters like sample_rate_hertz if needed
            )

            if not google_audio_file_path:
                logger.error("Google TTS audio generation failed.")
                return None
            
            logger.info(f"Google TTS audio generated successfully at: {google_audio_file_path}")

            # Step 3: Process the generated Google TTS audio file (e.g., upload to S3)
            # The existing self.generate_podcast method handles S3 upload and returns the tuple.
            return self.generate_podcast(google_audio_file_path, metadata, output_path)
            
        except Exception as e:
            logger.error(f"Error creating podcast from URLs: {str(e)}", exc_info=True)
            return None 