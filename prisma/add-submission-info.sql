-- Run this in Supabase SQL Editor to add student info columns
ALTER TABLE "AssignmentSubmission" ADD COLUMN IF NOT EXISTS "studentName" TEXT;
ALTER TABLE "AssignmentSubmission" ADD COLUMN IF NOT EXISTS "className" TEXT;
ALTER TABLE "AssignmentSubmission" ADD COLUMN IF NOT EXISTS "admissionNo" TEXT;
