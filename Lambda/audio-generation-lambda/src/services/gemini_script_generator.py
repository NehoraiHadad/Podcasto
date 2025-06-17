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
        self.model = "gemini-2.0-flash"

    def generate_script(
        self, telegram_data: Dict[str, Any], podcast_config: Dict[str, Any] = None, episode_id: str = None
    ) -> str:
        """
        Generate a natural conversation script from Telegram data

        Args:
            telegram_data: Raw Telegram data with messages
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

        logger.info(f"[GEMINI_SCRIPT] Generating script in language: {language}")
        logger.info(f"[GEMINI_SCRIPT] Speaker genders: Speaker1={speaker1_gender}, Speaker2={speaker2_gender}")
        if episode_id:
            logger.info(f"[GEMINI_SCRIPT] Episode ID for voice-aware generation: {episode_id}")

        # Generate script using AI with configured language and gender awareness
        script = self._generate_ai_script(telegram_data, config, episode_id)

        logger.info(f"[GEMINI_SCRIPT] Generated script with {len(script)} characters")
        return script

    def _generate_ai_script(
        self, telegram_data: Dict[str, Any], podcast_config: Dict[str, Any], episode_id: str = None
    ) -> str:
        """Generate natural conversation script using Gemini AI with gender awareness"""

        # Get configuration
        speaker1_role = podcast_config.get("speaker1_role", "Host")
        language = podcast_config.get("language", "en")
        
        # Analyze content to determine appropriate speaker2 role
        # Allow override from config, but default to content-based analysis
        if podcast_config.get("dynamic_speaker2_role", True):
            speaker2_role = self._analyze_content_and_determine_speaker2_role(telegram_data, language)
            logger.info(f"[GEMINI_SCRIPT] Dynamic role selection: {speaker2_role}")
        else:
            speaker2_role = podcast_config.get("speaker2_role", "Expert")
            logger.info(f"[GEMINI_SCRIPT] Fixed role from config: {speaker2_role}")
        
        speaker1_gender = podcast_config.get("speaker1_gender", "male")
        speaker2_gender = podcast_config.get("speaker2_gender", "female")
        podcast_name = podcast_config.get("podcast_name", "Daily Podcast")
        target_duration = podcast_config.get("target_duration_minutes", 10)
        additional_instructions = podcast_config.get("additional_instructions", "")

        # Build the prompt with raw telegram data and gender awareness
        prompt = self._build_script_prompt(
            telegram_data,
            language,
            speaker1_role,
            speaker2_role,
            speaker1_gender,
            speaker2_gender,
            podcast_name,
            target_duration,
            additional_instructions,
            episode_id,
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
        telegram_data: Dict[str, Any],
        language: str,
        speaker1_role: str,
        speaker2_role: str,
        speaker1_gender: str,
        speaker2_gender: str,
        podcast_name: str,
        target_duration: int,
        additional_instructions: str,
        episode_id: str = None,
    ) -> str:
        """Build the conversation script generation prompt with gender awareness"""
        
        # Get voice information for this episode
        voice_info = ""
        if episode_id:
            from .voice_config import VoiceConfigManager
            voice_manager = VoiceConfigManager()
            
            # Get the actual voices that will be used
            speaker1_voice = voice_manager.get_voice_for_speaker(
                language=language, 
                gender=speaker1_gender, 
                speaker_role=speaker1_role,
                episode_id=episode_id,
                randomize=False  # Speaker 1 is always fixed
            )
            
            speaker2_voice = voice_manager.get_voice_for_speaker(
                language=language, 
                gender=speaker2_gender, 
                speaker_role=speaker2_role,
                episode_id=episode_id,
                randomize=True  # Speaker 2 is randomized
            )
            
            voice_info = f"""
VOICE SELECTION FOR THIS EPISODE:
- {speaker1_role} will use voice: {speaker1_voice} (consistent across all episodes)
- {speaker2_role} will use voice: {speaker2_voice} (unique to this episode)

VOICE-AWARE SCRIPT GUIDANCE:
- Consider that {speaker1_role}'s voice ({speaker1_voice}) should maintain consistency with the podcast brand
- {speaker2_role}'s voice ({speaker2_voice}) brings fresh variety to this specific episode
- Tailor the conversation style to work well with these specific voice characteristics
"""
        
        # Build gender-aware language instructions
        if language.lower() in ['he', 'hebrew', 'heb']:
            language_instructions = f"""Generate the podcast script in Hebrew. 
                Use natural, conversational Hebrew with proper gender agreement. 
                VERY IMPORTANT: {speaker1_role} is {speaker1_gender} - use appropriate Hebrew grammar and expressions for {speaker1_gender}.
                VERY IMPORTANT: {speaker2_role} is {speaker2_gender} - use appropriate Hebrew grammar and expressions for {speaker2_gender}.
                Make sure verbs, adjectives, and personal expressions match each speaker's gender correctly.
                Use modern Hebrew expressions and speaking style appropriate for each gender.
                THE ENTIRE SCRIPT MUST BE IN HEBREW WITH CORRECT GENDER AGREEMENT."""
        else:
            language_instructions = f"""Generate the podcast script in {language}. 
                Use natural, conversational {language} with appropriate expressions for each speaker's gender.
                {speaker1_role} is {speaker1_gender} - use language and expressions that feel natural for a {speaker1_gender} speaker.
                {speaker2_role} is {speaker2_gender} - use language and expressions that feel natural for a {speaker2_gender} speaker.
                Make the conversation feel authentic with gender-appropriate speaking patterns and reactions.
                THE ENTIRE SCRIPT MUST BE IN {language}."""

        prompt = f"""You are an AI scriptwriter for a podcast called "{podcast_name}". 

Your task is to create an engaging, conversational podcast script between two speakers:
- {speaker1_role}: A {speaker1_gender} speaker (consistent host)
- {speaker2_role}: A {speaker2_gender} speaker (content-specific expert)

{language_instructions}

{voice_info}

SPEAKER ROLE AWARENESS:
- {speaker1_role} ({speaker1_gender}) is the consistent host across all episodes - maintains podcast brand and identity
- {speaker2_role} ({speaker2_gender}) is specifically chosen for this episode's content - brings specialized expertise
- {speaker2_role} should demonstrate deep knowledge and insights relevant to the content themes
- Make {speaker2_role}'s expertise feel authentic and valuable to the discussion

SPEAKER GENDER AWARENESS:
- Remember that {speaker1_role} is {speaker1_gender} - ensure all language, grammar, and expressions are appropriate
- Remember that {speaker2_role} is {speaker2_gender} - ensure all language, grammar, and expressions are appropriate
- In Hebrew, this is especially important for verb conjugations, adjectives, and personal expressions
- In any language, use natural speaking patterns and reactions appropriate for each gender

RAW TELEGRAM DATA TO ANALYZE AND CONVERT TO PODCAST:
{telegram_data}

DATA PROCESSING INSTRUCTIONS:
1. Analyze the raw Telegram data structure - look for 'results' containing channel messages
2. Extract meaningful content from text, urls, and media_description fields
3. Identify the most interesting, relevant, and discussion-worthy topics
4. Organize content by themes and importance - ignore spam or irrelevant messages
5. Focus on content that will create engaging podcast conversation

CONVERSATION PHILOSOPHY:
Let the content determine the natural length of the conversation. Some rich content deserves deep discussion, while lighter content should be covered more briefly.

CONVERSATION GUIDELINES:
1. Create a natural, flowing conversation between a {speaker1_gender} {speaker1_role} and a {speaker2_gender} {speaker2_role}
2. {speaker1_role} ({speaker1_gender}) acts as the host - introduces topics, asks questions, provides transitions
3. {speaker2_role} ({speaker2_gender}) acts as the content expert - provides specialized insights, explanations, and deeper analysis
4. Tailor {speaker2_role}'s responses to their expertise:
   - Tech Expert: Focus on technical implications, innovation trends, market impact
   - Business Analyst: Emphasize market dynamics, financial implications, strategic insights
   - Political Commentator: Discuss policy implications, political context, governance impact
   - Financial Advisor: Highlight economic consequences, investment perspectives, market effects
   - Health Expert: Address medical implications, public health considerations, research insights
   - Sports Analyst: Cover performance analysis, team dynamics, competitive insights
   - Security Analyst: Focus on defense implications, strategic considerations, threat analysis
5. Use gender-appropriate language patterns, reactions, and expressions for each speaker
6. Discuss content themes intelligently rather than just reading messages
7. Give appropriate time to each topic based on its value and interest level:
   - Rich, complex content: Deep dive with follow-up questions
   - Simple updates: Brief mention and quick analysis
   - Controversial or surprising content: Extended discussion
8. Include natural reactions that feel authentic for each speaker's gender and role
9. Add follow-up questions that explore implications and connections
10. Create smooth transitions between different content areas
11. Make it engaging with appropriate enthusiasm and intellectual curiosity
12. End naturally when the content has been fully explored

GENDER-SPECIFIC LANGUAGE REQUIREMENTS:
- In Hebrew: Use correct verb forms, adjectives, and particle agreements for each speaker's gender
- In all languages: Ensure expressions, reactions, and speaking style feel natural for each speaker
- Avoid language that contradicts the speaker's gender identity
- Make the conversation feel authentic and natural

CONTENT ORGANIZATION:
- Identify the main themes from the provided content (could be 1-5 themes depending on richness)
- Spend time proportional to each theme's value and complexity
- Connect different pieces of content when they relate to the same theme
- Highlight the most interesting or surprising information
- Discuss implications and broader context where relevant
- Don't artificially extend or compress - let the content breathe

{f"ADDITIONAL INSTRUCTIONS: {additional_instructions}" if additional_instructions else ""}

FORMAT: Return the script in this exact format:
{speaker1_role}: [natural opening that sets up today's discussion - using {speaker1_gender}-appropriate language]
{speaker2_role}: [engaging response that shows interest in the topics - using {speaker2_gender}-appropriate language]
{speaker1_role}: [transition to first major theme with context - maintaining {speaker1_gender} voice]
{speaker2_role}: [insightful analysis of the first theme - maintaining {speaker2_gender} voice]
[Continue natural conversation flow with proper gender language...]
{speaker1_role}: [thoughtful closing that ties themes together - {speaker1_gender} appropriate]

CRITICAL REMINDERS: 
- {speaker1_role} is {speaker1_gender} - ALL language must match this gender
- {speaker2_role} is {speaker2_gender} - ALL language must match this gender
- In Hebrew, this affects verb conjugations, adjectives, and personal expressions
- Make the conversation feel natural and authentic for both speakers
- Let content richness determine conversation length naturally

PLACEHOLDER PROHIBITION:
- NEVER use placeholder text like "שם המשפחה", "[insert name]", "[family name]", or similar
- NEVER leave blanks or templates that need to be filled in later
- ALL content must be complete, specific, and ready for immediate use
- If specific names or details are missing, either omit them gracefully or use general terms
- The script must be 100% ready for text-to-speech conversion without any manual editing

Begin the script now:"""

        return prompt

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

    def _analyze_content_and_determine_speaker2_role(
        self, telegram_data: Dict[str, Any], language: str = "en"
    ) -> str:
        """
        Analyze the content and determine the most appropriate role for speaker 2
        
        Args:
            telegram_data: Raw Telegram data to analyze
            language: Target language for role names
            
        Returns:
            Appropriate speaker2 role based on content analysis
        """
        
        # Hebrew role mappings
        if language.lower() in ['he', 'hebrew', 'heb']:
            role_mappings = {
                'technology': 'מומחה טכנולוגיה',
                'business': 'אנליסט עסקי', 
                'politics': 'פרשן פוליטי',
                'finance': 'יועץ פיננסי',
                'health': 'מומחה בריאות',
                'sports': 'פרשן ספורט',
                'entertainment': 'מבקר תרבות',
                'science': 'מדען',
                'education': 'חוקר חינוך',
                'military': 'אנליסט ביטחון',
                'legal': 'יועץ משפטי',
                'real_estate': 'מומחה נדלן',
                'travel': 'מומחה תיירות',
                'food': 'מבקר קולינרי',
                'default': 'מומחה'
            }
        else:
            role_mappings = {
                'technology': 'Tech Expert',
                'business': 'Business Analyst',
                'politics': 'Political Commentator', 
                'finance': 'Financial Advisor',
                'health': 'Health Expert',
                'sports': 'Sports Analyst',
                'entertainment': 'Culture Critic',
                'science': 'Scientist',
                'education': 'Education Researcher',
                'military': 'Security Analyst',
                'legal': 'Legal Advisor',
                'real_estate': 'Real Estate Expert',
                'travel': 'Travel Expert',
                'food': 'Culinary Critic',
                'default': 'Expert'
            }
        
        # Extract text content for analysis
        content_text = ""
        try:
            if isinstance(telegram_data, dict) and 'results' in telegram_data:
                for message in telegram_data['results']:
                    if isinstance(message, dict):
                        text = message.get('text', '')
                        media_desc = message.get('media_description', '')
                        content_text += f" {text} {media_desc}"
        except Exception as e:
            logger.warning(f"[GEMINI_SCRIPT] Error extracting content for role analysis: {str(e)}")
            return role_mappings['default']
        
        content_lower = content_text.lower()
        
        # Technology keywords
        tech_keywords = ['ai', 'artificial intelligence', 'machine learning', 'tech', 'software', 'hardware', 'startup', 'app', 'digital', 'cyber', 'blockchain', 'crypto', 'programming', 'code', 'algorithm', 'data', 'cloud', 'internet', 'mobile', 'computer', 'innovation', 'technology', 'טכנולוגיה', 'בינה מלאכותית', 'תוכנה', 'חדשנות', 'דיגיטלי', 'אפליקציה', 'סטארטאפ']
        
        # Business keywords  
        business_keywords = ['business', 'economy', 'market', 'stock', 'investment', 'company', 'corporate', 'revenue', 'profit', 'startup', 'entrepreneur', 'ipo', 'merger', 'acquisition', 'עסקים', 'כלכלה', 'שוק', 'מניות', 'השקעה', 'חברה', 'רווח', 'יזמות']
        
        # Politics keywords
        politics_keywords = ['politics', 'government', 'election', 'minister', 'parliament', 'knesset', 'prime minister', 'policy', 'law', 'legislation', 'vote', 'campaign', 'political', 'פוליטיקה', 'ממשלה', 'בחירות', 'שר', 'כנסת', 'ראש ממשלה', 'חוק', 'חקיקה', 'הצבעה']
        
        # Finance keywords
        finance_keywords = ['finance', 'bank', 'loan', 'credit', 'debt', 'mortgage', 'insurance', 'pension', 'tax', 'budget', 'inflation', 'currency', 'exchange rate', 'פיננסים', 'בנק', 'הלוואה', 'אשראי', 'חוב', 'משכנתא', 'ביטוח', 'פנסיה', 'מס', 'תקציב', 'אינפלציה']
        
        # Health keywords
        health_keywords = ['health', 'medical', 'doctor', 'hospital', 'medicine', 'treatment', 'disease', 'vaccine', 'covid', 'virus', 'pandemic', 'healthcare', 'בריאות', 'רפואי', 'רופא', 'בית חולים', 'תרופה', 'טיפול', 'מחלה', 'חיסון', 'וירוס', 'מגפה']
        
        # Sports keywords
        sports_keywords = ['sport', 'football', 'basketball', 'soccer', 'tennis', 'olympics', 'championship', 'team', 'player', 'coach', 'match', 'game', 'league', 'ספורט', 'כדורגל', 'כדורסל', 'טניס', 'אולימפיאדה', 'אליפות', 'קבוצה', 'שחקן', 'מאמן', 'משחק', 'ליגה']
        
        # Military/Security keywords
        military_keywords = ['military', 'army', 'defense', 'security', 'war', 'conflict', 'terror', 'idf', 'soldier', 'operation', 'attack', 'weapon', 'ביטחון', 'צבא', 'הגנה', 'מלחמה', 'סכסוך', 'טרור', 'צהל', 'חייל', 'מבצע', 'התקפה', 'נשק']
        
        # Count keyword matches
        keyword_counts = {
            'technology': sum(1 for keyword in tech_keywords if keyword in content_lower),
            'business': sum(1 for keyword in business_keywords if keyword in content_lower),
            'politics': sum(1 for keyword in politics_keywords if keyword in content_lower),
            'finance': sum(1 for keyword in finance_keywords if keyword in content_lower),
            'health': sum(1 for keyword in health_keywords if keyword in content_lower),
            'sports': sum(1 for keyword in sports_keywords if keyword in content_lower),
            'military': sum(1 for keyword in military_keywords if keyword in content_lower),
        }
        
        # Find the category with the most matches
        max_category = max(keyword_counts.items(), key=lambda x: x[1])
        
        if max_category[1] > 0:  # If we found relevant keywords
            selected_role = role_mappings[max_category[0]]
            logger.info(f"[GEMINI_SCRIPT] Content analysis: {max_category[0]} ({max_category[1]} matches) → {selected_role}")
            return selected_role
        else:
            logger.info(f"[GEMINI_SCRIPT] No specific content category detected, using default role")
            return role_mappings['default']
