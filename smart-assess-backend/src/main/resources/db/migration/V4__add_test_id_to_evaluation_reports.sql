-- Add test_id column to evaluation_reports table
-- This allows linking each evaluation report to a specific test

ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS test_id BIGINT;

-- Add foreign key constraint to tests table
ALTER TABLE evaluation_reports ADD CONSTRAINT fk_evaluation_reports_test 
    FOREIGN KEY (test_id) REFERENCES generated_tests(id) ON DELETE SET NULL;
