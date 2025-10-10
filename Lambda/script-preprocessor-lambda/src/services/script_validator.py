"""
Script Validator Service
Validates generated scripts against source content for quality and accuracy
"""
import re
from typing import Dict, Any, List, Set
from shared.utils.logging import get_logger

logger = get_logger(__name__)


class ScriptValidator:
    """Validates script quality and coverage"""

    @staticmethod
    def validate_script(
        original_content: Dict[str, Any],
        generated_script: str,
        content_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate generated script against original content

        Args:
            original_content: Original clean content
            generated_script: Generated script text
            content_metrics: Metrics from content analysis

        Returns:
            Validation report with scores and insights
        """
        messages = original_content.get('messages', [])

        # 1. Calculate coverage ratio
        content_chars = content_metrics['total_chars']
        script_chars = len(generated_script)
        actual_ratio = script_chars / content_chars if content_chars > 0 else 0
        target_ratio = content_metrics['target_ratio']

        # 2. Check topic coverage
        topics_in_content = ScriptValidator._extract_topics(messages)
        topics_in_script = ScriptValidator._extract_topics_from_script(generated_script)

        covered_topics = topics_in_script.intersection(topics_in_content)
        coverage_score = len(covered_topics) / len(topics_in_content) if topics_in_content else 1.0

        # 3. Detect potential hallucinations
        script_words = set(ScriptValidator._tokenize(generated_script))
        content_words = set()
        for msg in messages:
            content_words.update(ScriptValidator._tokenize(msg.get('text', '')))

        # Words in script but not in content (potential hallucinations)
        # Filter out common words
        common_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'של', 'את', 'על', 'עם', 'כי', 'גם', 'או', 'אבל', 'ב', 'ל', 'מ', 'ה',
            'pause', 'short', 'medium', 'long', 'break', 'emphasis', 'laughing',
            'host', 'expert', 'analyst', 'speaker', 'welcome', 'thank', 'thanks'
        }
        unique_to_script = script_words - content_words - common_words

        hallucination_risk = len(unique_to_script) / len(script_words) if script_words else 0

        # 4. Calculate overall quality score
        # Ratio match (40%), Coverage (40%), Low hallucination risk (20%)
        ratio_match_score = 1.0 - min(abs(actual_ratio - target_ratio) / target_ratio, 1.0)
        quality_score = (
            ratio_match_score * 0.4 +
            coverage_score * 0.4 +
            (1.0 - min(hallucination_risk, 1.0)) * 0.2
        )

        # 5. Generate recommendations
        recommendations = []
        if actual_ratio < target_ratio * 0.85:
            recommendations.append(f"Script significantly shorter than target ({actual_ratio:.0%} vs {target_ratio:.0%})")
        elif actual_ratio > target_ratio * 1.15:
            recommendations.append(f"Script significantly longer than target ({actual_ratio:.0%} vs {target_ratio:.0%})")

        if coverage_score < 0.75:
            recommendations.append(f"Low topic coverage ({coverage_score:.0%} - missing key topics)")

        if hallucination_risk > 0.35:
            recommendations.append(f"High hallucination risk ({hallucination_risk:.0%} - many new words not in source)")

        # Determine pass/fail
        passed = quality_score >= 0.65  # Lowered threshold slightly for flexibility

        report = {
            'quality_score': quality_score,
            'actual_ratio': actual_ratio,
            'target_ratio': target_ratio,
            'ratio_match_score': ratio_match_score,
            'coverage_score': coverage_score,
            'topics_in_content': len(topics_in_content),
            'topics_covered': len(covered_topics),
            'missing_topics': list(topics_in_content - topics_in_script),
            'hallucination_risk': hallucination_risk,
            'unique_words_count': len(unique_to_script),
            'recommendations': recommendations,
            'passed': passed,
            'strategy': content_metrics['strategy'],
            'message_count': content_metrics['message_count']
        }

        logger.info(f"[SCRIPT_VALIDATOR] Quality score: {quality_score:.2f} (passed: {passed})")
        logger.info(f"[SCRIPT_VALIDATOR] Coverage: {coverage_score:.1%} ({len(covered_topics)}/{len(topics_in_content)} topics)")
        logger.info(f"[SCRIPT_VALIDATOR] Ratio: {actual_ratio:.2f} (target: {target_ratio:.2f}, match score: {ratio_match_score:.2f})")
        logger.info(f"[SCRIPT_VALIDATOR] Hallucination risk: {hallucination_risk:.2f}")

        if recommendations:
            logger.warning(f"[SCRIPT_VALIDATOR] Recommendations: {', '.join(recommendations)}")

        return report

    @staticmethod
    def _extract_topics(messages: List[Dict]) -> Set[str]:
        """Extract key topics from messages using keyword matching"""
        topics = set()

        # Priority keywords that indicate topics
        topic_indicators = [
            # Hebrew political/military
            'טראמפ', 'נתניהו', 'ביידן', 'חמאס', 'עזה', 'לבנון', 'איראן', 'חיזבאללה',
            'צה"ל', 'צהל', 'ממשלה', 'כנסת', 'חטופים',
            # English political/military
            'trump', 'netanyahu', 'biden', 'hamas', 'gaza', 'lebanon', 'iran', 'hezbollah',
            'idf', 'government', 'hostages',
            # Geographic locations
            'ירושלים', 'תל אביב', 'תל-אביב', 'jerusalem', 'telaviv',
            'קטאר', 'מצרים', 'טורקיה', 'qatar', 'egypt', 'turkey',
            # Cultural/social
            'אירוויזיון', 'eurovision', 'משט', 'flotilla',
            # Technology
            'ai', 'בינה מלאכותית', 'טכנולוגיה', 'technology'
        ]

        for msg in messages:
            text = msg.get('text', '').lower()
            for indicator in topic_indicators:
                if indicator.lower() in text:
                    topics.add(indicator.lower())

        return topics

    @staticmethod
    def _extract_topics_from_script(script: str) -> Set[str]:
        """Extract topics from generated script"""
        script_lower = script.lower()
        topics = set()

        topic_indicators = [
            # Hebrew
            'טראמפ', 'נתניהו', 'ביידן', 'חמאס', 'עזה', 'לבנון', 'איראן', 'חיזבאללה',
            'צה"ל', 'צהל', 'ממשלה', 'כנסת', 'חטופים',
            # English
            'trump', 'netanyahu', 'biden', 'hamas', 'gaza', 'lebanon', 'iran', 'hezbollah',
            'idf', 'government', 'hostages',
            # Geographic
            'ירושלים', 'תל אביב', 'תל-אביב', 'jerusalem', 'telaviv',
            'קטאר', 'מצרים', 'טורקיה', 'qatar', 'egypt', 'turkey',
            # Cultural
            'אירוויזיון', 'eurovision', 'משט', 'flotilla',
            # Technology
            'ai', 'בינה מלאכותית', 'טכנולוגיה', 'technology'
        ]

        for indicator in topic_indicators:
            if indicator.lower() in script_lower:
                topics.add(indicator.lower())

        return topics

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        """Simple tokenization for word extraction"""
        # Remove TTS markup
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'<.*?>', '', text)
        # Remove punctuation and extract words
        words = re.findall(r'\b\w+\b', text.lower())
        # Filter out very short words (likely not meaningful)
        words = [w for w in words if len(w) >= 3]
        return words

    @staticmethod
    def create_validation_summary(validation_report: Dict[str, Any]) -> str:
        """
        Create a human-readable validation summary

        Args:
            validation_report: Validation report from validate_script

        Returns:
            Formatted text summary
        """
        summary_lines = []
        summary_lines.append("=" * 60)
        summary_lines.append("SCRIPT VALIDATION REPORT")
        summary_lines.append("=" * 60)

        # Overall score
        score = validation_report['quality_score']
        passed = validation_report['passed']
        status = "✅ PASSED" if passed else "❌ FAILED"
        summary_lines.append(f"\nOverall Score: {score:.2f}/1.00 - {status}")

        # Strategy info
        strategy = validation_report['strategy']
        message_count = validation_report['message_count']
        summary_lines.append(f"Strategy: {strategy.upper()} ({message_count} messages)")

        # Metrics
        summary_lines.append("\n" + "-" * 60)
        summary_lines.append("METRICS:")
        summary_lines.append(f"  Coverage Score:      {validation_report['coverage_score']:.1%}")
        summary_lines.append(f"  Topics Covered:      {validation_report['topics_covered']}/{validation_report['topics_in_content']}")
        summary_lines.append(f"  Ratio Match Score:   {validation_report['ratio_match_score']:.1%}")
        summary_lines.append(f"  Actual Ratio:        {validation_report['actual_ratio']:.2f}")
        summary_lines.append(f"  Target Ratio:        {validation_report['target_ratio']:.2f}")
        summary_lines.append(f"  Hallucination Risk:  {validation_report['hallucination_risk']:.1%}")

        # Missing topics
        if validation_report['missing_topics']:
            summary_lines.append("\n" + "-" * 60)
            summary_lines.append("MISSING TOPICS:")
            for topic in validation_report['missing_topics'][:10]:  # Show first 10
                summary_lines.append(f"  - {topic}")
            if len(validation_report['missing_topics']) > 10:
                summary_lines.append(f"  ... and {len(validation_report['missing_topics']) - 10} more")

        # Recommendations
        if validation_report['recommendations']:
            summary_lines.append("\n" + "-" * 60)
            summary_lines.append("RECOMMENDATIONS:")
            for rec in validation_report['recommendations']:
                summary_lines.append(f"  ⚠️ {rec}")

        summary_lines.append("=" * 60)

        return "\n".join(summary_lines)
