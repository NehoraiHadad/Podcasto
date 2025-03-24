"""
Telegram-based podcast generator.
"""
from datetime import datetime
from typing import Dict, Any, Optional, Tuple, List
from podcastfy.client import generate_podcast
import os

from src.utils.logging import get_logger
from src.generators.base_generator import BaseGenerator

logger = get_logger(__name__)

class TelegramGenerator(BaseGenerator):
    """
    Generate podcasts from Telegram content.
    """
    
    def create_podcast(
        self,
        telegram_data: Dict[str, Any],
        metadata: Dict[str, Any],
        conversation_config: Dict[str, Any] = None,
        longform: bool = False,
        max_num_chunks: Optional[int] = None,
        min_chunk_size: Optional[int] = None
    ) -> Optional[Tuple[str, Optional[str]]]:
        """
        Create a podcast from Telegram data.
        
        Args:
            telegram_data: Telegram data structure
            metadata: Podcast metadata (title, description, etc.)
            conversation_config: Configuration for the conversation
            longform: Whether to generate a longform podcast
            max_num_chunks: Maximum number of chunks to process
            min_chunk_size: Minimum size of each chunk
            
        Returns:
            Tuple of (local_path, s3_url) for the generated podcast file or None if failed
        """
        try:
            logger.info("Creating podcast from Telegram data")
            
            # Prepare API environment
            if not self.prepare_api_environment():
                return None
            
            # Check if we have results in the Telegram data
            if 'results' not in telegram_data:
                logger.error("No 'results' field found in Telegram data")
                return None
                
            # Process the Telegram results into text
            content = self._process_telegram_results(telegram_data['results'])
            if not content:
                logger.error("Failed to process Telegram data, no text extracted")
                return None
            
            # Create a custom title if not provided
            if "title" not in metadata:
                metadata["title"] = f"Telegram_Podcast_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
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
                
            logger.info("Conversation config:")
            for key, value in conversation_config.items():
                logger.info(f"  {key}: {value}")
                
            # Generate podcast using the podcastfy library
            audio_file = generate_podcast(
                text=content,
                conversation_config={
                    **conversation_config,
                    "text_to_speech": {
                        "temp_audio_dir": "../../../../../../../../../../../../tmp/podcastify-demo/tmp",
                        "output_directories": {
                            "transcripts": "/tmp/podcastify-demo/transcripts",
                            "audio": "/tmp/podcastify-demo/audio"
                        }
                    }
                },
                longform=longform
            )
            
            # Process generated file and upload to S3
            return self.generate_podcast(audio_file, metadata, output_path)
                
        except Exception as e:
            logger.error(f"Error creating podcast from Telegram data: {str(e)}")
            return None

    def _process_telegram_results(self, results: Dict[str, List[Dict[str, Any]]]) -> str:
        """
        Process Telegram results to create content for podcast generation
        
        Args:
            results: Results from Telegram data
            
        Returns:
            Processed content as a string
        """
        content_parts = []
        
        # Process each channel
        for channel_name, messages in results.items():
            content_parts.append(f"# Content from channel {channel_name}")
            content_parts.append("")
            
            # Skip processing if there are no messages
            if not messages or not isinstance(messages, list):
                content_parts.append("No messages found in this channel.")
                content_parts.append("---")
                content_parts.append("")
                continue
            
            # Sort messages by date if possible
            try:
                sorted_messages = sorted(messages, key=lambda x: x.get('date', ''))
            except Exception:
                # If sorting fails, use the original order
                sorted_messages = messages
            
            # Process each message
            for message in sorted_messages:
                if not isinstance(message, dict):
                    continue
                
                message_text = message.get('text', '')
                if not message_text:
                    continue
                
                # Add date if available
                date_str = message.get('date', '')
                if date_str:
                    try:
                        # Parse ISO format date and format it
                        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        formatted_date = date_obj.strftime("%d/%m/%Y %H:%M")
                        content_parts.append(f"## {formatted_date}")
                    except Exception:
                        # If date parsing fails, use the original string
                        content_parts.append(f"## {date_str}")
                
                # Add message text
                content_parts.append(message_text)
                
                # Add media info if available
                media_info = message.get('media_info')
                if media_info and isinstance(media_info, str) and not media_info.startswith("[Video:"):
                    content_parts.append(f"[Media attached: {media_info}]")
                
                # Add URLs if available
                urls = message.get('urls', [])
                if urls and isinstance(urls, list):
                    content_parts.append("Links:")
                    for url in urls:
                        content_parts.append(f"- {url}")
                
                # Add separator between messages
                content_parts.append("---")
                content_parts.append("")
        
        # Return empty string if no content was processed
        if not content_parts:
            return ""
            
        # Join all parts with newlines
        return "\n".join(content_parts) 