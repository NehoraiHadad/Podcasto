CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"email_notifications" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "image_style" text;--> statement-breakpoint
CREATE INDEX "sent_episodes_episode_user_idx" ON "sent_episodes" USING btree ("episode_id","user_id");--> statement-breakpoint
CREATE INDEX "sent_episodes_user_id_idx" ON "sent_episodes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_podcast_id_idx" ON "subscriptions" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");