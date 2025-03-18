"""
Message processing module for the Telegram collector Lambda function.
"""
import re
from typing import List
from urllib.parse import urlparse


class MessageProcessor:
    """
    Processes Telegram messages by filtering, cleaning, and extracting information.
    
    This class handles the logic for determining which messages should be included
    in the results, cleaning message text, and extracting URLs and other information.
    """
    
    def __init__(self, filtered_domains: List[str] = None):
        """
        Initialize the MessageProcessor with filtering rules.
        
        Args:
            filtered_domains: Additional domains to filter out from URLs.
                              Can be simple strings or patterns with prefixes:
                              - "exact:" for exact domain match
                              - "starts:" for domains starting with the pattern
                              - "ends:" for domains ending with the pattern
                              - "contains:" or no prefix for domains containing the pattern
        """
        # Default blocked domains
        self.blocked_domains = {
            'bit.ly',
            'goo.gl',
            'tinyurl.com',
            'aliexpress.com',
            'amazon.com',
            'ebay.com',
            'shop.com',
            'buy.com'
        }
        
        # Process and add any additional filtered domains
        if filtered_domains:
            for domain in filtered_domains:
                self.blocked_domains.add(domain)
        
        self.promo_markers = [
            'תוכן פרסומי',
            'תוכן שיווקי',
            'פרסומת',
            'מודעה',
            'sponsored',
            'ad',
            'advertisement',
            'קישור לרכישה',
            'לרכישה:',
            'לרכישה כאן',
            'קנו עכשיו',
            'buy now',
            'shop now',
            'affiliate',
            '°'  # Added degree symbol as promotional marker
        ]
        
        self.promo_patterns = [
            r'₪\s*\d+',  # Price in shekels
            r'\$\s*\d+',  # Price in dollars
            r'\d+\s*₪',   # Price in shekels (reverse order)
            r'\d+\s*\$',  # Price in dollars (reverse order)
            r'(?:קופון|קוד הנחה|הנחה|מבצע):?\s*[A-Za-z0-9]+',  # Discount codes
        ]
    
    def clean_text(self, text: str) -> str:
        """
        Clean text by removing unwanted elements.
        
        Args:
            text: The text to clean
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
            
        # Remove URLs from blocked domains
        for domain in self.blocked_domains:
            text = re.sub(
                r'http[s]?://[^\s<>"]+?{0}[^\s<>"]*'.format(domain),
                '',
                text
            )
        
        # Remove other URLs but keep the text around them
        text = re.sub(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+',
            '',
            text
        )
        
        # Clean up whitespace
        text = re.sub(r'\n\s*\n', '\n\n', text)  # Remove multiple newlines
        text = text.strip()
        
        return text
    
    def _should_filter_domain(self, domain: str, pattern: str) -> bool:
        """
        Check if a domain should be filtered based on a pattern.
        
        Args:
            domain: The domain to check
            pattern: The pattern to match against
            
        Returns:
            True if the domain should be filtered, False otherwise
        """
        # Handle pattern prefixes
        if pattern.startswith("exact:"):
            return domain == pattern[6:]
        elif pattern.startswith("starts:"):
            return domain.startswith(pattern[7:])
        elif pattern.startswith("ends:"):
            return domain.endswith(pattern[5:])
        elif pattern.startswith("contains:"):
            return pattern[9:] in domain
        else:
            # Default behavior: contains
            return pattern in domain
    
    def extract_urls(self, text: str) -> List[str]:
        """
        Extract URLs from text.
        
        Args:
            text: The text to extract URLs from
            
        Returns:
            List of URLs found in the text, excluding blocked domains
        """
        if not text:
            return []
            
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        all_urls = re.findall(url_pattern, text)
        
        # Filter out URLs from blocked domains
        filtered_urls = []
        for url in all_urls:
            try:
                domain = urlparse(url).netloc
                should_filter = any(self._should_filter_domain(domain, blocked) for blocked in self.blocked_domains)
                if not should_filter:
                    filtered_urls.append(url)
            except Exception:
                # If URL parsing fails, include the URL
                filtered_urls.append(url)
                
        return filtered_urls
    
    def is_promotional(self, text: str) -> bool:
        """
        Check if the message is promotional.
        
        Args:
            text: The text to check
            
        Returns:
            True if the message is promotional, False otherwise
        """
        if not text:
            return False
            
        # Check for promotional markers
        for marker in self.promo_markers:
            if marker in text:
                return True
        
        # Check for promotional patterns
        for pattern in self.promo_patterns:
            if re.search(pattern, text):
                return True
        
        return False
        
    def should_include(self, text: str) -> bool:
        """
        Check if the message should be included in the results.
        
        Args:
            text: The text to check
            
        Returns:
            True if the message should be included, False otherwise
        """
        # Skip empty messages
        if not text or len(text.strip()) < 5:
            return False
            
        # Skip very short messages (likely not informative)
        if len(text.split()) < 3:
            return False
            
        # Include all other messages
        return True 