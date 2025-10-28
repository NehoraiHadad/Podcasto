ALTER TABLE "podcasts" ALTER COLUMN "language_code" SET DEFAULT 'en';--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD COLUMN "intro_prompt" text;--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD COLUMN "outro_prompt" text;