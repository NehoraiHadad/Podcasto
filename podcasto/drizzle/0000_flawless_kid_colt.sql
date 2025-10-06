CREATE TABLE "episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"language" text,
	"audio_url" varchar,
	"duration" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"published_at" timestamp with time zone,
	"status" text,
	"metadata" text,
	"cover_image" text,
	"script_url" varchar,
	"analysis" text,
	"speaker2_role" text,
	"content_start_date" timestamp with time zone,
	"content_end_date" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "podcast_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" uuid,
	"content_source" text NOT NULL,
	"telegram_channel" text,
	"telegram_hours" integer,
	"urls" jsonb,
	"creator" text NOT NULL,
	"podcast_name" text NOT NULL,
	"slogan" text,
	"language" text DEFAULT 'english',
	"creativity_level" integer NOT NULL,
	"is_long_podcast" boolean NOT NULL,
	"discussion_rounds" integer NOT NULL,
	"min_chars_per_round" integer NOT NULL,
	"conversation_style" text NOT NULL,
	"speaker1_role" text NOT NULL,
	"speaker2_role" text NOT NULL,
	"mixing_techniques" jsonb NOT NULL,
	"additional_instructions" text,
	"episode_frequency" integer DEFAULT 7,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "podcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_image" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sent_episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"episode_id" uuid,
	"sent_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"podcast_id" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD CONSTRAINT "podcast_configs_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_episodes" ADD CONSTRAINT "sent_episodes_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;