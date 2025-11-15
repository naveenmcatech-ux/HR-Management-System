CREATE TABLE "attendance_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_hours" numeric(3, 1) DEFAULT '8.0' NOT NULL,
	"overtime_rate" numeric(3, 1) DEFAULT '1.5' NOT NULL,
	"grace_period" integer DEFAULT 15 NOT NULL,
	"auto_checkout" boolean DEFAULT true,
	"check_in_start" time DEFAULT '08:00' NOT NULL,
	"check_in_end" time DEFAULT '10:00' NOT NULL,
	"check_out_start" time DEFAULT '17:00' NOT NULL,
	"check_out_end" time DEFAULT '19:00' NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "employee_id" SET NOT NULL;--> statement-breakpoint
-- Convert time-only columns to timestamps by adding a default date so existing values can be cast
ALTER TABLE "attendance" ALTER COLUMN "check_in" SET DATA TYPE timestamp WITHOUT time zone USING ('1970-01-01'::date + "check_in");--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "check_out" SET DATA TYPE timestamp WITHOUT time zone USING ('1970-01-01'::date + "check_out");--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DEFAULT 'not_checked_in';--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "work_hours" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "late_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "early_checkout" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "overtime_minutes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "is_manual_entry" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "attendance_settings" ADD CONSTRAINT "attendance_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;