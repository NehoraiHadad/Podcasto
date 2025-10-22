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
CREATE INDEX "email_bounces_user_id_idx" ON "email_bounces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_bounces_event_type_idx" ON "email_bounces" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "email_bounces_created_at_idx" ON "email_bounces" USING btree ("created_at");