-- Add audio_format column to track audio file format (wav or mp3)
ALTER TABLE "episodes" ADD COLUMN "audio_format" text DEFAULT 'mp3';

-- Backfill existing episodes: identify WAV files by audio_url pattern
UPDATE "episodes"
SET "audio_format" = 'wav'
WHERE "audio_url" LIKE '%.wav';

-- Ensure MP3 format for episodes with .mp3 extension
UPDATE "episodes"
SET "audio_format" = 'mp3'
WHERE "audio_url" LIKE '%.mp3';

-- Set default for episodes without audio_url (pending/failed episodes)
UPDATE "episodes"
SET "audio_format" = 'mp3'
WHERE "audio_url" IS NULL OR "audio_url" = '';