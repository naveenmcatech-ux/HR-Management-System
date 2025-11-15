ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_role_id_roles_id_fk";
--> statement-breakpoint
ALTER TABLE "employees" DROP COLUMN IF EXISTS "role_id";