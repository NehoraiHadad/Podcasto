CREATE TABLE "cost_pricing_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service" text NOT NULL,
	"region" text,
	"unit_cost_usd" numeric NOT NULL,
	"unit" text NOT NULL,
	"effective_from" timestamp with time zone NOT NULL,
	"effective_to" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_tracking_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid,
	"podcast_id" uuid,
	"event_type" text NOT NULL,
	"service" text NOT NULL,
	"quantity" numeric NOT NULL,
	"unit" text NOT NULL,
	"unit_cost_usd" numeric NOT NULL,
	"total_cost_usd" numeric NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_cost_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"total_episodes_processed" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" numeric DEFAULT '0' NOT NULL,
	"ai_cost_usd" numeric DEFAULT '0' NOT NULL,
	"lambda_cost_usd" numeric DEFAULT '0' NOT NULL,
	"storage_cost_usd" numeric DEFAULT '0' NOT NULL,
	"email_cost_usd" numeric DEFAULT '0' NOT NULL,
	"other_cost_usd" numeric DEFAULT '0' NOT NULL,
	"avg_cost_per_episode_usd" numeric DEFAULT '0' NOT NULL,
	"max_episode_cost_usd" numeric DEFAULT '0' NOT NULL,
	"most_expensive_episode_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_cost_summary_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "episode_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"podcast_id" uuid NOT NULL,
	"ai_text_cost_usd" numeric DEFAULT '0' NOT NULL,
	"ai_image_cost_usd" numeric DEFAULT '0' NOT NULL,
	"ai_tts_cost_usd" numeric DEFAULT '0' NOT NULL,
	"lambda_execution_cost_usd" numeric DEFAULT '0' NOT NULL,
	"s3_operations_cost_usd" numeric DEFAULT '0' NOT NULL,
	"s3_storage_cost_usd" numeric DEFAULT '0' NOT NULL,
	"email_cost_usd" numeric DEFAULT '0' NOT NULL,
	"sqs_cost_usd" numeric DEFAULT '0' NOT NULL,
	"other_cost_usd" numeric DEFAULT '0' NOT NULL,
	"total_cost_usd" numeric DEFAULT '0' NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_emails_sent" integer DEFAULT 0 NOT NULL,
	"total_s3_operations" integer DEFAULT 0 NOT NULL,
	"storage_mb" numeric DEFAULT '0' NOT NULL,
	"lambda_duration_seconds" numeric DEFAULT '0' NOT NULL,
	"cost_calculated_at" timestamp with time zone,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "episode_costs_episode_unique" UNIQUE("episode_id")
);
--> statement-breakpoint
CREATE TABLE "monthly_cost_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"total_episodes" integer DEFAULT 0 NOT NULL,
	"total_podcasts_active" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" numeric DEFAULT '0' NOT NULL,
	"ai_total_usd" numeric DEFAULT '0' NOT NULL,
	"lambda_total_usd" numeric DEFAULT '0' NOT NULL,
	"storage_total_usd" numeric DEFAULT '0' NOT NULL,
	"email_total_usd" numeric DEFAULT '0' NOT NULL,
	"other_total_usd" numeric DEFAULT '0' NOT NULL,
	"podcast_costs" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_cost_summary_year_month_unique" UNIQUE("year","month")
);
--> statement-breakpoint
ALTER TABLE "cost_tracking_events" ADD CONSTRAINT "cost_tracking_events_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_tracking_events" ADD CONSTRAINT "cost_tracking_events_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cost_summary" ADD CONSTRAINT "daily_cost_summary_most_expensive_episode_id_episodes_id_fk" FOREIGN KEY ("most_expensive_episode_id") REFERENCES "public"."episodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_costs" ADD CONSTRAINT "episode_costs_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_costs" ADD CONSTRAINT "episode_costs_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cost_pricing_config_service_idx" ON "cost_pricing_config" USING btree ("service");--> statement-breakpoint
CREATE INDEX "cost_pricing_config_effective_from_idx" ON "cost_pricing_config" USING btree ("effective_from");--> statement-breakpoint
CREATE INDEX "cost_pricing_config_effective_to_idx" ON "cost_pricing_config" USING btree ("effective_to");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_episode_idx" ON "cost_tracking_events" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_podcast_idx" ON "cost_tracking_events" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_timestamp_idx" ON "cost_tracking_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_service_idx" ON "cost_tracking_events" USING btree ("service");--> statement-breakpoint
CREATE INDEX "episode_costs_episode_idx" ON "episode_costs" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "episode_costs_podcast_idx" ON "episode_costs" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "episode_costs_total_cost_idx" ON "episode_costs" USING btree ("total_cost_usd");--> statement-breakpoint
CREATE INDEX "episode_costs_created_at_idx" ON "episode_costs" USING btree ("created_at");