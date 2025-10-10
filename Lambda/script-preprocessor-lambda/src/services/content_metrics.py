"""
Content Metrics Service
Analyzes content to determine appropriate compression/expansion strategy
"""
from typing import Dict, Any, List, Tuple
from shared.utils.logging import get_logger

logger = get_logger(__name__)


class ContentMetrics:
    """Analyzes content metrics to guide script generation"""

    # Configuration thresholds
    LOW_CONTENT_THRESHOLD = 5      # messages
    HIGH_CONTENT_THRESHOLD = 20    # messages

    # Target ratios (script_chars / content_chars)
    MIN_RATIO = 0.80  # 80% - moderate compression
    MAX_RATIO = 1.20  # 120% - moderate expansion
    IDEAL_RATIO = 1.00  # 100% - balanced

    @staticmethod
    def analyze_content(clean_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze content and determine generation strategy

        Args:
            clean_content: Clean content with messages and summary

        Returns:
            Dict with metrics and generation strategy
        """
        messages = clean_content.get('messages', [])
        message_count = len(messages)

        # Calculate content volume
        total_chars = sum(len(msg.get('text', '')) for msg in messages)
        avg_chars_per_message = total_chars / message_count if message_count > 0 else 0

        # Determine content category
        if message_count <= ContentMetrics.LOW_CONTENT_THRESHOLD:
            category = 'low'
            target_ratio = ContentMetrics.MAX_RATIO  # Can expand more
            strategy = 'expansion'
        elif message_count >= ContentMetrics.HIGH_CONTENT_THRESHOLD:
            category = 'high'
            target_ratio = ContentMetrics.MIN_RATIO  # Must compress
            strategy = 'compression'
        else:
            category = 'medium'
            target_ratio = ContentMetrics.IDEAL_RATIO  # Balanced
            strategy = 'balanced'

        # Calculate target script length
        target_script_chars = int(total_chars * target_ratio)

        # Determine coverage priority
        if category == 'high':
            # High content: need to prioritize
            coverage_mode = 'selective'  # Cover main topics only
            detail_level = 'summary'      # Less detail per topic
        elif category == 'low':
            # Low content: can elaborate
            coverage_mode = 'comprehensive'  # Cover everything
            detail_level = 'detailed'        # More detail per topic
        else:
            # Medium content: balanced
            coverage_mode = 'balanced'       # Cover most topics
            detail_level = 'moderate'        # Medium detail

        metrics = {
            'message_count': message_count,
            'total_chars': total_chars,
            'avg_chars_per_message': avg_chars_per_message,
            'category': category,
            'strategy': strategy,
            'target_ratio': target_ratio,
            'target_script_chars': target_script_chars,
            'coverage_mode': coverage_mode,
            'detail_level': detail_level,
        }

        logger.info(f"[CONTENT_METRICS] Analysis: {message_count} msgs, {total_chars} chars")
        logger.info(f"[CONTENT_METRICS] Strategy: {strategy} (ratio={target_ratio:.2f})")
        logger.info(f"[CONTENT_METRICS] Target: {target_script_chars} chars")
        logger.info(f"[CONTENT_METRICS] Coverage: {coverage_mode}, Detail: {detail_level}")

        return metrics


class ContentPrioritizer:
    """Prioritizes content based on importance signals"""

    # Priority keywords for different categories
    PRIORITY_KEYWORDS = {
        'critical': [
            # Hebrew
            'הרוגים', 'פצועים', 'תקיפה', 'הסכם', 'עסקה', 'נסיגה',
            'חטופים', 'שחרור', 'מלחמה', 'הפסקת אש', 'שר', 'שרה',
            'ממשלה', 'ראש הממשלה', 'נשיא',
            # English
            'killed', 'wounded', 'injured', 'attack', 'deal', 'agreement',
            'withdrawal', 'hostages', 'release', 'war', 'ceasefire',
            'minister', 'government', 'prime minister', 'president'
        ],
        'high': [
            # Hebrew
            'טראמפ', 'נתניהו', 'ביידן', 'ממשלה', 'משא ומתן', "מו\"מ",
            'קטאר', 'מצרים', 'טורקיה', 'סעודיה', 'איראן',
            'צה"ל', 'חמאס', 'חיזבאללה', 'כוחות', 'חיילים',
            # English
            'trump', 'netanyahu', 'biden', 'government', 'negotiations',
            'qatar', 'egypt', 'turkey', 'saudi', 'iran',
            'idf', 'hamas', 'hezbollah', 'forces', 'soldiers'
        ],
        'medium': [
            # Hebrew
            'משט', 'פעילים', 'הפגנה', 'ביקורת', 'מחאה',
            'דיון', 'ועדה', 'הצבעה', 'הצעת חוק',
            # English
            'flotilla', 'activists', 'protest', 'criticism', 'demonstration',
            'debate', 'committee', 'vote', 'bill'
        ],
        'low': [
            # Hebrew
            'אירוויזיון', 'טקס', 'חגיגה', 'תרבות', 'ספורט',
            'אומנות', 'מוזיקה', 'סרט', 'פרס',
            # English
            'eurovision', 'ceremony', 'celebration', 'culture', 'sports',
            'art', 'music', 'film', 'award'
        ]
    }

    @staticmethod
    def prioritize_messages(messages: List[Dict]) -> List[Tuple[Dict, int]]:
        """
        Sort messages by priority based on content importance

        Args:
            messages: List of message dictionaries

        Returns:
            List of tuples: (message, priority_score)
        """
        scored_messages = []

        for msg in messages:
            text = msg.get('text', '').lower()
            score = 0

            # Score based on keyword matches
            for keyword in ContentPrioritizer.PRIORITY_KEYWORDS['critical']:
                if keyword.lower() in text:
                    score += 100

            for keyword in ContentPrioritizer.PRIORITY_KEYWORDS['high']:
                if keyword.lower() in text:
                    score += 50

            for keyword in ContentPrioritizer.PRIORITY_KEYWORDS['medium']:
                if keyword.lower() in text:
                    score += 20

            for keyword in ContentPrioritizer.PRIORITY_KEYWORDS['low']:
                if keyword.lower() in text:
                    score += 5

            # Boost score for longer messages (usually more substantial)
            text_length = len(text)
            if text_length > 200:
                score += 30
            elif text_length > 100:
                score += 15

            # Boost for messages with numbers (facts, statistics)
            if any(char.isdigit() for char in text):
                score += 10

            # Boost for messages with quotes (usually important statements)
            if '"' in text or "'" in text or '״' in text or '׳' in text:
                score += 15

            scored_messages.append((msg, score))

        # Sort by score (descending)
        scored_messages.sort(key=lambda x: x[1], reverse=True)

        logger.info(f"[CONTENT_PRIORITIZER] Scored {len(messages)} messages")
        if scored_messages:
            logger.info(f"[CONTENT_PRIORITIZER] Top score: {scored_messages[0][1]}")
            logger.info(f"[CONTENT_PRIORITIZER] Lowest score: {scored_messages[-1][1]}")

        return scored_messages

    @staticmethod
    def select_priority_messages(
        messages: List[Dict],
        target_percentage: float = 0.7
    ) -> List[Dict]:
        """
        Select top priority messages

        Args:
            messages: List of message dictionaries
            target_percentage: Percentage of messages to keep (default: 70%)

        Returns:
            List of prioritized messages
        """
        scored_messages = ContentPrioritizer.prioritize_messages(messages)

        # Calculate cutoff
        cutoff_index = max(1, int(len(scored_messages) * target_percentage))

        # Keep original order for selected messages
        selected_messages_with_score = scored_messages[:cutoff_index]

        # Get original indices to maintain chronological order
        selected_messages = [msg for msg, score in selected_messages_with_score]

        # Sort by original order (assuming messages have date field)
        if selected_messages and 'date' in selected_messages[0]:
            selected_messages.sort(key=lambda x: x.get('date', ''))

        logger.info(f"[CONTENT_PRIORITIZER] Selected {len(selected_messages)}/{len(messages)} messages")

        return selected_messages
