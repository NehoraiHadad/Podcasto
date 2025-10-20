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
ALTER TABLE "podcasts" ADD COLUMN "podcast_group_id" uuid;--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "language_code" text;--> statement-breakpoint
ALTER TABLE "podcasts" ADD COLUMN "migration_status" text DEFAULT 'legacy';--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "language_preference" text;--> statement-breakpoint
ALTER TABLE "podcast_languages" ADD CONSTRAINT "podcast_languages_podcast_group_id_podcast_groups_id_fk" FOREIGN KEY ("podcast_group_id") REFERENCES "public"."podcast_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_languages" ADD CONSTRAINT "podcast_languages_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "podcast_languages_group_language_idx" ON "podcast_languages" USING btree ("podcast_group_id","language_code");--> statement-breakpoint
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_podcast_group_id_podcast_groups_id_fk" FOREIGN KEY ("podcast_group_id") REFERENCES "public"."podcast_groups"("id") ON DELETE set null ON UPDATE no action;