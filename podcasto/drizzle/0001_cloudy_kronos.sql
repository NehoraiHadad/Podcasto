ALTER TABLE "podcast_configs" ALTER COLUMN "speaker2_role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD COLUMN "podcast_format" text DEFAULT 'multi-speaker';