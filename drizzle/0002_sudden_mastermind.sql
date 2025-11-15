CREATE TABLE "holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"date" date NOT NULL,
	"description" text,
	"is_recurring" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
