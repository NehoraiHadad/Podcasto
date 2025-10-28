# SQS Message Schemas for Podcasto Pipeline

This document defines the exact message schemas used for communication between Lambda functions via SQS queues.

## Overview

The Podcasto pipeline uses two SQS queues:

1. **Script Generation Queue**: Telegram Lambda → Script Preprocessor Lambda
2. **Audio Generation Queue**: Script Preprocessor Lambda → Audio Generation Lambda

Each queue has a specific message schema that must be followed for proper processing.

---

## 1. Script Generation Queue

**Queue Name**: `script-generation-queue`
**Trigger**: Telegram Lambda → Script Preprocessor Lambda
**Purpose**: Pass raw Telegram data location to Script Preprocessor for script generation

### Message Schema

```json
{
  "episode_id": "uuid-string",
  "podcast_id": "uuid-string",
  "podcast_config_id": "uuid-string",
  "podcast_format": "single-speaker" | "multi-speaker",
  "s3_path": "s3://bucket/podcasts/{podcast_id}/episodes/{episode_id}/telegram_data_{timestamp}.json",
  "content_url": "s3://bucket/podcasts/{podcast_id}/episodes/{episode_id}/telegram_data_{timestamp}.json",
  "timestamp": "2024-01-31T12:00:00Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `episode_id` | string (UUID) | Yes | Unique identifier for the episode |
| `podcast_id` | string (UUID) | Yes | Unique identifier for the podcast |
| `podcast_config_id` | string (UUID) | Yes | Unique identifier for the podcast configuration |
| `podcast_format` | enum | Yes | **CRITICAL**: Format of podcast - `"single-speaker"` or `"multi-speaker"` |
| `s3_path` | string (S3 URI) | Yes | Full S3 path to the Telegram data JSON file |
| `content_url` | string (S3 URI) | Yes | Alias for s3_path (legacy field) |
| `timestamp` | string (ISO 8601) | Yes | UTC timestamp when the message was created |

### Example Message

```json
{
  "episode_id": "550e8400-e29b-41d4-a716-446655440000",
  "podcast_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "podcast_config_id": "9f0e2b8c-4e5a-4d6b-8c9e-1f2a3b4c5d6e",
  "podcast_format": "single-speaker",
  "s3_path": "s3://podcasto-data/podcasts/7c9e6679-7425-40de-944b-e07fc1f90ae7/episodes/550e8400-e29b-41d4-a716-446655440000/telegram_data_20240131_120000.json",
  "content_url": "s3://podcasto-data/podcasts/7c9e6679-7425-40de-944b-e07fc1f90ae7/episodes/550e8400-e29b-41d4-a716-446655440000/telegram_data_20240131_120000.json",
  "timestamp": "2024-01-31T12:00:00Z"
}
```

---

## 2. Audio Generation Queue

**Queue Name**: `audio-generation-queue`
**Trigger**: Script Preprocessor Lambda → Audio Generation Lambda
**Purpose**: Pass generated script and configuration to Audio Generation Lambda for TTS processing

### Message Schema

```json
{
  "episode_id": "uuid-string",
  "podcast_id": "uuid-string",
  "podcast_config_id": "uuid-string",
  "script_url": "s3://bucket/path/to/script.txt",
  "dynamic_config": {
    "podcast_format": "single-speaker" | "multi-speaker",
    "speaker1_role": "Host",
    "speaker2_role": "Expert" | null,
    "speaker1_voice": "Alnilam",
    "speaker2_voice": "Aoede" | null,
    "speaker1_gender": "male",
    "speaker2_gender": "female" | null,
    "language": "he",
    "content_analysis": {
      "content_type": "news" | "tech" | "finance" | "general",
      "specific_role": "Tech Expert",
      "role_description": "Expert in technology and innovation",
      "confidence": 0.95,
      "reasoning": "Content focuses on technology trends"
    },
    "content_type": "news",
    "topic_analysis": {
      "topics": ["AI", "Machine Learning"],
      "conversation_structure": "linear" | "segmented",
      "transition_style": "natural" | "formal"
    }
  },
  "timestamp": "2024-01-31T12:05:00Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `episode_id` | string (UUID) | Yes | Unique identifier for the episode |
| `podcast_id` | string (UUID) | Yes | Unique identifier for the podcast |
| `podcast_config_id` | string (UUID) | Yes | Unique identifier for the podcast configuration |
| `script_url` | string (S3 URI) | Yes | Full S3 path to the generated script text file |
| `dynamic_config` | object | Yes | Configuration object with voice and role information |
| `timestamp` | string (ISO 8601) | Yes | UTC timestamp when the message was created |

### Dynamic Config Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `podcast_format` | enum | Yes | **CRITICAL**: `"single-speaker"` or `"multi-speaker"` |
| `speaker1_role` | string | Yes | Role/name for first speaker (e.g., "Host") |
| `speaker2_role` | string | Conditional | Role/name for second speaker; `null` for single-speaker |
| `speaker1_voice` | string | Yes | Gemini voice ID for first speaker (e.g., "Alnilam") |
| `speaker2_voice` | string | Conditional | Gemini voice ID for second speaker; `null` for single-speaker |
| `speaker1_gender` | string | Yes | Gender of first speaker: `"male"` or `"female"` |
| `speaker2_gender` | string | Conditional | Gender of second speaker; `null` for single-speaker |
| `language` | string | Yes | Language code (e.g., "he", "en") |
| `content_analysis` | object | Yes | Content analysis results from Script Preprocessor |
| `content_type` | string | Yes | Type of content (e.g., "news", "tech", "finance") |
| `topic_analysis` | object | Optional | Topic and conversation structure analysis |

### Example Message (Single-Speaker)

```json
{
  "episode_id": "550e8400-e29b-41d4-a716-446655440000",
  "podcast_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "podcast_config_id": "9f0e2b8c-4e5a-4d6b-8c9e-1f2a3b4c5d6e",
  "script_url": "s3://podcasto-data/podcasts/7c9e6679-7425-40de-944b-e07fc1f90ae7/episodes/550e8400-e29b-41d4-a716-446655440000/script_20240131_120500.txt",
  "dynamic_config": {
    "podcast_format": "single-speaker",
    "speaker1_role": "Narrator",
    "speaker2_role": null,
    "speaker1_voice": "Alnilam",
    "speaker2_voice": null,
    "speaker1_gender": "male",
    "speaker2_gender": null,
    "language": "he",
    "content_analysis": {
      "content_type": "news",
      "specific_role": "Narrator",
      "role_description": "Professional news narrator",
      "confidence": 0.90,
      "reasoning": "Single-speaker news summary format"
    },
    "content_type": "news"
  },
  "timestamp": "2024-01-31T12:05:00Z"
}
```

### Example Message (Multi-Speaker)

```json
{
  "episode_id": "650e8400-e29b-41d4-a716-446655440001",
  "podcast_id": "8c9e6679-7425-40de-944b-e07fc1f90ae8",
  "podcast_config_id": "af0e2b8c-4e5a-4d6b-8c9e-1f2a3b4c5d6f",
  "script_url": "s3://podcasto-data/podcasts/8c9e6679-7425-40de-944b-e07fc1f90ae8/episodes/650e8400-e29b-41d4-a716-446655440001/script_20240131_130000.txt",
  "dynamic_config": {
    "podcast_format": "multi-speaker",
    "speaker1_role": "Host",
    "speaker2_role": "Tech Expert",
    "speaker1_voice": "Alnilam",
    "speaker2_voice": "Aoede",
    "speaker1_gender": "male",
    "speaker2_gender": "female",
    "language": "he",
    "content_analysis": {
      "content_type": "tech",
      "specific_role": "Tech Expert",
      "role_description": "Expert in technology and innovation",
      "confidence": 0.95,
      "reasoning": "Content focuses on AI and machine learning trends"
    },
    "content_type": "tech",
    "topic_analysis": {
      "topics": ["AI", "Machine Learning", "Startups"],
      "conversation_structure": "segmented",
      "transition_style": "natural"
    }
  },
  "timestamp": "2024-01-31T13:00:00Z"
}
```

---

## Critical Notes

### 1. podcast_format Field

The `podcast_format` field is **CRITICAL** and must be present in both queue messages:

- **Script Generation Queue**: Required at root level
- **Audio Generation Queue**: Required inside `dynamic_config` object

Valid values:
- `"single-speaker"`: Single voice narration
- `"multi-speaker"`: Conversational format with two speakers

Invalid or missing values will default to `"multi-speaker"` with a warning logged.

### 2. Backward Compatibility

All Lambdas default to `"multi-speaker"` format when `podcast_format` is missing, ensuring backward compatibility with older messages.

### 3. Voice Consistency

The Script Preprocessor selects voices **once per episode** and stores them in:
1. `dynamic_config` in SQS message to Audio Generation Lambda
2. Episode `metadata` in database for recovery if needed

This ensures voice consistency across all audio chunks in an episode.

### 4. Single-Speaker Rules

When `podcast_format` is `"single-speaker"`:
- `speaker2_role` must be `null`
- `speaker2_voice` must be `null`
- `speaker2_gender` must be `null`
- Only `speaker1_*` fields are used for TTS

### 5. Error Handling

Each Lambda validates `podcast_format`:
```python
if podcast_format not in ['single-speaker', 'multi-speaker']:
    logger.warning(f"Invalid format '{podcast_format}', defaulting to 'multi-speaker'")
    podcast_format = 'multi-speaker'
```

---

## Testing Message Examples

### Test Script Generation Message

```bash
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/script-generation-queue \
  --message-body '{
    "episode_id": "test-episode-001",
    "podcast_id": "test-podcast-001",
    "podcast_config_id": "test-config-001",
    "podcast_format": "single-speaker",
    "s3_path": "s3://podcasto-data/test/telegram_data.json",
    "content_url": "s3://podcasto-data/test/telegram_data.json",
    "timestamp": "2024-01-31T12:00:00Z"
  }'
```

### Test Audio Generation Message

```bash
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/audio-generation-queue \
  --message-body '{
    "episode_id": "test-episode-001",
    "podcast_id": "test-podcast-001",
    "podcast_config_id": "test-config-001",
    "script_url": "s3://podcasto-data/test/script.txt",
    "dynamic_config": {
      "podcast_format": "single-speaker",
      "speaker1_role": "Narrator",
      "speaker2_role": null,
      "speaker1_voice": "Alnilam",
      "speaker2_voice": null,
      "speaker1_gender": "male",
      "speaker2_gender": null,
      "language": "he",
      "content_type": "news",
      "content_analysis": {
        "content_type": "news",
        "specific_role": "Narrator",
        "role_description": "News narrator",
        "confidence": 0.90,
        "reasoning": "Test message"
      }
    },
    "timestamp": "2024-01-31T12:05:00Z"
  }'
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-28 | Pipeline Integration Phase | Initial documentation with podcast_format support |

---

## Related Documentation

- Lambda Architecture: `/Lambda/README.md`
- Deployment Guide: `/Lambda/docs/DEPLOYMENT_CHECKLIST.md`
- Testing Guide: `/Lambda/scripts/test_single_speaker_pipeline.py`
