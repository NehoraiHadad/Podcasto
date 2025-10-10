"""
Content Analyzer Service

Analyzes Telegram content and determines appropriate speaker roles
using AI-powered content analysis with structured output.
"""

import json
from typing import Dict, Any
from dataclasses import dataclass
from enum import Enum

from google import genai
from google.genai import types

from shared.utils.logging import get_logger
from services.telegram_content_extractor import TelegramContentExtractor

logger = get_logger(__name__)


class ContentType(str, Enum):
    """Content type categories for role selection"""
    NEWS = "news"
    TECHNOLOGY = "technology"
    FINANCE = "finance"
    POLITICS = "politics"
    SPORTS = "sports"
    HEALTH = "health"
    SCIENCE = "science"
    ENTERTAINMENT = "entertainment"
    BUSINESS = "business"
    EDUCATION = "education"
    LIFESTYLE = "lifestyle"
    GENERAL = "general"


class SpeakerRole(str, Enum):
    """Available speaker roles based on content type"""
    NEWS_ANCHOR = "News Anchor"
    TECH_EXPERT = "Tech Expert"
    FINANCIAL_ANALYST = "Financial Analyst"
    POLITICAL_COMMENTATOR = "Political Commentator"
    SPORTS_COMMENTATOR = "Sports Commentator"
    HEALTH_EXPERT = "Health Expert"
    SCIENCE_COMMUNICATOR = "Science Communicator"
    ENTERTAINMENT_CRITIC = "Entertainment Critic"
    BUSINESS_ANALYST = "Business Analyst"
    EDUCATOR = "Educator"
    LIFESTYLE_GURU = "Lifestyle Guru"
    EXPERT = "Expert"  # Default fallback


@dataclass
class ContentAnalysisResult:
    """Result of content analysis with hybrid approach"""
    content_type: ContentType
    specific_role: str  # AI-generated specific role name
    role_description: str  # Description of the role's expertise
    confidence: float
    reasoning: str


class ContentAnalyzer:
    """Analyzes content and determines appropriate speaker roles using hybrid approach"""
    
    # Content type to default gender mapping for voice selection
    CATEGORY_GENDER_MAPPING = {
        ContentType.NEWS: "female",
        ContentType.TECHNOLOGY: "male", 
        ContentType.FINANCE: "male",
        ContentType.POLITICS: "female",
        ContentType.SPORTS: "male",
        ContentType.HEALTH: "female",
        ContentType.SCIENCE: "male",
        ContentType.ENTERTAINMENT: "female",
        ContentType.BUSINESS: "male",
        ContentType.EDUCATION: "female",
        ContentType.LIFESTYLE: "female",
        ContentType.GENERAL: "male",
    }
    
    # Role generation guidelines per category
    ROLE_GUIDELINES = {
        ContentType.NEWS: "News reporter, correspondent, anchor, or journalist specialist",
        ContentType.TECHNOLOGY: "Tech expert, software engineer, AI researcher, or tech analyst",
        ContentType.FINANCE: "Financial analyst, economist, market expert, or investment advisor",
        ContentType.POLITICS: "Political analyst, policy expert, or government affairs specialist",
        ContentType.SPORTS: "Sports analyst, commentator, or athletic expert",
        ContentType.HEALTH: "Medical expert, health specialist, or wellness advisor",
        ContentType.SCIENCE: "Research scientist, academic expert, or science communicator",
        ContentType.ENTERTAINMENT: "Entertainment critic, media analyst, or cultural commentator",
        ContentType.BUSINESS: "Business analyst, industry expert, or corporate strategist",
        ContentType.EDUCATION: "Educational expert, academic, or learning specialist",
        ContentType.LIFESTYLE: "Lifestyle expert, personal development coach, or wellness guru",
        ContentType.GENERAL: "Subject matter expert or knowledgeable analyst",
    }
    
    def __init__(self, api_key: str):
        """Initialize content analyzer with Gemini API using new google-genai library"""
        self.api_key = api_key
        self.client = genai.Client(api_key=api_key)
        self.content_extractor = TelegramContentExtractor()
    
    def analyze_content(self, telegram_data: Dict[str, Any]) -> ContentAnalysisResult:
        """
        Analyze Telegram content and determine appropriate speaker role using hybrid approach
        
        Args:
            telegram_data: Raw Telegram data with messages
            
        Returns:
            ContentAnalysisResult with content type and specific role
        """
        logger.info("[CONTENT_ANALYZER] Starting hybrid content analysis")
        
        try:
            # Extract content for analysis using shared extractor
            content_text = self.content_extractor.extract_content_text_only(telegram_data)
            
            if not content_text:
                logger.warning("[CONTENT_ANALYZER] No content extracted, using fallback analysis")
                return ContentAnalysisResult(
                    content_type=ContentType.GENERAL,
                    specific_role="General Expert",
                    role_description="General subject matter expert",
                    confidence=0.3,
                    reasoning="No content found for analysis, using default role"
                )
            
            # Log content sample for debugging
            content_sample = content_text[:200] + "..." if len(content_text) > 200 else content_text
            logger.info(f"[CONTENT_ANALYZER] Content sample: {content_sample}")
            logger.info(f"[CONTENT_ANALYZER] Total content length: {len(content_text)} characters")
            
            # Analyze content using Gemini with structured output
            analysis_result = self._analyze_with_gemini(content_text)
            
            logger.info(f"[CONTENT_ANALYZER] Analysis complete:")
            logger.info(f"[CONTENT_ANALYZER] - Content type: {analysis_result.content_type.value}")
            logger.info(f"[CONTENT_ANALYZER] - Specific role: {analysis_result.specific_role}")
            logger.info(f"[CONTENT_ANALYZER] - Confidence: {analysis_result.confidence:.2f}")
            logger.info(f"[CONTENT_ANALYZER] - Reasoning: {analysis_result.reasoning}")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"[CONTENT_ANALYZER] Error analyzing content: {str(e)}")
            logger.error(f"[CONTENT_ANALYZER] Using fallback default role due to error")
            # Return default values on error
            return ContentAnalysisResult(
                content_type=ContentType.GENERAL,
                specific_role="Expert Analyst",
                role_description="General subject matter expert",
                confidence=0.5,
                reasoning=f"Error in analysis ({str(e)}), using default role"
            )
    

    
    def get_gender_for_category(self, content_type: ContentType) -> str:
        """Get the default gender for a content category"""
        return self.CATEGORY_GENDER_MAPPING.get(content_type, "male")
    

    
    def _analyze_with_gemini(self, content_text: str) -> ContentAnalysisResult:
        """Analyze content using Gemini with structured output for hybrid approach"""
        
        # Define the response schema for hybrid approach using new library format
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "content_type": {
                    "type": "STRING",
                    "enum": [ct.value for ct in ContentType],
                    "description": "The primary category of the content"
                },
                "specific_role": {
                    "type": "STRING", 
                    "description": "Specific, creative role name that fits the content (e.g., 'AI Research Scientist', 'Crypto Market Analyst')"
                },
                "role_description": {
                    "type": "STRING",
                    "description": "Brief description of the role's expertise and background"
                },
                "confidence": {
                    "type": "NUMBER",
                    "description": "Confidence score for the classification (0.0-1.0)"
                },
                "reasoning": {
                    "type": "STRING",
                    "description": "Brief explanation of why this content type and role were selected"
                }
            },
            "required": ["content_type", "specific_role", "role_description", "confidence", "reasoning"]
        }
        
        # Build the analysis prompt
        prompt = self._build_analysis_prompt(content_text)
        
        try:
            # Generate content with structured output using new client-based API
            response = self.client.models.generate_content(
                model='gemini-2.0-flash-001',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.3,
                    max_output_tokens=1024
                )
            )
            
            # Parse the response
            result_data = json.loads(response.text)
            
            # Create result with hybrid data
            content_type = ContentType(result_data['content_type'])
            
            return ContentAnalysisResult(
                content_type=content_type,
                specific_role=result_data['specific_role'],
                role_description=result_data['role_description'],
                confidence=result_data['confidence'],
                reasoning=result_data['reasoning']
            )
            
        except Exception as e:
            logger.error(f"[CONTENT_ANALYZER] Error in Gemini analysis: {str(e)}")
            raise
    
    def _build_analysis_prompt(self, content_text: str) -> str:
        """Build the content analysis prompt for hybrid approach"""
        
        # Truncate content if too long
        max_content_length = 2000
        if len(content_text) > max_content_length:
            content_text = content_text[:max_content_length] + "..."
        
        prompt = f"""
You are a content classification expert. Analyze the following content and determine its primary category, then create a specific, engaging speaker role.

CONTENT TO ANALYZE:
{content_text}

AVAILABLE CATEGORIES:
- news: Breaking news, current events, journalism
- technology: Tech news, gadgets, software, AI, programming
- finance: Financial markets, economy, investments, business finance
- politics: Political news, elections, government, policy
- sports: Sports news, games, athletes, competitions
- health: Medical news, wellness, fitness, healthcare
- science: Scientific discoveries, research, academic content
- entertainment: Movies, TV, celebrities, music, arts
- business: Corporate news, entrepreneurship, industry trends
- education: Learning content, tutorials, academic topics
- lifestyle: Personal development, travel, food, fashion
- general: Mixed content or content that doesn't fit other categories

ROLE CREATION GUIDELINES:
After selecting the category, create a SPECIFIC role that matches the exact content:

For TECHNOLOGY content:
- Examples: "AI Research Scientist", "Cybersecurity Expert", "Mobile App Developer", "Cloud Computing Specialist"
- Focus on the specific tech area discussed

For NEWS content:
- Examples: "Political Correspondent", "International Affairs Reporter", "Economic News Analyst"
- Match the news domain

For FINANCE content:
- Examples: "Cryptocurrency Analyst", "Stock Market Expert", "Real Estate Investment Advisor"
- Specify the financial area

For other categories, follow similar patterns - be specific to the actual content discussed.

INSTRUCTIONS:
1. Select the primary category from the list above
2. Create a specific, professional role name that precisely matches the content
3. Write a brief role description explaining their expertise
4. Provide confidence score based on how clear the categorization is
5. Give reasoning for both category and role selection

ROLE NAMING RULES:
- Use professional, credible titles
- Be specific to the content's focus area
- Avoid generic terms when possible
- Make it sound like a real expert you'd want to hear from
- Consider Hebrew content context when relevant

Consider the language and cultural context of the content when making your decisions.
"""
        
        return prompt 