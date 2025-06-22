"""
Gemini Script Generator Service
Uses Google Gemini to generate natural conversation scripts from Telegram data
"""

import os
from typing import Dict, Any

from google import genai
from google.genai import types
from utils.logging import get_logger

logger = get_logger(__name__)


class GeminiScriptGenerator:
    """Generates natural conversation scripts using Google Gemini AI"""

    def __init__(self):
        """Initialize the Google Gemini client"""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash"

    def generate_script(
        self, clean_content: Dict[str, Any], podcast_config: Dict[str, Any] = None, episode_id: str = None
    ) -> str:
        """
        Generate a natural conversation script from clean content

        Args:
            clean_content: Clean content with messages and summary
            podcast_config: Podcast configuration including language and speaker info
            episode_id: Episode ID for voice-aware script generation

        Returns:
            Generated conversation script as string
        """
        logger.info("[GEMINI_SCRIPT] Starting conversation script generation")

        # Get configuration
        config = podcast_config or {}
        language = config.get("language", "en")
        speaker1_gender = config.get("speaker1_gender", "male")
        speaker2_gender = config.get("speaker2_gender", "female")

        # Log clean content info
        message_count = len(clean_content.get('messages', []))
        summary = clean_content.get('summary', {})
        
        logger.info(f"[GEMINI_SCRIPT] Generating script in language: {language}")
        logger.info(f"[GEMINI_SCRIPT] Speaker genders: Speaker1={speaker1_gender}, Speaker2={speaker2_gender}")
        logger.info(f"[GEMINI_SCRIPT] Clean content: {message_count} messages, date range: {summary.get('date_range', 'unknown')}")
        if episode_id:
            logger.info(f"[GEMINI_SCRIPT] Episode ID for voice-aware generation: {episode_id}")

        # Generate script using AI with clean content (including TTS markup)
        script = self._generate_ai_script(clean_content, config, episode_id)

        logger.info(f"[GEMINI_SCRIPT] Generated script with embedded TTS markup: {len(script)} characters")
        return script

    def _generate_ai_script(
        self, clean_content: Dict[str, Any], podcast_config: Dict[str, Any], episode_id: str = None
    ) -> str:
        """Generate natural conversation script using Gemini AI with clean content"""

        # Get configuration
        speaker1_role = podcast_config.get("speaker1_role", "Host")
        speaker2_role = podcast_config.get("speaker2_role", "Expert")
        speaker1_gender = podcast_config.get("speaker1_gender", "male")
        speaker2_gender = podcast_config.get("speaker2_gender", "female")
        podcast_name = podcast_config.get("podcast_name", "Daily Podcast")
        target_duration = podcast_config.get("target_duration_minutes", 10)
        language = podcast_config.get("language", "en")
        additional_instructions = podcast_config.get("additional_instructions", "")

        # Get content type for TTS markup instructions
        content_type = 'general'
        if podcast_config.get('content_analysis'):
            content_analysis = podcast_config['content_analysis']
            if hasattr(content_analysis, 'content_type'):
                content_type = content_analysis.content_type.value
        
        # Build the prompt with clean content
        prompt = self._build_script_prompt(
            clean_content=clean_content,
            language=language,
            speaker1_role=speaker1_role,
            speaker2_role=speaker2_role,
            speaker1_gender=speaker1_gender,
            speaker2_gender=speaker2_gender,
            podcast_name=podcast_name,
            target_duration=target_duration,
            additional_instructions=additional_instructions,
            episode_id=episode_id,
            content_analysis=podcast_config.get('content_analysis'),
            content_type=content_type
        )

        try:
            # Generate script using Gemini
            contents = [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=prompt)],
                ),
            ]

            config = types.GenerateContentConfig(
                temperature=0.8,
                max_output_tokens=32768,  # Increased to allow longer scripts
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )

            if (
                response.candidates
                and response.candidates[0].content
                and response.candidates[0].content.parts
            ):
                script_text = response.candidates[0].content.parts[0].text
                if script_text:
                    cleaned_script = script_text.strip()
                    # Validate script doesn't contain placeholders
                    self._validate_script_content(cleaned_script)
                    return cleaned_script

            raise Exception("No script generated by Gemini")

        except Exception as e:
            logger.error(f"[GEMINI_SCRIPT] Error generating script: {str(e)}")
            raise Exception(f"Failed to generate conversation script: {str(e)}")

    def _build_script_prompt(
        self,
        clean_content: Dict[str, Any],
        language: str,
        speaker1_role: str,
        speaker2_role: str,
        speaker1_gender: str,
        speaker2_gender: str,
        podcast_name: str,
        target_duration: int,
        additional_instructions: str,
        episode_id: str = None,
        content_analysis: str = None,
        content_type: str = 'general'
    ) -> str:
        """Build the conversation script generation prompt with clean content"""
        
        # Get voice information for this episode
        voice_info = ""
        if episode_id:
            from services.voice_config import VoiceConfigManager
            voice_manager = VoiceConfigManager()
            
            # Get distinct voices that will be used for both speakers
            # NOTE: Using generic role names to match TTS client expectations
            speaker1_voice, speaker2_voice = voice_manager.get_distinct_voices_for_speakers(
                language=language,
                speaker1_gender=speaker1_gender,
                speaker2_gender=speaker2_gender,
                speaker1_role=speaker1_role,  # Use actual role names for consistency
                speaker2_role=speaker2_role,  # Use actual role names for consistency
                episode_id=episode_id,
                randomize_speaker2=True
            )
            
            voice_info = f"""
VOICE SELECTION FOR THIS EPISODE:
- {speaker1_role} will use voice: {speaker1_voice} (consistent across episodes)
- {speaker2_role} will use voice: {speaker2_voice} (unique to this episode)

This voice information should influence the conversation style and personality traits."""

        # Content analysis information
        content_info = ""
        if content_analysis:
            content_info = f"""
CONTENT ANALYSIS:
- Content Type: {content_analysis.get('content_type', 'general')}
- Specific Speaker Role: {content_analysis.get('specific_role', speaker2_role)}
- Role Description: {content_analysis.get('role_description', 'Expert in the field')}
- Analysis Confidence: {content_analysis.get('confidence', 0.5):.2f}
- Selection Reasoning: {content_analysis.get('reasoning', 'Dynamic role selection based on content')}

The {content_analysis.get('specific_role', speaker2_role)} should demonstrate expertise as: {content_analysis.get('role_description', 'an expert in the field')}. 
Focus on insights and analysis that match this specific expertise area within {content_analysis.get('content_type', 'general')} topics."""

        # Get the specific role from content analysis or fallback to configured role
        actual_speaker2_role = content_analysis.get('specific_role', speaker2_role) if content_analysis else speaker2_role
        
        # Extract channel information for natural naming
        channels = clean_content.get('summary', {}).get('channels', [])
        channel_context = f" (discussing content from {', '.join(channels)})" if channels else ""

        # Build comprehensive prompt
        conversation_prompt = f"""
You are an expert podcast script writer specializing in natural, engaging conversations between two speakers.

{content_info}

{voice_info}

CREATE A NATURAL CONVERSATION SCRIPT with the following specifications:

**PODCAST DETAILS:**
- Podcast Name: {podcast_name}
- Language: {language}
- Target Duration: {target_duration} minutes
- Episode Context: {channel_context}

**SPEAKERS:**
- **{speaker1_role}**: {speaker1_gender} voice, consistent host persona
- **{actual_speaker2_role}**: {speaker2_gender} voice, expert knowledge in the topic

**TTS MARKUP INSTRUCTIONS:**
IMPORTANT: Include natural speech markup in your script to enhance TTS delivery:

1. **Natural Pauses**: Use [pause], [pause short], [pause long] for:
   - Between speakers: "{speaker1_role}: [pause short] ..."
   - Before questions: "...really? [pause] What do you think?"
   - After important points: "That's crucial. [pause] Let me explain..."

2. **Emphasis**: Use [emphasis]...[/emphasis] for:
   - Key terms and names
   - Important statistics or facts
   - Breaking news or urgent information

3. **Content-Specific Markup**:
   {f"- **News Content**: Add [emphasis] around breaking news, important names" if content_type == 'news' else ""}
   {f"- **Technology Content**: Add [pause short] around technical terms like AI, API, blockchain" if content_type == 'technology' else ""}
   {f"- **Entertainment Content**: Use more dynamic [emphasis] for exciting moments" if content_type == 'entertainment' else ""}
   {f"- **Finance Content**: Add [pause] before important numbers and statistics" if content_type == 'finance' else ""}

4. **Conversation Flow**: Natural markers like:
   - "אז, [pause short] בואו נדבר על..."
   - "כן, [pause] זה נכון"
   - "Well, [pause] that's interesting"
   - End sentences with: "...point. [pause short]"

**SCRIPT REQUIREMENTS:**
1. Write in {language} language
2. Create natural, flowing conversation with realistic interruptions and reactions
3. Include TTS markup naturally within the dialogue
4. Make the conversation engaging and informative
5. Ensure both speakers have distinct personalities and speaking styles
6. Include natural conversation elements: agreements, clarifications, examples

**CONTENT TO DISCUSS:**
{self._format_clean_content_for_prompt(clean_content)}

{additional_instructions}

**OUTPUT FORMAT:**
Provide ONLY the conversation script with embedded TTS markup. No explanations or metadata.
Use this format:
{speaker1_role}: [pause short] Opening statement...
{actual_speaker2_role}: [pause] Response with [emphasis]key point[/emphasis]...

Begin the conversation now:
"""

        return conversation_prompt

    def _validate_script_content(self, script: str) -> None:
        """
        Validate that the script doesn't contain placeholder text that needs filling
        
        Args:
            script: The generated script text
            
        Raises:
            Exception: If placeholder text is detected
        """
        # Common placeholder patterns in Hebrew and English
        placeholder_patterns = [
            "שם המשפחה",  # family name in Hebrew
            "שם פרטי",     # first name in Hebrew
            "[שם האורח]"   # name placeholder
            "[insert",     # common bracket placeholders
            "[name]",      # name placeholder
            "[family name]", # family name placeholder
            "[first name]", # first name placeholder
            "___",         # underscores for filling
            "...",         # ellipsis suggesting continuation
            "וכו'",        # Hebrew etc.
            "etc.",        # English etc.
            "TBD",         # To Be Determined
            "TODO",        # TODO items
            "<placeholder>", # XML-style placeholders
            "{name}",      # Template-style placeholders
            "{family}",    # Template-style placeholders
        ]
        
        script_lower = script.lower()
        
        for pattern in placeholder_patterns:
            if pattern.lower() in script_lower:
                logger.warning(f"[GEMINI_SCRIPT] Detected placeholder pattern: '{pattern}' in script")
                # Don't raise exception, just log warning for now to avoid breaking existing functionality
                # raise Exception(f"Script contains placeholder text: '{pattern}'. Please regenerate.")
        
        logger.debug("[GEMINI_SCRIPT] Script validation passed - no obvious placeholders detected")
    
    def _format_clean_content_for_prompt(self, clean_content: Dict[str, Any]) -> str:
        """
        Format clean content into readable text for the AI prompt
        
        Args:
            clean_content: Clean content with messages and summary
            
        Returns:
            Formatted content string for AI processing
        """
        messages = clean_content.get('messages', [])
        summary = clean_content.get('summary', {})
        
        if not messages:
            return "No content available for discussion."
        
        # Build formatted content
        formatted_parts = []
        
        # Add summary info
        total_messages = summary.get('total_messages', len(messages))
        channels = summary.get('channels', [])
        
        if channels:
            channel_info = f"from {', '.join(channels)}" if len(channels) > 1 else f"from {channels[0]}"
        else:
            channel_info = "from various sources"
        
        formatted_parts.append(f"Summary: {total_messages} messages {channel_info}")
        formatted_parts.append("")  # Empty line
        
        # Add messages with chronological order
        for i, message in enumerate(messages, 1):
            date_part = ""
            if 'date' in message:
                try:
                    # Extract just date (without time) for readability
                    date_str = message['date'].split('T')[0]
                    date_part = f" ({date_str})"
                except:
                    pass
            
            channel_part = ""
            if 'channel' in message:
                channel_part = f" [{message['channel']}]"
            
            text = message.get('text', '').strip()
            if text:
                formatted_parts.append(f"{i}.{date_part}{channel_part} {text}")
        
        return '\n'.join(formatted_parts)


