CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(20) DEFAULT 'general',
	"target" varchar(20) DEFAULT 'all',
	"target_value" varchar(100),
	"scheduled_for" timestamp,
	"status" varchar(20) DEFAULT 'draft',
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"employee_id" uuid,
	"role" varchar(100),
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"type" varchar(50) NOT NULL,
	"parameters" jsonb,
	"generated_by" uuid,
	"file_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"permissions" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"users_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"status" varchar(20) NOT NULL,
	"details" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(50) NOT NULL,
	"settings" jsonb NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "check_in" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "check_out" SET DATA TYPE time;--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "status" SET DEFAULT 'present';--> statement-breakpoint
ALTER TABLE "attendance" ALTER COLUMN "work_hours" SET DATA TYPE numeric(4, 2);--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "leave_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "start_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "end_date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "priority" SET DEFAULT 'medium';--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'user_profiles'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_pkey";--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employee_id" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "position" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "hire_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "salary" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "status" varchar(20) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "hr_managers" ADD COLUMN "employee_id" varchar(50);--> statement-breakpoint
ALTER TABLE "hr_managers" ADD COLUMN "position" varchar(100);--> statement-breakpoint
ALTER TABLE "hr_managers" ADD COLUMN "hire_date" date;--> statement-breakpoint
ALTER TABLE "hr_managers" ADD COLUMN "salary" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "hr_managers" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "hr_managers" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "progress" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "position" varchar(100);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "hire_date" date;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "salary" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "employee_id" varchar(50);--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team" ADD CONSTRAINT "project_team_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team" ADD CONSTRAINT "project_team_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id");--> statement-breakpoint
ALTER TABLE "hr_managers" ADD CONSTRAINT "hr_managers_employee_id_unique" UNIQUE("employee_id");--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_employee_id_unique" UNIQUE("employee_id");