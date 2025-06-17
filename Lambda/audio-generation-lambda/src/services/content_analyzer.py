"""
Content Analyzer Service

Analyzes Telegram content and determines appropriate speaker roles
using AI-powered content analysis with structured output.
"""

import json
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

import google.generativeai as genai

from ..utils.logging import get_logger

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
    """Result of content analysis"""
    content_type: ContentType
    speaker2_role: SpeakerRole
    confidence: float
    reasoning: str


class ContentAnalyzer:
    """Analyzes content and determines appropriate speaker roles"""
    
    # Content type to speaker role mapping
    ROLE_MAPPING = {
        ContentType.NEWS: SpeakerRole.NEWS_ANCHOR,
        ContentType.TECHNOLOGY: SpeakerRole.TECH_EXPERT,
        ContentType.FINANCE: SpeakerRole.FINANCIAL_ANALYST,
        ContentType.POLITICS: SpeakerRole.POLITICAL_COMMENTATOR,
        ContentType.SPORTS: SpeakerRole.SPORTS_COMMENTATOR,
        ContentType.HEALTH: SpeakerRole.HEALTH_EXPERT,
        ContentType.SCIENCE: SpeakerRole.SCIENCE_COMMUNICATOR,
        ContentType.ENTERTAINMENT: SpeakerRole.ENTERTAINMENT_CRITIC,
        ContentType.BUSINESS: SpeakerRole.BUSINESS_ANALYST,
        ContentType.EDUCATION: SpeakerRole.EDUCATOR,
        ContentType.LIFESTYLE: SpeakerRole.LIFESTYLE_GURU,
        ContentType.GENERAL: SpeakerRole.EXPERT,
    }
    
    def __init__(self, api_key: str):
        """Initialize content analyzer with Gemini API"""
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def analyze_content(self, telegram_data: Dict[str, Any]) -> ContentAnalysisResult:
        """
        Analyze Telegram content and determine appropriate speaker role
        
        Args:
            telegram_data: Raw Telegram data with messages
            
        Returns:
            ContentAnalysisResult with content type and speaker role
        """
        logger.info("[CONTENT_ANALYZER] Starting content analysis")
        
        try:
            # Extract content for analysis
            content_text = self._extract_content_text(telegram_data)
            
            # Analyze content using Gemini with structured output
            analysis_result = self._analyze_with_gemini(content_text)
            
            logger.info(f"[CONTENT_ANALYZER] Content classified as: {analysis_result.content_type}")
            logger.info(f"[CONTENT_ANALYZER] Selected speaker role: {analysis_result.speaker2_role}")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"[CONTENT_ANALYZER] Error analyzing content: {str(e)}")
            # Return default values on error
            return ContentAnalysisResult(
                content_type=ContentType.GENERAL,
                speaker2_role=SpeakerRole.EXPERT,
                confidence=0.5,
                reasoning="Error in analysis, using default role"
            )
    
    def _extract_content_text(self, telegram_data: Dict[str, Any]) -> str:
        """Extract text content from Telegram data for analysis"""
        try:
            messages = telegram_data.get('messages', [])
            if not messages:
                return ""
            
            # Combine all message texts
            content_parts = []
            for message in messages:
                if isinstance(message, dict):
                    text = message.get('text', '')
                    if text:
                        content_parts.append(str(text))
            
            return ' '.join(content_parts)
            
        except Exception as e:
            logger.error(f"[CONTENT_ANALYZER] Error extracting content: {str(e)}")
            return ""
    
    def _analyze_with_gemini(self, content_text: str) -> ContentAnalysisResult:
        """Analyze content using Gemini with structured output"""
        
        # Define the response schema
        response_schema = {
            "type": "object",
            "properties": {
                "content_type": {
                    "type": "string",
                    "enum": [ct.value for ct in ContentType],
                    "description": "The primary category of the content"
                },
                "confidence": {
                    "type": "number",
                    "minimum": 0.0,
                    "maximum": 1.0,
                    "description": "Confidence score for the classification (0.0-1.0)"
                },
                "reasoning": {
                    "type": "string",
                    "description": "Brief explanation of why this content type was selected"
                }
            },
            "required": ["content_type", "confidence", "reasoning"],
            "propertyOrdering": ["content_type", "confidence", "reasoning"]
        }
        
        # Build the analysis prompt
        prompt = self._build_analysis_prompt(content_text)
        
        try:
            # Generate content with structured output
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema
                )
            )
            
            # Parse the response
            result_data = json.loads(response.text)
            
            # Map content type to speaker role
            content_type = ContentType(result_data['content_type'])
            speaker2_role = self.ROLE_MAPPING.get(content_type, SpeakerRole.EXPERT)
            
            return ContentAnalysisResult(
                content_type=content_type,
                speaker2_role=speaker2_role,
                confidence=result_data['confidence'],
                reasoning=result_data['reasoning']
            )
            
        except Exception as e:
            logger.error(f"[CONTENT_ANALYZER] Error in Gemini analysis: {str(e)}")
            raise
    
    def _build_analysis_prompt(self, content_text: str) -> str:
        """Build the content analysis prompt"""
        
        # Truncate content if too long
        max_content_length = 2000
        if len(content_text) > max_content_length:
            content_text = content_text[:max_content_length] + "..."
        
        prompt = f"""
You are a content classification expert. Analyze the following content and determine its primary category.

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

INSTRUCTIONS:
1. Analyze the content's main theme and subject matter
2. Select the most appropriate category from the list above
3. Provide a confidence score (0.0-1.0) based on how clear the categorization is
4. Give a brief reasoning for your classification

Consider the language and cultural context of the content when making your decision.
"""
        
        return prompt 