CREATE TABLE "recipes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recipes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"share_token" varchar(255) NOT NULL,
	"recipes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"shoppingLists" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dailyPlans" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
DROP TABLE "posts" CASCADE;--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_share_token_unique" ON "recipes" USING btree ("share_token");