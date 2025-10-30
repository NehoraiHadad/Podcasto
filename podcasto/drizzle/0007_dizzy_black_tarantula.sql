ALTER TABLE "podcast_configs" ADD COLUMN "speaker_selection_strategy" text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD COLUMN "sequence_dual_count" integer;--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD COLUMN "sequence_single_count" integer;--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD COLUMN "sequence_current_speaker_type" text DEFAULT 'multi-speaker' NOT NULL;--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD COLUMN "sequence_progress_count" integer DEFAULT 0 NOT NULL;