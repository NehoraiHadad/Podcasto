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
	"user_id" uuid,
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
CREATE TABLE "credit_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"credits_amount" numeric NOT NULL,
	"price_usd" numeric NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"validity_days" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"transaction_type" text NOT NULL,
	"balance_after" numeric NOT NULL,
	"episode_id" uuid,
	"podcast_id" uuid,
	"description" text,
	"metadata" jsonb,
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
CREATE TABLE "email_bounces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"bounce_type" varchar(50),
	"sub_type" varchar(50),
	"raw_message" text,
	"created_at" timestamp with time zone DEFAULT now()
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
CREATE TABLE "episode_generation_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" uuid NOT NULL,
	"episode_id" uuid,
	"triggered_by" uuid,
	"status" text NOT NULL,
	"trigger_source" text NOT NULL,
	"content_start_date" timestamp with time zone,
	"content_end_date" timestamp with time zone,
	"failure_reason" text,
	"error_details" jsonb,
	"notification_sent" boolean DEFAULT false,
	"notification_sent_at" timestamp with time zone,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"content_end_date" timestamp with time zone,
	"created_by" uuid,
	"current_stage" text,
	"processing_started_at" timestamp with time zone,
	"last_stage_update" timestamp with time zone,
	"stage_history" jsonb
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
CREATE TABLE "podcast_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_title" text NOT NULL,
	"base_description" text,
	"base_cover_image" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "podcast_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_group_id" uuid NOT NULL,
	"language_code" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_image" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"podcast_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "podcast_languages_podcast_id_unique" UNIQUE("podcast_id")
);
--> statement-breakpoint
CREATE TABLE "podcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_image" text,
	"image_style" text,
	"is_paused" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"podcast_group_id" uuid,
	"language_code" text,
	"migration_status" text DEFAULT 'legacy',
	"auto_generation_enabled" boolean DEFAULT false,
	"last_auto_generated_at" timestamp with time zone,
	"next_scheduled_generation" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"email_notifications" boolean DEFAULT true,
	"has_seen_welcome" boolean DEFAULT false,
	"unsubscribe_token" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "profiles_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
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
	"language_preference" text,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"value_type" text NOT NULL,
	"description" text,
	"category" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "user_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
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
	CONSTRAINT "user_costs_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_credits" numeric DEFAULT '0' NOT NULL,
	"used_credits" numeric DEFAULT '0' NOT NULL,
	"available_credits" numeric DEFAULT '0' NOT NULL,
	"free_credits" numeric DEFAULT '0' NOT NULL,
	"last_purchase_at" timestamp with time zone,
	"credits_expire_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_credits_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"monthly_credits" numeric NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cost_tracking_events" ADD CONSTRAINT "cost_tracking_events_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_tracking_events" ADD CONSTRAINT "cost_tracking_events_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_tracking_events" ADD CONSTRAINT "cost_tracking_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_cost_summary" ADD CONSTRAINT "daily_cost_summary_most_expensive_episode_id_episodes_id_fk" FOREIGN KEY ("most_expensive_episode_id") REFERENCES "public"."episodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_costs" ADD CONSTRAINT "episode_costs_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_costs" ADD CONSTRAINT "episode_costs_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_generation_attempts" ADD CONSTRAINT "episode_generation_attempts_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_generation_attempts" ADD CONSTRAINT "episode_generation_attempts_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_generation_attempts" ADD CONSTRAINT "episode_generation_attempts_triggered_by_profiles_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_processing_logs" ADD CONSTRAINT "episode_processing_logs_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_configs" ADD CONSTRAINT "podcast_configs_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_languages" ADD CONSTRAINT "podcast_languages_podcast_group_id_podcast_groups_id_fk" FOREIGN KEY ("podcast_group_id") REFERENCES "public"."podcast_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_languages" ADD CONSTRAINT "podcast_languages_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_podcast_group_id_podcast_groups_id_fk" FOREIGN KEY ("podcast_group_id") REFERENCES "public"."podcast_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sent_episodes" ADD CONSTRAINT "sent_episodes_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_costs" ADD CONSTRAINT "user_costs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cost_pricing_config_service_idx" ON "cost_pricing_config" USING btree ("service");--> statement-breakpoint
CREATE INDEX "cost_pricing_config_effective_from_idx" ON "cost_pricing_config" USING btree ("effective_from");--> statement-breakpoint
CREATE INDEX "cost_pricing_config_effective_to_idx" ON "cost_pricing_config" USING btree ("effective_to");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_episode_idx" ON "cost_tracking_events" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_podcast_idx" ON "cost_tracking_events" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_user_idx" ON "cost_tracking_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_timestamp_idx" ON "cost_tracking_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "cost_tracking_events_service_idx" ON "cost_tracking_events" USING btree ("service");--> statement-breakpoint
CREATE INDEX "credit_packages_is_active_idx" ON "credit_packages" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "credit_packages_display_order_idx" ON "credit_packages" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "credit_transactions_user_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "credit_transactions_episode_idx" ON "credit_transactions" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_podcast_idx" ON "credit_transactions" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_created_at_idx" ON "credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_bounces_user_id_idx" ON "email_bounces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_bounces_event_type_idx" ON "email_bounces" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "email_bounces_created_at_idx" ON "email_bounces" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "episode_costs_episode_idx" ON "episode_costs" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "episode_costs_podcast_idx" ON "episode_costs" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "episode_costs_total_cost_idx" ON "episode_costs" USING btree ("total_cost_usd");--> statement-breakpoint
CREATE INDEX "episode_costs_created_at_idx" ON "episode_costs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "podcast_languages_group_language_idx" ON "podcast_languages" USING btree ("podcast_group_id","language_code");--> statement-breakpoint
CREATE INDEX "sent_episodes_episode_user_idx" ON "sent_episodes" USING btree ("episode_id","user_id");--> statement-breakpoint
CREATE INDEX "sent_episodes_user_id_idx" ON "sent_episodes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_podcast_id_idx" ON "subscriptions" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_costs_user_idx" ON "user_costs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_costs_total_cost_idx" ON "user_costs" USING btree ("total_cost_usd");--> statement-breakpoint
CREATE INDEX "user_credits_user_idx" ON "user_credits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_credits_available_idx" ON "user_credits" USING btree ("available_credits");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_subscriptions_period_end_idx" ON "user_subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "user_subscriptions_stripe_sub_idx" ON "user_subscriptions" USING btree ("stripe_subscription_id");