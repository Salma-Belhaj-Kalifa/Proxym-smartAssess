-- Simplify evaluation_reports table to use only full_report JSON column
-- Drop all individual columns since everything is now stored in full_report

-- Drop individual candidate_summary columns
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS candidate_name;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS candidate_email;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS experience_level;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS years_of_experience;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS primary_domain;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS key_technologies;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS position_applied;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS candidate_summary_text;

-- Drop individual technical_assessment columns
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS overall_score;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS skill_breakdown;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS strengths;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS improvement_areas;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS technical_comments;

-- Drop individual position_analysis columns
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS applied_position_match;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS recommended_positions;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS alternative_positions;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS applied_position_title;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS position_fit;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS position_comments;

-- Drop individual hiring_recommendation columns
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS recommendation;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS confidence_score;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS key_factors;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS potential_risks;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS next_steps;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS recommendation_comments;

-- Drop individual team_fit_analysis columns
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS collaboration_score;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS leadership_potential;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS adaptability_score;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS cultural_fit_indicators;
ALTER TABLE evaluation_reports DROP COLUMN IF EXISTS team_fit_comments;

-- Ensure full_report column is NOT NULL
ALTER TABLE evaluation_reports ALTER COLUMN full_report SET NOT NULL;
