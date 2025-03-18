"""
Podcast request handler.
"""
from typing import Dict, Any, List

from src.utils.logging import get_logger
from src.utils.responses import create_error_response, create_success_response
from src.podcast_processor import PodcastProcessor
from src.result_formatter import ResultFormatter
from src.config import ConfigManager

logger = get_logger(__name__)

class PodcastHandler:
    """Handler for podcast generation requests."""
    
    def __init__(self, config_manager: ConfigManager):
        """Initialize with config manager."""
        self.config_manager = config_manager
        self.processor = PodcastProcessor(config_manager)
        self.formatter = ResultFormatter()
    
    def handle_single_podcast(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single podcast request."""
        try:
            result = self._process_podcast(config)
            
            # If result is an error response, return it directly
            if isinstance(result, dict) and result.get('error', False):
                return create_error_response(400, result.get('message', 'Unknown error'))
            
            return create_success_response(result)
        except Exception as e:
            logger.error(f"Error processing podcast: {str(e)}")
            return create_error_response(500, f"Error processing podcast: {str(e)}")
    
    def handle_multiple_podcasts(self, podcast_configs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process multiple podcast configurations."""
        try:
            all_results = {}
            
            for config in podcast_configs:
                podcast_id = config.get('id', f"podcast_{len(all_results)}")
                result = self._process_podcast(config)
                all_results[podcast_id] = result
            
            response_body = self.formatter.format_multiple_podcasts_result(all_results)
            return create_success_response(response_body)
        except Exception as e:
            logger.error(f"Error processing podcasts: {str(e)}")
            return create_error_response(500, f"Error processing podcasts: {str(e)}")
    
    def _process_podcast(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Process a podcast configuration."""
        try:
            # Extract podcast type and required data
            podcast_type = config.get('type', 'url')
            
            # Prepare common parameters
            metadata = config.get('metadata', {})
            if not metadata.get('title'):
                metadata['title'] = f"Podcast_{config.get('id', 'generated')}"
            
            # Get conversation configuration
            conv_config = config.get('conversation_config')
            if not conv_config:
                conv_config = self._build_conversation_config(config, metadata)
            
            # Common processor parameters
            params = {
                'metadata': metadata,
                'conversation_config': conv_config,
                'max_num_chunks': config.get('max_chunks'),
                'min_chunk_size': config.get('min_chunk_size'),
                'longform': config.get('longform', True if podcast_type != 'url' else False)
            }
            
            # Generate podcast based on type
            result = None
            error_msg = None
            
            if podcast_type == 'url':
                urls = config.get('urls', [])
                if not urls:
                    error_msg = 'No URLs provided for URL podcast type'
                else:
                    result = self.processor.create_podcast(urls=urls, **params)
                    
            elif podcast_type == 'text':
                text = config.get('text', '')
                if not text:
                    error_msg = 'No text provided for TEXT podcast type'
                else:
                    result = self.processor.create_podcast_from_text(
                        text=text, 
                        images=config.get('images'),
                        **params
                    )
                    
            elif podcast_type == 'telegram':
                telegram_data = config.get('telegram_data', {})
                if not telegram_data:
                    error_msg = 'No Telegram data provided for TELEGRAM podcast type'
                else:
                    result = self.processor.create_podcast_from_telegram_data(
                        telegram_data=telegram_data,
                        **params
                    )
            else:
                error_msg = f'Unsupported podcast type: {podcast_type}'
            
            # Handle errors
            if error_msg:
                return {'error': True, 'status': 'error', 'message': error_msg}
                
            # Check if podcast was created successfully
            if not result:
                return {'error': True, 'status': 'error', 'message': 'Failed to create podcast'}
            
            # Unpack result tuple (local_path, s3_url)
            local_path, s3_url = result
            
            # Format the response
            return self.formatter.format_single_podcast_result(
                podcast_id=config.get('id', 'generated'),
                local_path=local_path,
                s3_url=s3_url,
                metadata=metadata
            )
        
        except Exception as e:
            logger.error(f"Error processing podcast config: {str(e)}")
            return {
                'error': True,
                'status': 'error',
                'message': f'Error processing podcast: {str(e)}'
            }
    
    def _build_conversation_config(self, config: Dict[str, Any], metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Build conversation config from parameters."""
        return self.processor.get_conversation_config(
            podcast_name=metadata.get('title', ''),
            podcast_tagline=metadata.get('description', ''),
            output_language=config.get('language', 'en'),
            conversation_style=config.get('conversation_style', ['Engaging']),
            role_person1=config.get('host1', 'Host'),
            role_person2=config.get('host2', 'Co-host'),
            selected_techniques=config.get('techniques', ['Storytelling']),
            creativity=float(config.get('creativity', 0.7)),
            user_instructions=config.get('instructions', '')
        ) 