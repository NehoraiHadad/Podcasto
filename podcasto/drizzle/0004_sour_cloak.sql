CREATE TABLE "episode_processing_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"stage" text NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"error_details" jsonb,
	"metadata" jsonb,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "current_stage" text;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "processing_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "last_stage_update" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "stage_history" jsonb;--> statement-breakpoint
ALTER TABLE "episode_processing_logs" ADD CONSTRAINT "episode_processing_logs_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;