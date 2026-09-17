-- Admission applications on the landing page (src/app/apply)
-- Run this in the Supabase SQL editor before deploying the application form.

-- Applicants are created at submission time as pending STUDENT users.
-- An admission number is assigned by the admin on approval, so it may be null.
ALTER TABLE "Student" ALTER COLUMN "admissionNo" DROP NOT NULL;

-- The class/programme the applicant applied for (JSS 1-3 / SS 1-3), captured by the form.
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "classAppliedFor" TEXT;