"""
Gemini Script Generator Service
Uses Google Gemini to generate natural conversation scripts from Telegram data
"""

import os
from typing import Dict, Any, Tuple

from google import genai
from google.genai import types
from shared.utils.logging import get_logger
from services.content_metrics import ContentMetrics, ContentPrioritizer

logger = get_logger(__name__)


class GeminiScriptGenerator:
    """Generates natural conversation scripts using Google Gemini AI"""

    def __init__(self):
        """Initialize the Google Gemini client"""
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")

        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash-001"

    def generate_script(
        self, clean_content: Dict[str, Any], podcast_config: Dict[str, Any] = None, episode_id: str = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate a natural conversation script from clean content

        Args:
            clean_content: Clean content with messages and summary
            podcast_config: Podcast configuration including language and speaker info
            episode_id: Episode ID for voice-aware script generation

        Returns:
            Tuple of (generated conversation script as string, content metrics dict)
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

        # Analyze content metrics to determine strategy
        content_metrics = ContentMetrics.analyze_content(clean_content)
        logger.info(f"[GEMINI_SCRIPT] Content metrics: {content_metrics['strategy']} strategy (ratio={content_metrics['target_ratio']:.2f})")

        # Prioritize messages if high content
        clean_content_prioritized = clean_content.copy()
        if content_metrics['category'] == 'high':
            logger.info(f"[GEMINI_SCRIPT] High content detected - prioritizing messages")
            prioritized_messages = ContentPrioritizer.select_priority_messages(
                clean_content['messages'], target_percentage=0.70
            )
            clean_content_prioritized['messages'] = prioritized_messages
            logger.info(f"[GEMINI_SCRIPT] Using top {len(prioritized_messages)}/{len(clean_content['messages'])} priority messages")

        # Generate script using AI with clean content (including TTS markup)
        script = self._generate_ai_script(clean_content_prioritized, config, episode_id, content_metrics)

        logger.info(f"[GEMINI_SCRIPT] Generated script: {len(script)} characters")
        if content_metrics['total_chars'] > 0:
            logger.info(f"[GEMINI_SCRIPT] Actual ratio: {len(script) / content_metrics['total_chars']:.2f} (target: {content_metrics['target_ratio']:.2f})")
        else:
            logger.warning(f"[GEMINI_SCRIPT] No source content to calculate ratio (generated {len(script)} chars from empty content)")

        return script, content_metrics

    def _generate_ai_script(
        self, clean_content: Dict[str, Any], podcast_config: Dict[str, Any], episode_id: str = None, content_metrics: Dict[str, Any] = None
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
            content_type=content_type,
            content_metrics=content_metrics,
            podcast_config=podcast_config
        )

        try:
            # Generate script using Gemini
            # Temperature 0.7: Balanced between creativity and coherence
            # - Lower than 0.9 reduces excessive filler content
            # - High enough to maintain natural conversational variation
            # - Helps maintain tighter focus on source material
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,  # Reduced from 0.9 to prevent slow, wordy dialogue
                    max_output_tokens=32768,  # Increased to allow longer scripts
                )
            )

            if response.text:
                cleaned_script = response.text.strip()
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
        content_type: str = 'general',
        content_metrics: Dict[str, Any] = None,
        podcast_config: Dict[str, Any] = None
    ) -> str:
        """Build the conversation script generation prompt with clean content and adaptive instructions"""
        
        # Get voice information for this episode
        voice_info = ""
        if episode_id:
            from shared.services.voice_config import VoiceConfigManager
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

        # Topic analysis and conversation structure
        topic_structure_info = ""
        topic_analysis = podcast_config.get('topic_analysis', {}) if podcast_config else {}
        if topic_analysis and topic_analysis.get('topics'):
            topics = topic_analysis.get('topics', [])
            structure = topic_analysis.get('conversation_structure', 'linear')
            transition_style = topic_analysis.get('transition_style', 'natural')

            topic_list = "\n".join([
                f"   {i+1}. {t['topic_name']} (importance: {t['importance']}, duration: {t['suggested_duration']})"
                for i, t in enumerate(topics)
            ])

            structure_descriptions = {
                'single_topic': 'Focus deeply on one main subject throughout',
                'linear': 'Cover topics in chronological or logical order',
                'thematic_clusters': 'Group related topics together for thematic flow',
                'narrative_arc': 'Build a story from introduction to climax to conclusion'
            }

            transition_guidance = {
                'seamless': 'Make topics flow naturally into each other without explicit announcements',
                'explicit': 'Use clear transitions like "Moving on to...", "Another interesting topic is..."',
                'narrative': 'Connect topics with a story thread, showing cause-effect relationships',
                'contrast': 'Highlight differences between topics for added interest'
            }

            topic_structure_info = f"""
CONVERSATION STRUCTURE & TOPICS:

Identified Topics ({len(topics)} topics):
{topic_list}

Recommended Structure: {structure}
- {structure_descriptions.get(structure, 'Cover topics naturally')}

Transition Style: {transition_style}
- {transition_guidance.get(transition_style, 'Use natural transitions')}

TOPIC COVERAGE GUIDELINES:
1. **High Importance Topics**: Spend 40-50% of conversation time, multiple exchanges, deep dive
2. **Medium Importance Topics**: Spend 25-35% of time, adequate coverage
3. **Low Importance Topics**: Spend 10-20% of time, brief mentions or weave into other topics

TRANSITION TECHNIQUES:
- **Between High Topics**: Use [pause long], build excitement: "Now, here's something really interesting..."
- **To Medium Topics**: Natural segues: "Speaking of that...", "This reminds me of..."
- **Brief Topics**: Quick mentions: "By the way, there's also...", "Oh, and..."
- **Thematic Links**: Find connections: "What's interesting is how this relates to..."

PACING:
- Start with high-energy opening on most important topic
- Vary energy levels throughout - don't stay at one intensity
- Build to exciting moments when appropriate
- End with strong takeaway or call-to-action

Remember: The conversation should feel like a natural discussion, not a checklist!
"""

        # Get the specific role from content analysis or fallback to configured role
        actual_speaker2_role = content_analysis.get('specific_role', speaker2_role) if content_analysis else speaker2_role
        
        # Extract channel information for natural naming
        channels = clean_content.get('summary', {}).get('channels', [])
        channel_context = f" (discussing content from {', '.join(channels)})" if channels else ""

        # Add adaptive instructions based on content metrics
        adaptive_instructions = ""
        if content_metrics:
            strategy = content_metrics['strategy']
            target_ratio = content_metrics['target_ratio']
            message_count = content_metrics['message_count']
            total_chars = content_metrics['total_chars']
            target_chars = content_metrics['target_script_chars']

            if strategy == 'compression':
                adaptive_instructions = f"""
⚠️ CONTENT VOLUME ALERT: HIGH ({message_count} messages, {total_chars} characters)

**🎯 COMPRESSION STRATEGY REQUIRED:**
1. Coverage Mode: SELECTIVE
   - Focus ONLY on main topics (5-7 key topics maximum)
   - Prioritize: Breaking news, important statements, key facts
   - SKIP: Minor details, redundant information, less significant events

2. Detail Level: SUMMARY
   - Each topic: 2-3 exchanges maximum
   - Use concise summaries, avoid lengthy explanations
   - Stay focused and direct

3. Target Script Length: ~{target_chars} characters
   - Source content: {total_chars} characters
   - Target ratio: {target_ratio:.0%} (compression required - script should be SHORTER than source)
   - This means: Be MORE CONCISE than the source material

4. Quality Guidelines:
   ✅ DO: Cover 5-7 main topics thoroughly but briefly
   ✅ DO: Maintain natural conversation flow
   ❌ DON'T: Try to mention all {message_count} messages
   ❌ DON'T: Add filler or unnecessary elaboration
   ❌ DON'T: Invent details not present in the source
"""
            elif strategy == 'expansion':
                adaptive_instructions = f"""
📝 CONTENT VOLUME: LOW ({message_count} messages, {total_chars} characters)

**🎯 EXPANSION STRATEGY - STAY GROUNDED:**
1. Coverage Mode: COMPREHENSIVE
   - Cover ALL topics from the source material
   - Don't leave out any of the {message_count} messages

2. Detail Level: DETAILED
   - Each topic: 3-5 exchanges
   - Add relevant context from general knowledge
   - Discuss implications and significance
   - Include examples when appropriate

3. Target Script Length: ~{target_chars} characters
   - Source content: {total_chars} characters
   - Target ratio: {target_ratio:.0%} (moderate expansion allowed)
   - This means: You can elaborate somewhat on the source material

4. CRITICAL - Avoid "Filler" Content:
   ✅ DO: Add relevant context that enhances understanding
   ✅ DO: Discuss implications of the facts presented
   ✅ DO: Maintain engaging conversation flow
   ❌ DON'T: Invent facts not in source material
   ❌ DON'T: Add unrelated tangents
   ❌ DON'T: Use generic filler phrases just to reach length
   ❌ DON'T: Fabricate quotes or statistics

**REMEMBER: All facts and core information MUST come from the source material. Only context and implications can be added from general knowledge.**
"""
            else:  # balanced
                adaptive_instructions = f"""
⚖️ CONTENT VOLUME: BALANCED ({message_count} messages, {total_chars} characters)

**🎯 BALANCED STRATEGY:**
1. Coverage Mode: NATURAL
   - Cover all main topics naturally
   - Include important details

2. Detail Level: MODERATE
   - Each topic: 3-4 exchanges
   - Natural level of detail

3. Target Script Length: ~{target_chars} characters
   - Source content: {total_chars} characters
   - Target ratio: {target_ratio:.0%} (aim for natural 1:1 ratio)

4. Guidelines:
   ✅ DO: Maintain natural conversation flow
   ✅ DO: Stay faithful to source material
   ❌ DON'T: Over-compress or over-expand
"""

        # Build comprehensive prompt
        conversation_prompt = f"""
You are an expert podcast script writer specializing in NATURAL, UNSCRIPTED-SOUNDING conversations between two speakers.

{content_info}

{topic_structure_info}

{voice_info}

{adaptive_instructions}

CREATE AN AUTHENTIC, HUMAN-LIKE CONVERSATION SCRIPT with the following specifications:

**PODCAST DETAILS:**
- Podcast Name: {podcast_name}
- Language: {language}
- Target Duration: {target_duration} minutes
- Episode Context: {channel_context}

**SPEAKER PERSONALITIES:**
- **{speaker1_role}** ({speaker1_gender} voice):
  * Curious and engaging host persona
  * Asks insightful questions and shows genuine interest
  * Uses natural interjections ("really?", "wow", "interesting!")
  * Occasionally interrupts with excitement or clarification
  * Personality: Friendly, relatable, occasionally humorous

- **{actual_speaker2_role}** ({speaker2_gender} voice):
  * Expert with deep knowledge but approachable style
  * Explains complex topics in accessible ways
  * Shows enthusiasm for the subject matter
  * Uses examples and analogies naturally
  * Personality: Knowledgeable yet conversational, patient

**DYNAMIC BETWEEN SPEAKERS:**
- Create genuine rapport and chemistry
- Include moments of agreement ("Exactly!", "Right!", "That's a great point")
- Add friendly disagreements or different perspectives when appropriate
- Build on each other's points naturally
- Show active listening through reactions

⚠️ **CRITICAL: NO SPEAKER NAMES IN CONTENT**
- The speaker roles above (e.g., "{speaker1_role}", "{actual_speaker2_role}") are ONLY for identifying who speaks
- DO NOT invent names for the speakers (no "יובל", "רונית", "Michael", "Sarah", etc.)
- DO NOT include greetings with names (no "שלום יובל", "Hi Michael")
- DO NOT use placeholder names like "[שם]", "[name]", "___"
- Keep the dialogue natural and direct without personal names
- Speakers can refer to each other using "you" or contextual references only

**TTS MARKUP FOR EXPRESSIVE DELIVERY:**
Use markup techniques strategically to enhance natural conversation flow:

1. **Timing and Rhythm** (use sparingly - natural pauses are often implicit):
   - [pause] - For significant topic transitions or dramatic moments only
   - [extremely fast] - For excited rapid speech or lists

   Examples (minimal pause usage):
   - "That's incredible! [pause] Tell me more."
   - "אז מה שקורה פה זה..." (no pause needed for natural flow)

2. **Emotional Delivery & Tone** (use to convey speaker mood):
   - [excited] - High energy, enthusiastic delivery
   - [curious] - Inquisitive, questioning tone
   - [thoughtful] - Reflective, contemplative pace
   - [amused] - Light, humorous tone

   Examples:
   - "{speaker1_role}: [excited] Wait, really? That's amazing!"
   - "{actual_speaker2_role}: [thoughtful] Well, when you think about it..."
   - "[amused] I know, right? It's pretty wild."

3. **Emphasis and Stress**:
   - [emphasis]text[/emphasis] - Stress important words
   - Use for: numbers, names, key terms, surprising facts

   Examples:
   - "This affected [emphasis]millions[/emphasis] of users"
   - "The [emphasis]most important[/emphasis] thing to understand is..."
   - "זה השפיע על [emphasis]מיליוני[/emphasis] משתמשים"

4. **Natural Speech Patterns** (use very sparingly - excessive fillers slow dialogue):
   - Occasional filler words: "you know", "I mean", "actually" (1-2 per exchange maximum)
   - Thinking sounds: Use rarely - "hmm" only when truly needed
   - Conversational connectors: "by the way", "speaking of which"

   Examples:
   - "So, what I found interesting was..." (direct, no fillers)
   - "Yeah, I mean, that makes total sense" (minimal filler)
   - "אז מה שמעניין זה..." (clean, no unnecessary pauses)

5. **Content-Specific Markup**:
   {f"- **News Content**: [emphasis] for breaking news, [pause] before major announcements" if content_type == 'news' else ""}
   {f"- **Technology Content**: [thoughtful] for complex explanations, [excited] for innovations" if content_type == 'technology' else ""}
   {f"- **Entertainment Content**: [amused] for funny moments, [excited] for dramatic reveals" if content_type == 'entertainment' else ""}
   {f"- **Finance Content**: [emphasis] on numbers, [pause] before key statistics" if content_type == 'finance' else ""}

6. **Conversation Dynamics**:
   - Interruptions: Mid-sentence speaker changes for natural flow
   - Reactions: Quick interjections like "Oh!", "Wow!", "אוי!"
   - Building excitement: Gradually increase pace and energy
   - Transitions: Use [pause long] between major topics

**SCRIPT REQUIREMENTS FOR AUTHENTIC DIALOGUE:**

1. **Language & Style**: Write entirely in {language} with conversational, unscripted-sounding tone

2. **Natural Imperfections** (use strategically for realism, not excessively):
   - Occasional false starts: "Well, I think... actually, let me put it this way..." (1-2 per topic)
   - Mid-thought corrections: "This happened in 2023... no wait, 2024" (when contextually relevant)
   - Minimal fillers: "you know", "I mean" (maximum 1-2 per speaker turn)
   - Hebrew equivalents: "אז", "בעצם" (use naturally, not in every sentence)

3. **Conversational Dynamics**:
   - Speakers should interrupt naturally when excited
   - Build on each other's ideas: "Exactly! And to add to that..."
   - Ask follow-up questions that show genuine curiosity
   - Include small talk and banter between topics
   - React authentically: "Wow!", "No way!", "That's wild!", "באמת?!", "וואו!"

4. **Pacing and Energy** (maintain dynamic, engaging tempo):
   - Start with high energy in opening
   - Keep pace brisk and engaging - avoid slow, plodding explanations
   - Use [extremely fast] sparingly for listing or excited moments
   - Use [thoughtful] for complex topics without adding [pause]
   - Build to exciting moments with energy, not artificial pauses

5. **Personality Consistency**:
   - {speaker1_role} should sound curious, ask questions, guide the conversation
   - {actual_speaker2_role} should share knowledge but remain approachable
   - Each speaker maintains consistent "voice" throughout
   - Include personal touches: "That reminds me of...", "I recently read..."

6. **Content Integration**:
   - Weave facts naturally into conversation, don't list them
   - Use analogies and examples to explain complex ideas
   - Connect different topics with natural transitions
   - Reference earlier points: "Like you mentioned earlier..."

7. **TTS Markup Integration** (strategic use for impact):
   - Apply markup naturally - quality over quantity
   - Use 1-2 emotion tags per speaker turn (not every sentence)
   - Prioritize [excited], [thoughtful], [emphasis] for key moments
   - Use [pause] rarely - only for major topic transitions

**CONTENT TO DISCUSS:**
{self._format_clean_content_for_prompt(clean_content)}

{additional_instructions}

**OUTPUT FORMAT:**
Provide ONLY the conversation script with embedded TTS markup. No explanations or metadata.
Use this format (the roles are IDENTIFIERS ONLY, not names to be spoken):

{speaker1_role}: [pause short] Opening statement about the topic...
{actual_speaker2_role}: [pause] Response with [emphasis]key point[/emphasis]...
{speaker1_role}: That's interesting! Tell me more...
{actual_speaker2_role}: [pause short] Well, let me explain...

REMEMBER: The script content should NEVER include the speakers' names or invented names. The roles ({speaker1_role}, {actual_speaker2_role}) are only format markers.

---

**EXAMPLES OF NATURAL DIALOGUE PATTERNS:**

Example 1 - Excited Discovery (English):
{speaker1_role}: [excited] Wait, so you're telling me this actually happened? That's incredible!
{actual_speaker2_role}: [amused] I know, right? When I first heard about it, I thought, no way this is real.
{speaker1_role}: [curious] Okay, so walk me through this... how did it all start?

Example 2 - Thoughtful Explanation (English):
{actual_speaker2_role}: [thoughtful] Well, it's a bit more complex than that. Think of it this way...
{speaker1_role}: Okay, I think I'm following.
{actual_speaker2_role}: Right! So basically, what we're seeing is... actually, let me give you an example.

Example 3 - Natural Hebrew Conversation:
{speaker1_role}: [excited] רגע, אז אתה אומר שזה באמת קרה? זה לא יאומן!
{actual_speaker2_role}: [amused] כן! גם אני בהתחלה חשבתי, בטח זה לא אמיתי.
{speaker1_role}: [curious] אוקיי, אז תסביר לי... איך זה התחיל?
{actual_speaker2_role}: [thoughtful] אז בעצם, זה קצת יותר מסובך. תחשוב על זה ככה...

Example 4 - Building on Each Other:
{speaker1_role}: That's a really good point about the technology side.
{actual_speaker2_role}: Exactly! And to add to that, there's also the human factor we need to consider.
{speaker1_role}: Oh, like the [emphasis]user experience[/emphasis] aspect?
{actual_speaker2_role}: [excited] Yes! You nailed it. That's exactly what I'm talking about.

Example 5 - Natural Interruption:
{actual_speaker2_role}: So the main issue here is that the system wasn't designed to—
{speaker1_role}: [excited] Wait wait wait, before you continue, can you clarify what you mean by "system"?
{actual_speaker2_role}: Oh, good question! I'm talking about the entire infrastructure that...

KEY PATTERNS TO EMULATE:
- Start strong with energy and curiosity
- Layer in emotional markers authentically
- Use [pause] only for major transitions (1-2 per topic maximum)
- Build natural back-and-forth rhythm without excessive pauses
- Keep dialogue tight and focused - avoid filler
- Vary sentence length and structure
- Add connective tissue between topics without slowing pace

Now, create the conversation script following ALL the guidelines above:
"""

        return conversation_prompt

    def _validate_script_content(self, script: str) -> None:
        """
        Validate that the script doesn't contain placeholder text, invented names, or incomplete content

        Args:
            script: The generated script text

        Raises:
            Exception: If placeholder text or problematic patterns are detected
        """
        # Common placeholder patterns in Hebrew and English
        placeholder_patterns = [
            "שם המשפחה",  # family name in Hebrew
            "שם פרטי",     # first name in Hebrew
            "[שם האורח]",  # name placeholder
            "[שם]",        # name placeholder
            "[insert",     # common bracket placeholders
            "[name]",      # name placeholder
            "[family name]", # family name placeholder
            "[first name]", # first name placeholder
            "___",         # underscores for filling
            "וכו'",        # Hebrew etc. (often indicates incomplete content)
            "TBD",         # To Be Determined
            "TODO",        # TODO items
            "<placeholder>", # XML-style placeholders
            "{name}",      # Template-style placeholders
            "{family}",    # Template-style placeholders
        ]

        script_lower = script.lower()

        for pattern in placeholder_patterns:
            if pattern.lower() in script_lower:
                logger.error(f"[GEMINI_SCRIPT] Detected placeholder pattern: '{pattern}' in script")
                raise Exception(f"Script contains placeholder text: '{pattern}'. This indicates incomplete generation. Please regenerate.")

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


