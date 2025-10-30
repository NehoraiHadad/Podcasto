"""
Rate Limiter Utility
Provides helpers for handling API rate limits and graceful back-off logic.
"""
from __future__ import annotations

import threading
import time
import re
from typing import Optional

# ----------------------------------------------------------------------------
# Simple parsing helpers
# ----------------------------------------------------------------------------

_DEFAULT_DELAY_SECONDS = 60
_RETRY_DELAY_PATTERN = re.compile(r"retryDelay['\"]?:?\s*['\"]?(\d+)s", re.IGNORECASE)


def parse_retry_delay(error_message: str, default_delay: int = _DEFAULT_DELAY_SECONDS) -> int:
    """Extract a *retry delay* in seconds from the raw error string.

    The Gemini API returns a gRPC `RetryInfo` proto with the `retryDelay` field. The
    error is ultimately converted to text inside the Google client which means we
    need to scrape the value out. When the value cannot be extracted we fall back
    to *default_delay* (60 seconds by default).
    """
    match = _RETRY_DELAY_PATTERN.search(error_message)
    return int(match.group(1)) if match else default_delay

# ----------------------------------------------------------------------------
# Token-bucket rate limiter (thread-safe, blocking)
# ----------------------------------------------------------------------------

class TokenBucketRateLimiter:
    """Thread-safe token bucket implementation for simple rate limiting.

    This is *blocking* – the caller will wait until a token is available.
    """

    def __init__(self, max_tokens: int, refill_period: int):
        self._capacity = max_tokens
        self._tokens = max_tokens
        self._refill_period = refill_period  # seconds
        self._lock = threading.Lock()
        self._last_refill = time.monotonic()

    def _refill(self) -> None:
        """
        Continuous token refill: adds tokens proportionally to elapsed time
        instead of batch refilling every period.

        For 9 tokens per 60 seconds: adds 1 token every 6.67 seconds
        This prevents burst traffic and better matches Google's rate limiting behavior.
        """
        now = time.monotonic()
        elapsed = now - self._last_refill

        # Continuous refill: add tokens proportionally to elapsed time
        # This prevents burst traffic by distributing tokens evenly over time
        if elapsed > 0:
            with self._lock:
                # Calculate tokens to add: (elapsed_seconds / refill_period) * capacity
                # Example: For 9 tokens/60s, after 6.67s we add ~1 token
                tokens_to_add = (elapsed / self._refill_period) * self._capacity

                # Add tokens but don't exceed capacity (prevent token accumulation)
                self._tokens = min(self._capacity, self._tokens + tokens_to_add)
                self._last_refill = now

    def acquire(self) -> None:
        """Block until a token is available."""
        while True:
            self._refill()
            with self._lock:
                if self._tokens > 0:
                    self._tokens -= 1
                    return
            # No tokens available – sleep a bit to avoid busy-waiting.
            time.sleep(0.1) 