# Podcasto API Documentation

## Overview

This document provides API reference for developers working with Podcasto's podcast format feature. It covers database schema, server actions, SQS message formats, and Lambda integration.

---

## Table of Contents

- [Database Schema](#database-schema)
- [Server Actions](#server-actions)
- [SQS Message Formats](#sqs-message-formats)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Database Schema

### podcast_configs Table

```sql
CREATE TABLE podcast_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID REFERENCES podcasts(id) ON DELETE CASCADE,

  -- Podcast Format Fields
  podcast_format TEXT DEFAULT 'multi-speaker',
  speaker1_role TEXT NOT NULL,
  speaker2_role TEXT,  -- NULL for single-speaker

  -- Other Fields
  content_source TEXT NOT NULL,
  telegram_channel TEXT,
  telegram_hours INTEGER,
  urls JSONB,
  creator TEXT NOT NULL,
  podcast_name TEXT NOT NULL,
  slogan TEXT,
  language TEXT DEFAULT 'english',
  creativity_level INTEGER NOT NULL,
  conversation_style TEXT NOT NULL,
  mixing_techniques JSONB NOT NULL,
  additional_instructions TEXT,
  episode_frequency INTEGER DEFAULT 7,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Constraints

```sql
-- Format must be valid enum
ALTER TABLE podcast_configs
ADD CONSTRAINT podcast_format_check
CHECK (podcast_format IN ('single-speaker', 'multi-speaker'));
```

### Indexes

```sql
-- Index for podcast_format queries
CREATE INDEX idx_podcast_configs_format
ON podcast_configs(podcast_format);

-- Index for podcast lookup
CREATE INDEX idx_podcast_configs_podcast_id
ON podcast_configs(podcast_id);
```

---

## Server Actions

### Create Podcast

**File:** `src/lib/actions/podcast/create.ts`

**Function:** `createPodcast(data: PodcastFormData)`

**Input Schema:**
```typescript
{
  // Basic Info
  title: string;
  description?: string;
  creator: string;
  podcastName: string;
  slogan?: string;

  // Content Source
  contentSource: 'telegram' | 'urls';
  telegramChannel?: string;
  telegramHours?: number;
  urls?: string[];

  // Style & Format
  podcastFormat: 'single-speaker' | 'multi-speaker';  // NEW
  speaker1Role: string;
  speaker2Role?: string;  // Required if podcastFormat is 'multi-speaker'
  conversationStyle: string;
  creativityLevel: number;

  // Additional Settings
  language?: string;
  mixingTechniques: string[];
  additionalInstructions?: string;
  episodeFrequency?: number;
}
```

**Validation Rules:**
- `podcastFormat`: Required, must be 'single-speaker' or 'multi-speaker'
- `speaker1Role`: Always required
- `speaker2Role`:
  - Required if `podcastFormat === 'multi-speaker'`
  - Automatically set to `null` if `podcastFormat === 'single-speaker'`
  - Ignored if format is single-speaker

**Response:**
```typescript
{
  success: boolean;
  data?: {
    podcast: {
      id: string;
      title: string;
      // ... other podcast fields
    };
    config: {
      id: string;
      podcast_format: 'single-speaker' | 'multi-speaker';
      speaker1_role: string;
      speaker2_role: string | null;
      // ... other config fields
    };
  };
  error?: string;
}
```

**Example:**
```typescript
// Single-Speaker Podcast
const result = await createPodcast({
  title: "Daily Tech News",
  creator: "Tech Media Inc",
  podcastName: "Tech Briefing",
  contentSource: "telegram",
  telegramChannel: "@technews",
  telegramHours: 24,
  podcastFormat: "single-speaker",
  speaker1Role: "Narrator",
  // speaker2Role omitted or undefined
  conversationStyle: "professional",
  creativityLevel: 50,
  language: "english",
  mixingTechniques: ["normalization"],
  episodeFrequency: 1
});

// Multi-Speaker Podcast
const result = await createPodcast({
  title: "Tech Talk Show",
  creator: "Tech Media Inc",
  podcastName: "Tech Talk",
  contentSource: "telegram",
  telegramChannel: "@technews",
  telegramHours: 168,
  podcastFormat: "multi-speaker",
  speaker1Role: "Host",
  speaker2Role: "Tech Expert",  // Required for multi-speaker
  conversationStyle: "engaging",
  creativityLevel: 75,
  language: "english",
  mixingTechniques: ["normalization"],
  episodeFrequency: 7
});
```

---

### Update Podcast

**File:** `src/lib/actions/podcast/update/config-update.ts`

**Function:** `updatePodcastConfig(podcastId: string, data: Partial<PodcastFormData>)`

**Input:** Same schema as create, but all fields optional except those being updated

**Validation Rules:**
- If updating `podcastFormat` to 'single-speaker', `speaker2_role` is automatically cleared (set to null)
- If updating `podcastFormat` to 'multi-speaker', `speaker2Role` must be provided
- Cannot update format if episodes already exist (recommended to create new podcast)

**Response:** Same as create

**Example:**
```typescript
// Change from multi-speaker to single-speaker
const result = await updatePodcastConfig("podcast-id", {
  podcastFormat: "single-speaker",
  speaker1Role: "Narrator"
  // speaker2Role automatically cleared
});

// Change from single-speaker to multi-speaker
const result = await updatePodcastConfig("podcast-id", {
  podcastFormat: "multi-speaker",
  speaker1Role: "Host",
  speaker2Role: "Expert"  // Required
});
```

---

## SQS Message Formats

### Script Generation Queue

**Queue Name:** `podcasto-script-generation-{env}`

**Message Body:**
```json
{
  "episode_id": "uuid-string",
  "podcast_id": "uuid-string",
  "podcast_config_id": "uuid-string",
  "s3_path": "s3://bucket/telegram-data/podcast-id/episode-id/messages.json",
  "podcast_format": "single-speaker",  // or "multi-speaker"
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Field Descriptions:**
- `podcast_format`: Determines script generation style (narration vs dialogue)
- Default value: "multi-speaker" if not specified

---

### Audio Generation Queue

**Queue Name:** `podcasto-audio-generation-{env}`

**Message Body:**
```json
{
  "episode_id": "uuid-string",
  "podcast_id": "uuid-string",
  "podcast_config_id": "uuid-string",
  "script_url": "s3://bucket/scripts/podcast-id/episode-id/script.json",
  "dynamic_config": {
    "podcast_format": "single-speaker",  // or "multi-speaker"
    "speaker1_voice": "Alnilam",
    "speaker2_voice": null,  // null for single-speaker, voice name for multi-speaker
    "speaker1_role": "Narrator",
    "speaker2_role": null,  // null for single-speaker, role string for multi-speaker
    "conversation_style": "professional",
    "creativity_level": 50,
    "language": "english",
    "content_analysis": {
      "content_type": "news",
      "role_description": "Professional news narrator",
      "confidence": 0.95
    }
  },
  "regenerate": true,
  "timestamp": "2024-01-15T10:35:00Z"
}
```

**Field Descriptions:**
- `dynamic_config.podcast_format`: Determines TTS configuration
- `dynamic_config.speaker2_voice`: Must be `null` for single-speaker
- `dynamic_config.speaker2_role`: Must be `null` for single-speaker

---

## Type Definitions

### TypeScript Types

```typescript
// Podcast Format Type
export type PodcastFormat = 'single-speaker' | 'multi-speaker';

// Podcast Config Type (Drizzle Inferred)
export type PodcastConfig = {
  id: string;
  podcast_id: string;
  podcast_format: PodcastFormat;
  speaker1_role: string;
  speaker2_role: string | null;
  content_source: string;
  telegram_channel: string | null;
  telegram_hours: number | null;
  urls: string[] | null;
  creator: string;
  podcast_name: string;
  slogan: string | null;
  language: string | null;
  creativity_level: number;
  conversation_style: string;
  mixing_techniques: string[];
  additional_instructions: string | null;
  episode_frequency: number | null;
  created_at: Date;
  updated_at: Date;
};

// Form Data Type
export type PodcastFormData = {
  title: string;
  description?: string;
  creator: string;
  podcastName: string;
  slogan?: string;
  contentSource: 'telegram' | 'urls';
  telegramChannel?: string;
  telegramHours?: number;
  urls?: string[];
  podcastFormat: PodcastFormat;
  speaker1Role: string;
  speaker2Role?: string;
  conversationStyle: string;
  creativityLevel: number;
  language?: string;
  mixingTechniques: string[];
  additionalInstructions?: string;
  episodeFrequency?: number;
};

// SQS Message Types
export type ScriptGenerationMessage = {
  episode_id: string;
  podcast_id: string;
  podcast_config_id: string;
  s3_path: string;
  podcast_format: PodcastFormat;
  timestamp: string;
};

export type AudioGenerationMessage = {
  episode_id: string;
  podcast_id: string;
  podcast_config_id: string;
  script_url: string;
  dynamic_config: {
    podcast_format: PodcastFormat;
    speaker1_voice: string;
    speaker2_voice: string | null;
    speaker1_role: string;
    speaker2_role: string | null;
    conversation_style: string;
    creativity_level: number;
    language: string;
    content_analysis: {
      content_type: string;
      role_description: string;
      confidence: number;
    };
  };
  regenerate: boolean;
  timestamp: string;
};
```

### Python Types

```python
from typing import Literal, Optional
from pydantic import BaseModel

# Podcast Format Type
PodcastFormat = Literal['single-speaker', 'multi-speaker']

# Dynamic Config Model
class DynamicConfig(BaseModel):
    podcast_format: PodcastFormat
    speaker1_voice: str
    speaker2_voice: Optional[str]
    speaker1_role: str
    speaker2_role: Optional[str]
    conversation_style: str
    creativity_level: int
    language: str
    content_analysis: dict

# SQS Message Models
class ScriptGenerationMessage(BaseModel):
    episode_id: str
    podcast_id: str
    podcast_config_id: str
    s3_path: str
    podcast_format: PodcastFormat
    timestamp: str

class AudioGenerationMessage(BaseModel):
    episode_id: str
    podcast_id: str
    podcast_config_id: str
    script_url: str
    dynamic_config: DynamicConfig
    regenerate: bool
    timestamp: str
```

---

## Error Handling

### Validation Errors

**Missing speaker2_role for multi-speaker:**
```typescript
{
  success: false,
  error: "Speaker 2 role is required for multi-speaker podcasts"
}
```

**Invalid format value:**
```typescript
{
  success: false,
  error: "Validation error: Invalid enum value. Expected 'single-speaker' | 'multi-speaker'"
}
```

### Database Errors

**Format constraint violation:**
```typescript
{
  success: false,
  error: "podcast_format must be 'single-speaker' or 'multi-speaker'"
}
```

### Lambda Errors

**Missing format in message:**
```python
# Lambda logs warning and defaults to 'multi-speaker'
logger.warning(
    f"[AUDIO_GEN] podcast_format missing from dynamic_config, "
    f"defaulting to 'multi-speaker' for episode {episode_id}"
)
```

**Invalid voice configuration:**
```python
# Lambda raises exception and marks episode as failed
raise Exception(
    f"Invalid voice configuration for {podcast_format}: "
    f"speaker2_voice must be null for single-speaker"
)
```

---

## Examples

### Complete Workflow Example

```typescript
// 1. Create Single-Speaker Podcast
const podcast = await createPodcast({
  title: "Daily News Brief",
  creator: "News Corp",
  podcastName: "News Brief",
  contentSource: "telegram",
  telegramChannel: "@dailynews",
  telegramHours: 24,
  podcastFormat: "single-speaker",
  speaker1Role: "News Anchor",
  conversationStyle: "professional",
  creativityLevel: 40,
  language: "english",
  mixingTechniques: ["normalization"],
  episodeFrequency: 1
});

// 2. Trigger Episode Generation
const episode = await triggerEpisodeGeneration({
  podcastId: podcast.data.podcast.id,
  configId: podcast.data.config.id,
  triggerSource: 'manual_admin'
});

// 3. SQS Message Sent to Telegram Lambda
// (Automatically includes podcast_format from config)

// 4. Telegram Lambda Forwards to Script Generation Queue
{
  "episode_id": "episode-123",
  "podcast_id": "podcast-456",
  "podcast_format": "single-speaker",
  "s3_path": "s3://..."
}

// 5. Script Preprocessor Generates Script
// - Uses single-speaker narration style
// - No speaker labels needed

// 6. Script Preprocessor Sends to Audio Generation Queue
{
  "episode_id": "episode-123",
  "dynamic_config": {
    "podcast_format": "single-speaker",
    "speaker1_voice": "Alnilam",
    "speaker2_voice": null,
    "speaker1_role": "News Anchor",
    "speaker2_role": null,
    ...
  }
}

// 7. Audio Generation Lambda Creates Audio
// - Uses VoiceConfig (single voice)
// - Generates consistent single-speaker audio

// 8. Episode Updated to 'completed'
// - Audio URL set
// - Duration calculated
// - Ready for playback
```

---

## Database Queries

### Query Podcasts by Format

```sql
-- Count podcasts by format
SELECT podcast_format, COUNT(*) as count
FROM podcast_configs
GROUP BY podcast_format;

-- Get all single-speaker podcasts
SELECT pc.id, p.title, pc.podcast_format, pc.speaker1_role, pc.speaker2_role
FROM podcast_configs pc
JOIN podcasts p ON p.id = pc.podcast_id
WHERE pc.podcast_format = 'single-speaker';

-- Get all multi-speaker podcasts with both roles
SELECT pc.id, p.title, pc.speaker1_role, pc.speaker2_role
FROM podcast_configs pc
JOIN podcasts p ON p.id = pc.podcast_id
WHERE pc.podcast_format = 'multi-speaker'
AND pc.speaker2_role IS NOT NULL;
```

### Validate Data Integrity

```sql
-- Check for multi-speaker podcasts missing speaker2_role
SELECT id, podcast_name, podcast_format, speaker2_role
FROM podcast_configs
WHERE podcast_format = 'multi-speaker'
AND speaker2_role IS NULL;
-- Should return 0 rows

-- Check for single-speaker podcasts with speaker2_role
SELECT id, podcast_name, podcast_format, speaker2_role
FROM podcast_configs
WHERE podcast_format = 'single-speaker'
AND speaker2_role IS NOT NULL;
-- Should return 0 rows
```

---

## Migration Scripts

### Add podcast_format to Existing Podcasts

```sql
-- Already applied in Phase 1
-- All existing podcasts default to 'multi-speaker'

-- Verify migration
SELECT podcast_format, COUNT(*)
FROM podcast_configs
GROUP BY podcast_format;
```

### Update Specific Podcast to Single-Speaker

```sql
-- Update podcast format (only if no episodes exist)
UPDATE podcast_configs
SET
  podcast_format = 'single-speaker',
  speaker2_role = NULL,
  updated_at = NOW()
WHERE id = 'podcast-config-id'
AND NOT EXISTS (
  SELECT 1 FROM episodes
  WHERE podcast_id = podcast_configs.podcast_id
);
```

---

## Testing

### Unit Tests

```typescript
import { createPodcast } from '@/lib/actions/podcast/create';

describe('Podcast Format Creation', () => {
  it('should create single-speaker podcast without speaker2_role', async () => {
    const result = await createPodcast({
      // ... basic fields
      podcastFormat: 'single-speaker',
      speaker1Role: 'Narrator',
      // speaker2Role omitted
    });

    expect(result.success).toBe(true);
    expect(result.data.config.podcast_format).toBe('single-speaker');
    expect(result.data.config.speaker2_role).toBeNull();
  });

  it('should fail multi-speaker podcast without speaker2_role', async () => {
    const result = await createPodcast({
      // ... basic fields
      podcastFormat: 'multi-speaker',
      speaker1Role: 'Host',
      // speaker2Role omitted - should fail
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Speaker 2 role is required');
  });
});
```

---

## Rate Limits and Quotas

- No specific rate limits for format selection
- Same processing quotas apply to both formats
- TTS API rate limits apply equally to both formats

---

## Additional Resources

- [User Guide](USER_GUIDE.md) - Complete user documentation
- [Podcast Formats Guide](PODCAST_FORMATS.md) - Detailed format comparison
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [CLAUDE.md](../CLAUDE.md) - Architecture documentation
- [Lambda Documentation](../../Lambda/docs/) - Lambda-specific docs

---

**For technical support, consult CloudWatch logs or contact the development team.**
