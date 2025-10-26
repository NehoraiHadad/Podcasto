"""
Telegram Content Extractor Service
Centralized content extraction from Telegram data with clean, focused output
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from shared.utils.logging import get_logger
from shared.utils.datetime_utils import now_utc, to_iso_utc

logger = get_logger(__name__)


class TelegramContentExtractor:
    """Unified service for extracting clean content from Telegram data"""
    
    def extract_clean_content(self, telegram_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract clean content from Telegram data for AI processing
        
        Args:
            telegram_data: Raw Telegram data structure
            
        Returns:
            Clean content structure with messages and summary
        """
        logger.info("[CONTENT_EXTRACTOR] Starting content extraction")
                
        # Extract messages from different data structures
        messages = self._extract_messages(telegram_data)
        
        if not messages:
            logger.warning("[CONTENT_EXTRACTOR] No messages found in data")
            return self._create_empty_content()
        
        # Sort messages by date
        sorted_messages = self._sort_messages_by_date(messages)
        
        # Create summary
        summary = self._create_summary(sorted_messages, telegram_data)
        
        clean_content = {
            "messages": sorted_messages,
            "summary": summary
        }
        
        logger.info(f"[CONTENT_EXTRACTOR] Extracted {len(sorted_messages)} messages")
        logger.info(f"[CONTENT_EXTRACTOR] Date range: {summary.get('date_range', 'unknown')}")
        
        return clean_content
    
    def _extract_messages(self, telegram_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract messages from various Telegram data structures"""
        messages = []
        
        try:
            # Handle 'results' structure (channel-based)
            if 'results' in telegram_data:
                results = telegram_data['results']
                if isinstance(results, dict):
                    for channel_name, channel_messages in results.items():
                        if isinstance(channel_messages, list):
                            messages.extend(
                                self._process_message_array(channel_messages, channel_name)
                            )
                            logger.debug(f"[CONTENT_EXTRACTOR] Processed {len(channel_messages)} messages from '{channel_name}'")
            
            # Handle direct 'messages' structure
            elif 'messages' in telegram_data:
                messages_array = telegram_data['messages']
                if isinstance(messages_array, list):
                    messages.extend(self._process_message_array(messages_array))
                    logger.debug(f"[CONTENT_EXTRACTOR] Processed {len(messages_array)} direct messages")
            
            # Fallback: search for any message arrays
            else:
                for key, value in telegram_data.items():
                    if self._is_message_array(value):
                        messages.extend(self._process_message_array(value, key))
                        logger.debug(f"[CONTENT_EXTRACTOR] Found messages in fallback key '{key}'")
        
        except Exception as e:
            logger.error(f"[CONTENT_EXTRACTOR] Error extracting messages: {str(e)}")
        
        return messages
    
    def _process_message_array(
        self, 
        message_array: List[Dict[str, Any]], 
        channel: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Process array of message objects into clean format"""
        processed_messages = []
        
        for message in message_array:
            if not isinstance(message, dict):
                continue
            
            # Extract text content
            text_content = self._extract_text_from_message(message)
            if not text_content:
                continue
            
            # Extract date
            date_str = self._extract_date_from_message(message)
            
            # Create clean message
            clean_message = {
                "text": text_content.strip(),
                "date": date_str
            }
            
            # Add channel if provided
            if channel:
                clean_message["channel"] = channel
            
            processed_messages.append(clean_message)
        
        return processed_messages
    
    def _extract_text_from_message(self, message: Dict[str, Any]) -> Optional[str]:
        """Extract text content from a message object"""
        # Try different text field names
        for field_name in ['text', 'message', 'content', 'body']:
            if field_name in message:
                text_content = message[field_name]
                
                # Handle different text formats
                if isinstance(text_content, str):
                    return text_content
                elif isinstance(text_content, dict) and 'text' in text_content:
                    return str(text_content['text'])
                elif isinstance(text_content, list):
                    # Join text parts
                    text_parts = []
                    for part in text_content:
                        if isinstance(part, str):
                            text_parts.append(part)
                        elif isinstance(part, dict) and 'text' in part:
                            text_parts.append(str(part['text']))
                    return ' '.join(text_parts)
        
        return None
    
    def _extract_date_from_message(self, message: Dict[str, Any]) -> str:
        """Extract date from message, with fallback to current time"""
        # Try different date field names
        for field_name in ['date', 'timestamp', 'created_at', 'time']:
            if field_name in message:
                date_value = message[field_name]
                
                if isinstance(date_value, str):
                    return date_value
                elif isinstance(date_value, (int, float)):
                    # Assume timestamp
                    return datetime.fromtimestamp(date_value).isoformat()
        
        # Fallback to current time
        return to_iso_utc(now_utc())
    
    def _sort_messages_by_date(self, messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort messages by date, with error handling"""
        try:
            def parse_date_for_sorting(message):
                try:
                    date_str = message.get('date', '')
                    # Remove timezone info for sorting (basic approach)
                    date_clean = date_str.split('+')[0].split('T')[0] + 'T' + date_str.split('T')[1].split('+')[0]
                    return datetime.fromisoformat(date_clean)
                except:
                    # Fallback: use current time
                    return now_utc()
            
            return sorted(messages, key=parse_date_for_sorting)
        
        except Exception as e:
            logger.warning(f"[CONTENT_EXTRACTOR] Error sorting messages by date: {str(e)}")
            return messages  # Return unsorted if sorting fails
    
    def _create_summary(
        self, 
        messages: List[Dict[str, Any]], 
        original_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create summary information about the extracted content"""
        summary = {
            "total_messages": len(messages),
            "channels": [],
            "date_range": "unknown"
        }
        
        # Extract channels
        channels = set()
        for message in messages:
            if 'channel' in message:
                channels.add(message['channel'])
        summary["channels"] = list(channels)
        
        # Create date range
        if messages:
            try:
                dates = [msg.get('date', '') for msg in messages if msg.get('date')]
                if dates:
                    first_date = dates[0].split('T')[0]
                    last_date = dates[-1].split('T')[0]
                    
                    if first_date == last_date:
                        summary["date_range"] = first_date
                    else:
                        summary["date_range"] = f"{first_date} to {last_date}"
            except Exception as e:
                logger.warning(f"[CONTENT_EXTRACTOR] Error creating date range: {str(e)}")
        
        # Add original metadata if available
        if 'total_messages' in original_data:
            summary["original_total"] = original_data['total_messages']
        
        return summary
    
    def _is_message_array(self, value: Any) -> bool:
        """Check if a value looks like a message array"""
        if not isinstance(value, list) or not value:
            return False
        
        # Check if first item looks like a message
        first_item = value[0]
        if not isinstance(first_item, dict):
            return False
        
        # Look for message-like fields
        message_fields = ['text', 'message', 'content', 'body']
        return any(field in first_item for field in message_fields)
    
    def _create_empty_content(self) -> Dict[str, Any]:
        """Create empty content structure for error cases"""
        return {
            "messages": [],
            "summary": {
                "total_messages": 0,
                "channels": [],
                "date_range": "unknown"
            }
        }
    
    def extract_content_text_only(self, telegram_data: Dict[str, Any]) -> str:
        """
        Extract only text content as string for legacy compatibility
        
        Args:
            telegram_data: Raw Telegram data
            
        Returns:
            Combined text content as string
        """
        clean_content = self.extract_clean_content(telegram_data)
        
        text_parts = []
        for message in clean_content.get('messages', []):
            text = message.get('text', '').strip()
            if text:
                text_parts.append(text)
        
        return ' '.join(text_parts) 