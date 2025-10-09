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
        now = time.monotonic()
        elapsed = now - self._last_refill
        if elapsed >= self._refill_period:
            with self._lock:
                # Double-check inside the lock to avoid duplicate refills.
                now = time.monotonic()
                elapsed = now - self._last_refill
                if elapsed >= self._refill_period:
                    self._tokens = self._capacity
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