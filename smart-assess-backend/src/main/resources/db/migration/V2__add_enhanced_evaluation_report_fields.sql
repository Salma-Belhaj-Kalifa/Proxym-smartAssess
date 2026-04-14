-- Add enhanced fields to evaluation_reports table
-- These fields support the enriched AI evaluation report structure

ALTER TABLE evaluation_reports
    ADD COLUMN position_applied VARCHAR(255),
    ADD COLUMN candidate_summary_text TEXT,
    ADD COLUMN applied_position_title VARCHAR(255),
    ADD COLUMN position_fit VARCHAR(100),
    ADD COLUMN technical_comments TEXT,
    ADD COLUMN position_comments TEXT,
    ADD COLUMN recommendation_comments TEXT,
    ADD COLUMN team_fit_comments TEXT;
