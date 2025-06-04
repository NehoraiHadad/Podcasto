"""
Text-based podcast generator.
"""
from typing import Dict, Any, Optional, Tuple, List
from podcastfy.client import generate_podcast
import os

from src.utils.logging import get_logger
from src.generators.google_tts_generator import generate_google_tts_audio
from src.generators.base_generator import BaseGenerator

logger = get_logger(__name__)

# Define character limit for Google TTS API
GOOGLE_TTS_CHAR_LIMIT = 15000 # As specified in the prompt

class TextGenerator(BaseGenerator):
    """
    Generate podcasts from text content.
    """

    def _split_text(self, text: str, limit: int) -> List[str]:
        """
        Splits text into chunks smaller than the specified limit.
        Prioritizes splitting at paragraph breaks, then sentences.
        Last resort is hard character split if a single segment is too long.
        """
        chunks = []
        if not text:
            return chunks

        # Attempt to split by paragraphs first (double newlines)
        paragraphs = text.split('\n\n')

        current_chunk = ""
        for para_idx, paragraph in enumerate(paragraphs):
            if not paragraph.strip():
                if current_chunk: # Add paragraph break if current_chunk is not empty
                    current_chunk += "\n\n"
                continue

            # If current chunk + paragraph (+ potential separator) exceeds limit
            if len(current_chunk) + len(paragraph) + (2 if current_chunk else 0) > limit:
                if current_chunk: # Finalize current_chunk if it has content
                    chunks.append(current_chunk.strip())
                    current_chunk = ""

                # If paragraph itself is too long, split it further
                if len(paragraph) > limit:
                    logger.warning(f"Paragraph is longer than limit ({len(paragraph)} > {limit}). Splitting paragraph.")
                    # Sentence splitting for long paragraph
                    # Using regex to better handle sentence endings.
                    import re
                    sentences = re.split(r'(?<=[.!?])\s+', paragraph)
                    temp_sentence_chunk = ""
                    for sent_idx, sentence in enumerate(sentences):
                        if len(temp_sentence_chunk) + len(sentence) + 1 > limit:
                            if temp_sentence_chunk:
                                chunks.append(temp_sentence_chunk.strip())
                                temp_sentence_chunk = ""

                        if len(sentence) > limit: # Single sentence still too long
                            logger.warning(f"Sentence is longer than limit ({len(sentence)} > {limit}). Hard splitting sentence.")
                            for i in range(0, len(sentence), limit):
                                chunks.append(sentence[i:i+limit])
                            if temp_sentence_chunk: # any remainder before this super long sentence
                                chunks.append(temp_sentence_chunk.strip())
                                temp_sentence_chunk = ""
                        else:
                            temp_sentence_chunk += (sentence + " ").strip()

                    if temp_sentence_chunk: # Add remaining sentences from paragraph
                        chunks.append(temp_sentence_chunk.strip())
                    current_chunk = "" # Reset current_chunk as paragraph was handled
                else: # Paragraph fits in a new chunk
                    current_chunk = paragraph
            else: # Add paragraph to current chunk
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph

            # If it's the last paragraph, add current_chunk if it has content
            if para_idx == len(paragraphs) - 1 and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = "" # Should be empty now

        if current_chunk: # Add any remaining part
            chunks.append(current_chunk.strip())

        # Final check: ensure no chunk is empty, which can happen with multiple newlines
        return [c for c in chunks if c.strip()]

    def create_podcast(
        self,
        text: str,
        metadata: Dict[str, Any],
        conversation_config: Dict[str, Any] = None,
        longform: bool = True,
        transcript_only: bool = False,
        images: Optional[List[str]] = None,
        llm_model_name: Optional[str] = None,
        max_num_chunks: Optional[int] = None,
        min_chunk_size: Optional[int] = None,
        api_key_label: Optional[str] = None
    ) -> Optional[Tuple[str, Optional[str], int]]:
        """
        Create a podcast from raw text.
        
        Args:
            text: Text content to convert to a podcast
            metadata: Podcast metadata (title, description, etc.)
            conversation_config: Configuration for the conversation
            longform: Whether to generate a longform podcast
            transcript_only: Whether to generate a transcript only
            images: List of image paths to include
            llm_model_name: Name of the LLM model to use
            max_num_chunks: Maximum number of chunks to process
            min_chunk_size: Minimum size of each chunk
            api_key_label: Label for the API key if needed
            
        Returns:
            Tuple of (local_path, s3_url, duration) for the generated podcast file or None if failed
        """
        try:
            logger.info("Creating podcast from text")
            
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
                "text": text,
                "metadata": metadata,
                "llm_model_name": llm_model_name,
                "api_key_label": api_key_label,
                "conversation_config": conversation_config, # TTS config removed
                "transcript_only": True, # Step 1: Generate transcript only
                "longform": longform
            }
            
            logger.info("Generating transcript using podcastfy library...")
            # Generate transcript using the podcastfy library
            # Assuming this now returns the transcript string directly or a path to it.
            # Based on prompt: "assume transcript_content is the actual transcript string"
            transcript_content = generate_podcast(**podcast_args)

            if not transcript_content:
                logger.error("Transcript generation failed or returned empty content.")
                return None

            # If transcript_content is a path, read it. For now, assume it's a string.
            # TODO: Add file reading if generate_podcast with transcript_only=True returns a path.
            logger.info(f"Transcript generated. Length: {len(transcript_content)} characters.")

            # Step 2: Generate audio using Google TTS
            logger.info("Proceeding with Google Text-to-Speech generation.")

            google_api_key = self.podcast_config.get('gemini_api_key', os.environ.get('GEMINI_API_KEY'))
            if not google_api_key:
                logger.error("GEMINI_API_KEY not found in config or environment variables.")
                return None

            voice_name_speaker1 = self.podcast_config.get('voice_name_speaker1', 'Zephyr')
            voice_name_speaker2 = self.podcast_config.get('voice_name_speaker2', 'Puck')
            language_code = metadata.get('language', 'en-US')
            base_output_name, _ = os.path.splitext(os.path.basename(output_path)) # Used for chunk naming

            google_audio_file_path = None

            if len(transcript_content) > GOOGLE_TTS_CHAR_LIMIT:
                logger.info(f"Transcript content exceeds {GOOGLE_TTS_CHAR_LIMIT} characters. Splitting into chunks.")
                text_chunks = self._split_text(transcript_content, GOOGLE_TTS_CHAR_LIMIT)
                logger.info(f"Split transcript into {len(text_chunks)} chunks.")

                audio_chunk_paths = []
                for i, chunk in enumerate(text_chunks):
                    if not chunk.strip(): # Skip empty chunks that might result from splitting
                        logger.info(f"Skipping empty chunk {i+1}.")
                        continue
                    logger.info(f"Processing chunk {i+1}/{len(text_chunks)}, length: {len(chunk)} chars.")
                    # Define a unique output path for each chunk
                    chunk_output_filename = f"google_tts_{base_output_name}_part_{i+1}.mp3" # Assuming MP3
                    chunk_output_path = os.path.join(self.storage_dir, chunk_output_filename)

                    chunk_audio_path = generate_google_tts_audio(
                        google_api_key=google_api_key,
                        text_input=chunk,
                        output_filename=chunk_output_path,
                        voice_name_speaker1=voice_name_speaker1,
                        voice_name_speaker2=voice_name_speaker2,
                        language_code=language_code
                        # Consider adding sample_rate_hertz etc. if consistent across chunks
                    )
                    if chunk_audio_path:
                        audio_chunk_paths.append(chunk_audio_path)
                        logger.info(f"Successfully generated audio for chunk {i+1}: {chunk_audio_path}")
                    else:
                        logger.error(f"Failed to generate audio for chunk {i+1}. Skipping this chunk.")
                        # Decide on error handling: continue, or abort? For now, continue.

                if audio_chunk_paths:
                    logger.info("TODO: Implement ffmpeg concatenation for these files: " + str(audio_chunk_paths))
                    google_audio_file_path = audio_chunk_paths[0] # Use first chunk as placeholder
                    if len(audio_chunk_paths) > 1:
                        logger.warning(f"Concatenation not implemented. Using only the first audio chunk: {google_audio_file_path} out of {len(audio_chunk_paths)} chunks.")
                else:
                    logger.error("No audio chunks were successfully generated after splitting.")
                    google_audio_file_path = None

            else: # Text does not exceed limit, process as a single block
                logger.info("Transcript content is within character limit. Processing as a single audio file.")
                # Original output path for single file
                single_file_output_filename = f"google_tts_{base_output_name}.mp3" # Assuming MP3
                single_file_output_path = os.path.join(self.storage_dir, single_file_output_filename)

                google_audio_file_path = generate_google_tts_audio(
                    google_api_key=google_api_key,
                    text_input=transcript_content,
                    output_filename=single_file_output_path,
                    voice_name_speaker1=voice_name_speaker1,
                    voice_name_speaker2=voice_name_speaker2,
                    language_code=language_code
                )

            if not google_audio_file_path:
                logger.error("Google TTS audio generation failed (either single or chunked).")
                return None
            
            logger.info(f"Google TTS audio generated successfully at: {google_audio_file_path}")

            # Step 3: Process the generated Google TTS audio file (e.g., upload to S3)
            # The existing self.generate_podcast method handles S3 upload and returns the tuple.
            # It expects the local audio file path as the first argument.
            return self.generate_podcast(google_audio_file_path, metadata, output_path)
            
        except Exception as e:
            logger.error(f"Error creating podcast from text: {str(e)}", exc_info=True)
            return None 