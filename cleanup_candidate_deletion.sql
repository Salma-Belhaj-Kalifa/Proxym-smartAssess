-- SQL script to clean up existing data causing foreign key constraint violations
-- Run this script to manually delete records that are preventing candidate deletion

-- First, identify the problematic records
SELECT 'evaluation_reports' as table_name, COUNT(*) as count, test_id 
FROM evaluation_reports 
WHERE test_id = 143 
GROUP BY test_id;

-- Delete from evaluation_reports first (most restrictive)
DELETE FROM evaluation_reports WHERE test_id = 143;

-- Then delete from other tables in order
DELETE FROM evaluation_results WHERE test_id = 143;
DELETE FROM test_questions WHERE test_id = 143;
DELETE FROM answers WHERE test_id = 143;

-- Finally, delete the generated_test
DELETE FROM generated_tests WHERE id = 143;

-- Verify cleanup
SELECT 'Cleanup completed' as status;
