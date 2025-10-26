"""
DateTime Utilities for Lambda Functions
All functions work with UTC exclusively

IMPORTANT: Always use these utilities instead of datetime.now()
to ensure consistency with the Next.js application and database.

Golden Rule: Store UTC, Display Local, Process UTC
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
import pytz


def now_utc() -> datetime:
    """
    Get current datetime in UTC
    ALWAYS use this instead of datetime.now()

    Returns:
        datetime: Current UTC time with timezone info
    """
    return datetime.now(timezone.utc)


def to_iso_utc(dt: datetime) -> str:
    """
    Convert datetime to ISO format string in UTC

    Args:
        dt: datetime object (will be converted to UTC if not already)

    Returns:
        str: ISO format string with Z suffix (e.g., "2024-01-15T14:30:00.000Z")
    """
    # Ensure datetime is UTC
    if dt.tzinfo is None:
        # Naive datetime - assume UTC
        dt = dt.replace(tzinfo=timezone.utc)
    elif dt.tzinfo != timezone.utc:
        # Convert to UTC
        dt = dt.astimezone(timezone.utc)

    # Return ISO format with milliseconds
    return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'


def parse_iso_utc(iso_string: str) -> datetime:
    """
    Parse ISO format string to UTC datetime

    Args:
        iso_string: ISO format string (e.g., "2024-01-15T14:30:00.000Z")

    Returns:
        datetime: UTC datetime with timezone info
    """
    # Handle various ISO formats
    iso_string = iso_string.replace('Z', '+00:00')

    try:
        dt = datetime.fromisoformat(iso_string)
    except ValueError:
        # Try without milliseconds
        dt = datetime.strptime(iso_string.split('.')[0], '%Y-%m-%dT%H:%M:%S')
        dt = dt.replace(tzinfo=timezone.utc)

    # Ensure UTC
    if dt.tzinfo != timezone.utc:
        dt = dt.astimezone(timezone.utc)

    return dt


def ensure_utc(dt: datetime) -> datetime:
    """
    Ensure datetime is in UTC timezone

    Args:
        dt: datetime object

    Returns:
        datetime: UTC datetime with timezone info

    Raises:
        ValueError: If datetime is naive (no timezone info)
    """
    if dt.tzinfo is None:
        raise ValueError(
            "Naive datetime detected. All datetimes must have timezone info. "
            "Use now_utc() or ensure timezone is specified."
        )

    if dt.tzinfo != timezone.utc:
        return dt.astimezone(timezone.utc)

    return dt


def start_of_day_utc(dt: datetime) -> datetime:
    """
    Get start of day (midnight) in UTC

    Args:
        dt: datetime object

    Returns:
        datetime: Start of day in UTC (00:00:00.000)
    """
    dt = ensure_utc(dt)
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def end_of_day_utc(dt: datetime) -> datetime:
    """
    Get end of day in UTC

    Args:
        dt: datetime object

    Returns:
        datetime: End of day in UTC (23:59:59.999999)
    """
    dt = ensure_utc(dt)
    return dt.replace(hour=23, minute=59, second=59, microsecond=999999)


def start_of_day_in_timezone(dt: datetime, tz_name: str) -> datetime:
    """
    Get start of day in a specific timezone, converted to UTC
    Critical for correct date range queries

    Example:
        User in Israel selects "2024-01-15"
        start_of_day_in_timezone(datetime(2024, 1, 15), 'Asia/Jerusalem')
        → 2024-01-14 22:00:00+00:00 (which is 00:00 in Israel)

    Args:
        dt: datetime object or naive datetime (will be localized to tz_name)
        tz_name: Timezone name (e.g., 'Asia/Jerusalem', 'UTC')

    Returns:
        datetime: Start of day in specified timezone, converted to UTC
    """
    tz = pytz.timezone(tz_name)

    # If naive, localize to the timezone
    if dt.tzinfo is None:
        local_dt = tz.localize(dt.replace(hour=0, minute=0, second=0, microsecond=0))
    else:
        # Convert to the timezone
        local_dt = dt.astimezone(tz).replace(hour=0, minute=0, second=0, microsecond=0)
        # Re-localize to handle DST correctly
        local_dt = tz.normalize(tz.localize(local_dt.replace(tzinfo=None)))

    # Convert to UTC
    return local_dt.astimezone(timezone.utc)


def end_of_day_in_timezone(dt: datetime, tz_name: str) -> datetime:
    """
    Get end of day in a specific timezone, converted to UTC

    Example:
        User in Israel selects "2024-01-15"
        end_of_day_in_timezone(datetime(2024, 1, 15), 'Asia/Jerusalem')
        → 2024-01-15 21:59:59.999999+00:00 (which is 23:59:59.999999 in Israel)

    Args:
        dt: datetime object or naive datetime (will be localized to tz_name)
        tz_name: Timezone name (e.g., 'Asia/Jerusalem', 'UTC')

    Returns:
        datetime: End of day in specified timezone, converted to UTC
    """
    tz = pytz.timezone(tz_name)

    # If naive, localize to the timezone
    if dt.tzinfo is None:
        local_dt = tz.localize(dt.replace(hour=23, minute=59, second=59, microsecond=999999))
    else:
        # Convert to the timezone
        local_dt = dt.astimezone(tz).replace(hour=23, minute=59, second=59, microsecond=999999)
        # Re-localize to handle DST correctly
        local_dt = tz.normalize(tz.localize(local_dt.replace(tzinfo=None)))

    # Convert to UTC
    return local_dt.astimezone(timezone.utc)


def create_date_range_utc(
    start_date: datetime,
    end_date: datetime,
    tz_name: str
) -> Tuple[datetime, datetime]:
    """
    Create a date range for database queries
    Converts user-selected dates (in their timezone) to UTC range

    Example usage:
        start_utc, end_utc = create_date_range_utc(
            datetime(2024, 1, 15),
            datetime(2024, 1, 20),
            'Asia/Jerusalem'
        )

        # Use in query:
        query = query.filter(
            created_at >= start_utc,
            created_at <= end_utc
        )

    Args:
        start_date: Start date (can be naive)
        end_date: End date (can be naive)
        tz_name: Timezone name

    Returns:
        Tuple[datetime, datetime]: (start_utc, end_utc)
    """
    start_utc = start_of_day_in_timezone(start_date, tz_name)
    end_utc = end_of_day_in_timezone(end_date, tz_name)

    return start_utc, end_utc


def days_between(start: datetime, end: datetime) -> int:
    """
    Calculate number of days between two datetimes

    Args:
        start: Start datetime
        end: End datetime

    Returns:
        int: Number of days (can be negative if end < start)
    """
    start_utc = ensure_utc(start)
    end_utc = ensure_utc(end)

    diff = end_utc - start_utc
    return diff.days


def format_duration_ms(duration_ms: int) -> str:
    """
    Format duration in milliseconds to human-readable string

    Args:
        duration_ms: Duration in milliseconds

    Returns:
        str: Formatted string (e.g., "2 minutes 5 seconds")
    """
    if duration_ms < 1000:
        return f"{duration_ms}ms"

    seconds = (duration_ms // 1000) % 60
    minutes = (duration_ms // (1000 * 60)) % 60
    hours = duration_ms // (1000 * 60 * 60)

    parts = []
    if hours > 0:
        parts.append(f"{hours} {'hour' if hours == 1 else 'hours'}")
    if minutes > 0:
        parts.append(f"{minutes} {'minute' if minutes == 1 else 'minutes'}")
    if seconds > 0 and hours == 0:
        parts.append(f"{seconds} {'second' if seconds == 1 else 'seconds'}")

    return ' '.join(parts) if parts else '0 seconds'


# Migration helpers

def migrate_datetime_now() -> datetime:
    """
    DEPRECATED: Use now_utc() instead
    This is here to help with migration from datetime.now()
    """
    import warnings
    warnings.warn(
        "migrate_datetime_now() is deprecated. Use now_utc() instead.",
        DeprecationWarning,
        stacklevel=2
    )
    return now_utc()
