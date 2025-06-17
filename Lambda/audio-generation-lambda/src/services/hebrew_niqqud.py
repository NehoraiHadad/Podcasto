"""
Hebrew Niqqud Processing Module
Handles Hebrew text diacritical marks (niqqud) processing for improved TTS accuracy
Based on Dicta API integration for Hebrew text vocalization
"""
import re
import json
from functools import wraps
from typing import Optional

import requests
from cachier import cachier

from utils.logging import get_logger

logger = get_logger(__name__)

# Hebrew Unicode Characters
SHVA = '\u05B0'
REDUCED_SEGOL = '\u05B1'
REDUCED_PATAKH = '\u05B2'
REDUCED_KAMATZ = '\u05B3'
HIRIK = '\u05B4'
TZEIRE = '\u05B5'
SEGOL = '\u05B6'
PATAKH = '\u05B7'
KAMATZ = '\u05B8'
HOLAM = '\u05B9'
KUBUTZ = '\u05BB'
SHURUK = '\u05BC'
METEG = '\u05BD'
SHIN_YEMANIT = '\u05c1'
SHIN_SMALIT = '\u05c2'
DAGESH = '\u05bc'


class HebrewNiqqudProcessor:
    """Hebrew text processor for adding niqqud (diacritical marks)"""
    
    def __init__(self):
        """Initialize the Hebrew niqqud processor"""
        self.dicta_url = 'https://nakdan-2-0.loadbalancer.dicta.org.il/api'
        self.max_chunk_length = 10000
        
    def remove_niqqud(self, text: str) -> str:
        """Remove existing niqqud from Hebrew text"""
        return re.sub('[\u05B0-\u05BC\u05C1\u05C2ׇ\u05c7]', '', text)
    
    def is_hebrew_text(self, text: str) -> bool:
        """Check if text contains Hebrew characters"""
        hebrew_pattern = re.compile(r'[\u0590-\u05FF]')
        return bool(hebrew_pattern.search(text))
    
    def split_by_length(self, characters: str, maxlen: int):
        """Split text into chunks respecting word boundaries"""
        assert maxlen > 1
        out = []
        space = maxlen
        for c in characters:
            if c == ' ':
                space = len(out)
            out.append(c)
            if len(out) == maxlen - 1:
                yield out[:space+1]
                out = out[space+1:]
        if out:
            yield out
    
    def piecewise(self, maxlen: int):
        """Decorator for processing text in chunks"""
        def inner(fetch_func):
            @wraps(fetch_func)
            def fetcher(text):
                chunks = list(self.split_by_length(text, maxlen))
                results = []
                for chunk in chunks:
                    chunk_text = ''.join(chunk).strip()
                    if chunk_text:
                        result = fetch_func(chunk_text)
                        results.append(result)
                return ' '.join(results)
            return fetcher
        return inner
    
    def extract_word(self, word_data: dict) -> str:
        """Extract the best vocalized option from Dicta API response"""
        if word_data.get('options'):
            result = word_data['options'][0][0]
            result = result.replace('|', '')
            result = result.replace(KUBUTZ + 'ו' + METEG, 'ו' + SHURUK)
            result = result.replace(HOLAM + 'ו' + METEG, 'ו' + HOLAM)
            result = result.replace(METEG, '')
            
            result = re.sub(KAMATZ + 'ו' + '(?=[א-ת])', 'ו' + HOLAM, result)
            result = result.replace(REDUCED_KAMATZ + 'ו', 'ו' + HOLAM)
            
            return result
        return word_data.get('word', '')
    
    @cachier()
    def fetch_dicta_raw(self, text: str) -> str:
        """Fetch niqqud from Dicta API"""
        payload = {
            "task": "nakdan",
            "genre": "modern",
            "data": text,
            "addmorph": True,
            "keepqq": False,
            "nodageshdefmem": False,
            "patachma": False,
            "keepmetagim": True,
        }
        headers = {
            'content-type': 'text/plain;charset=UTF-8'
        }
        
        try:
            logger.info(f"[NIQQUD] Calling Dicta API for text: {len(text)} characters")
            response = requests.post(self.dicta_url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            
            result = ''.join(self.extract_word(word) for word in response.json())
            
            # Validate that niqqud was actually added
            if len(self.remove_niqqud(result)) * 1.2 > len(result):
                logger.warning("[NIQQUD] Failed to add sufficient niqqud")
                raise requests.RequestException("Undotted response")
            
            logger.info(f"[NIQQUD] Successfully processed text with niqqud")
            return result
            
        except Exception as e:
            logger.error(f"[NIQQUD] Error calling Dicta API: {str(e)}")
            raise
    
    def fetch_dicta(self, text: str) -> str:
        """Fetch niqqud with chunking support"""
        piecewise_processor = self.piecewise(self.max_chunk_length)
        return piecewise_processor(self.fetch_dicta_raw)(text)
    
    def process_script_for_tts(self, script_content: str, language: str) -> str:
        """
        Process script content and add niqqud for Hebrew text
        
        Args:
            script_content: Original script content
            language: Language code (he/hebrew for Hebrew processing)
            
        Returns:
            Processed script with niqqud (for Hebrew) or original script
        """
        # Only process Hebrew text
        if language.lower() not in ['he', 'hebrew', 'heb']:
            logger.info(f"[NIQQUD] Skipping niqqud processing for language: {language}")
            return script_content
        
        # Check if text contains Hebrew characters
        if not self.is_hebrew_text(script_content):
            logger.info("[NIQQUD] No Hebrew text detected, skipping niqqud processing")
            return script_content
        
        try:
            logger.info("[NIQQUD] Processing Hebrew text for niqqud enhancement")
            processed_text = self.fetch_dicta(script_content)
            
            logger.info(f"[NIQQUD] Successfully enhanced Hebrew text: {len(script_content)} -> {len(processed_text)} chars")
            return processed_text
            
        except Exception as e:
            logger.error(f"[NIQQUD] Error processing Hebrew text: {str(e)}")
            logger.info("[NIQQUD] Falling back to original text")
            return script_content 