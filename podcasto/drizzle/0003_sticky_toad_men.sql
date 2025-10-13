ALTER TABLE "profiles" ADD COLUMN "unsubscribe_token" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_unsubscribe_token_unique" UNIQUE("unsubscribe_token");