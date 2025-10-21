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
ALTER TABLE "podcasts" ADD COLUMN "auto_generation_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "auto_generation_frequency" text;--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "auto_generation_day_of_week" integer;--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "auto_generation_time" time;--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "last_auto_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "next_scheduled_generation" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_episode_id_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_packages_is_active_idx" ON "credit_packages" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "credit_packages_display_order_idx" ON "credit_packages" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "credit_transactions_user_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_type_idx" ON "credit_transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "credit_transactions_episode_idx" ON "credit_transactions" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_podcast_idx" ON "credit_transactions" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "credit_transactions_created_at_idx" ON "credit_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_credits_user_idx" ON "user_credits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_credits_available_idx" ON "user_credits" USING btree ("available_credits");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_subscriptions_period_end_idx" ON "user_subscriptions" USING btree ("current_period_end");--> statement-breakpoint
CREATE INDEX "user_subscriptions_stripe_sub_idx" ON "user_subscriptions" USING btree ("stripe_subscription_id");