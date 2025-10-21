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
ALTER TABLE "cost_tracking_events" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "episodes" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "user_costs" ADD CONSTRAINT "user_costs_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_costs_user_idx" ON "user_costs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_costs_total_cost_idx" ON "user_costs" USING btree ("total_cost_usd");--> statement-breakpoint
ALTER TABLE "cost_tracking_events" ADD CONSTRAINT "cost_tracking_events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cost_tracking_events_user_idx" ON "cost_tracking_events" USING btree ("user_id");