ALTER TABLE "departments" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "join_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment_type" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN "hire_date";--> statement-breakpoint
ALTER TABLE "user_profiles" DROP COLUMN "hire_date";