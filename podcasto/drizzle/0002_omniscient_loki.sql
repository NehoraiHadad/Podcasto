-- Step 1: Migrate data from podcast_configs.language to podcasts.language_code
-- Convert full language names to ISO codes
UPDATE podcasts p
SET language_code = CASE
  WHEN pc.language = 'hebrew' THEN 'he'
  WHEN pc.language = 'english' THEN 'en'
  WHEN pc.language = 'arabic' THEN 'ar'
  WHEN pc.language = 'french' THEN 'fr'
  WHEN pc.language = 'spanish' THEN 'es'
  WHEN pc.language = 'german' THEN 'de'
  WHEN pc.language = 'italian' THEN 'it'
  WHEN pc.language = 'portuguese' THEN 'pt'
  WHEN pc.language = 'russian' THEN 'ru'
  WHEN pc.language = 'chinese' THEN 'zh'
  WHEN pc.language = 'japanese' THEN 'ja'
  WHEN pc.language = 'korean' THEN 'ko'
  WHEN pc.language = 'hindi' THEN 'hi'
  WHEN pc.language = 'bengali' THEN 'bn'
  WHEN pc.language = 'indonesian' THEN 'id'
  WHEN pc.language = 'turkish' THEN 'tr'
  WHEN pc.language = 'vietnamese' THEN 'vi'
  WHEN pc.language = 'ukrainian' THEN 'uk'
  WHEN pc.language = 'polish' THEN 'pl'
  ELSE 'he' -- Default to Hebrew
END
FROM podcast_configs pc
WHERE p.id = pc.podcast_id
  AND p.language_code IS NULL;

--> statement-breakpoint
-- Step 2: Set default value
ALTER TABLE "podcasts" ALTER COLUMN "language_code" SET DEFAULT 'en';

--> statement-breakpoint
-- Step 3: Fill any remaining NULL values with default
UPDATE podcasts
SET language_code = 'en'
WHERE language_code IS NULL;

--> statement-breakpoint
-- Step 4: Add NOT NULL constraint (now safe since all values are filled)
ALTER TABLE "podcasts" ALTER COLUMN "language_code" SET NOT NULL;

--> statement-breakpoint
-- Step 5: Drop the old language column from podcast_configs
ALTER TABLE "podcast_configs" DROP COLUMN "language";