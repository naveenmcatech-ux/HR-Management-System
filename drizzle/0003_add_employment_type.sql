-- Add employment_type column to employees so schema matches application
ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "employment_type" varchar(50);

-- You can set a default value for existing rows if desired, e.g.:
-- UPDATE "employees" SET "employment_type" = 'full_time' WHERE "employment_type" IS NULL;
