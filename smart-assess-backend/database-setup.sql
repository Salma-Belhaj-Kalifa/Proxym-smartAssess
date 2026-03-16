-- =============================================
-- 1. Create database
-- =============================================
CREATE DATABASE assessmentdb
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.utf8'
    LC_CTYPE = 'en_US.utf8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- =============================================
-- 2. Use the database
-- =================================------------
\c assessmentdb;

-- =============================================
-- 3. Enable required extensions
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 4. Create tables (joined inheritance strategy)
-- =============================================

-- Users table (parent)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(20) NOT NULL CHECK (role IN ('CANDIDATE', 'MANAGER', 'HR')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table (child)
CREATE TABLE candidates (
    user_id BIGINT PRIMARY KEY,
    phone VARCHAR(50),
    test_access_token VARCHAR(255),
    token_expires_at TIMESTAMP,
    CONSTRAINT fk_candidate_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Managers table (child)
CREATE TABLE managers (
    user_id BIGINT PRIMARY KEY,
    department VARCHAR(255),
    CONSTRAINT fk_manager_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- HR table (child)
CREATE TABLE hrs (
    user_id BIGINT PRIMARY KEY,
    department VARCHAR(255),
    CONSTRAINT fk_hr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Internship positions
CREATE TABLE internship_positions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    required_skills JSONB,
    accepted_domains JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_position_manager FOREIGN KEY (created_by) REFERENCES managers(user_id) ON DELETE CASCADE
);

-- Candidatures
CREATE TABLE candidatures (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL,
    internship_position_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INELIGIBLE', 'VALIDATED', 'TEST_SENT', 'IN_PROGRESS', 'COMPLETED', 'ACCEPTED', 'REJECTED')),
    rejection_reason TEXT,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidature_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_candidature_position FOREIGN KEY (internship_position_id) REFERENCES internship_positions(id) ON DELETE CASCADE,
    CONSTRAINT unique_candidate_position UNIQUE (candidate_id, internship_position_id)
);

-- Candidate CVs (store files as bytea)
CREATE TABLE candidate_cvs (
    id BIGSERIAL PRIMARY KEY,
    candidate_id BIGINT NOT NULL UNIQUE,
    file_name VARCHAR(255),
    file_data BYTEA,
    file_size_bytes BIGINT,
    parsing_status VARCHAR(20) DEFAULT 'PENDING' CHECK (parsing_status IN ('PENDING', 'PROCESSING', 'DONE')),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cv_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(user_id) ON DELETE CASCADE
);

-- Technical profiles
CREATE TABLE technical_profiles (
    id BIGSERIAL PRIMARY KEY,
    cv_id BIGINT NOT NULL UNIQUE,
    detected_domain VARCHAR(255),
    overall_level VARCHAR(20) CHECK (overall_level IN ('JUNIOR', 'MID', 'SENIOR', 'EXPERT')),
    hiring_signal VARCHAR(20) CHECK (hiring_signal IN ('PROMISING', 'AVERAGE', 'WEAK')),
    parsed_data JSONB,
    profile_summary TEXT,
    is_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_cv FOREIGN KEY (cv_id) REFERENCES candidate_cvs(id) ON DELETE CASCADE
);

-- Generated tests
CREATE TABLE generated_tests (
    id BIGSERIAL PRIMARY KEY,
    candidature_id BIGINT NOT NULL UNIQUE,
    internship_position_id BIGINT NOT NULL,
    token VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'EVALUATED', 'EXPIRED')),
    time_limit_minutes INTEGER,
    assigned_at TIMESTAMP,
    deadline TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_test_candidature FOREIGN KEY (candidature_id) REFERENCES candidatures(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_position FOREIGN KEY (internship_position_id) REFERENCES internship_positions(id) ON DELETE CASCADE
);

-- Test questions
CREATE TABLE test_questions (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) CHECK (question_type IN ('MCQ')),
    options JSONB,
    correct_answer TEXT,
    skill_tag VARCHAR(100),
    max_score DOUBLE PRECISION DEFAULT 1.0,
    order_index INTEGER,
    CONSTRAINT fk_question_test FOREIGN KEY (test_id) REFERENCES generated_tests(id) ON DELETE CASCADE
);

-- Test sessions
CREATE TABLE test_sessions (
    id BIGSERIAL PRIMARY KEY,
    test_id BIGINT NOT NULL UNIQUE,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    time_spent_minutes INTEGER,
    tab_switch_count INTEGER DEFAULT 0,
    is_auto_submitted BOOLEAN DEFAULT false,
    CONSTRAINT fk_session_test FOREIGN KEY (test_id) REFERENCES generated_tests(id) ON DELETE CASCADE
);

-- Answers
CREATE TABLE answers (
    id BIGSERIAL PRIMARY KEY,
    test_session_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    answer_text TEXT,
    selected_option VARCHAR(255),
    is_correct BOOLEAN,
    score_obtained DOUBLE PRECISION DEFAULT 0.0,
    CONSTRAINT fk_answer_session FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_answer_question FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);

-- Evaluation results
CREATE TABLE evaluation_results (
    id BIGSERIAL PRIMARY KEY,
    test_session_id BIGINT NOT NULL UNIQUE,
    test_score DOUBLE PRECISION,
    cv_matching_score DOUBLE PRECISION,
    final_score DOUBLE PRECISION,
    skill_scores JSONB,
    strengths TEXT,
    weaknesses TEXT,
    ai_feedback TEXT,
    recommendation TEXT,
    evaluated_at TIMESTAMP,
    CONSTRAINT fk_result_session FOREIGN KEY (test_session_id) REFERENCES test_sessions(id) ON DELETE CASCADE
);

-- =============================================
-- 5. Create indexes for performance
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Positions indexes
CREATE INDEX idx_positions_active ON internship_positions(is_active);
CREATE INDEX idx_positions_created_by ON internship_positions(created_by);

-- Candidatures indexes
CREATE INDEX idx_candidatures_candidate ON candidatures(candidate_id);
CREATE INDEX idx_candidatures_position ON candidatures(internship_position_id);
CREATE INDEX idx_candidatures_status ON candidatures(status);

-- CV indexes
CREATE INDEX idx_cvs_candidate ON candidate_cvs(candidate_id);
CREATE INDEX idx_cvs_status ON candidate_cvs(parsing_status);

-- Technical profiles indexes
CREATE INDEX idx_profiles_cv ON technical_profiles(cv_id);
CREATE INDEX idx_profiles_domain ON technical_profiles(detected_domain);
CREATE INDEX idx_profiles_level ON technical_profiles(overall_level);

-- Tests indexes
CREATE INDEX idx_tests_token ON generated_tests(token);
CREATE INDEX idx_tests_status ON generated_tests(status);
CREATE INDEX idx_tests_candidature ON generated_tests(candidature_id);

-- Questions indexes
CREATE INDEX idx_questions_test ON test_questions(test_id);
CREATE INDEX idx_questions_type ON test_questions(question_type);

-- Sessions indexes
CREATE INDEX idx_sessions_test ON test_sessions(test_id);

-- Answers indexes
CREATE INDEX idx_answers_session ON answers(test_session_id);
CREATE INDEX idx_answers_question ON answers(question_id);

-- Results indexes
CREATE INDEX idx_results_session ON evaluation_results(test_session_id);

-- =============================================
-- 6. Create sequences for auto-increment (optional, handled by BIGSERIAL)
-- =============================================

-- Sequences are automatically created by BIGSERIAL type

-- =============================================
-- 7. Grant permissions (optional)
-- =============================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- =============================================
-- 8. Sample data (optional - uncomment to insert sample data)
-- =============================================

-- Sample Manager
-- INSERT INTO users (email, password, first_name, last_name, role) VALUES 
-- ('manager@example.com', '$2a$10$dummyHashedPassword', 'John', 'Manager', 'MANAGER');
-- INSERT INTO managers (user_id, department) VALUES 
-- (1, 'Engineering');

-- Sample HR
-- INSERT INTO users (email, password, first_name, last_name, role) VALUES 
-- ('hr@example.com', '$2a$10$dummyHashedPassword', 'Jane', 'HR', 'HR');
-- INSERT INTO hrs (user_id, department) VALUES 
-- (2, 'Human Resources');

-- Sample Candidate
-- INSERT INTO users (email, password, first_name, last_name, role) VALUES 
-- ('candidate@example.com', '$2a$10$dummyHashedPassword', 'Alice', 'Candidate', 'CANDIDATE');
-- INSERT INTO candidates (user_id, phone) VALUES 
-- (3, '+1234567890');

-- Sample Internship Position
-- INSERT INTO internship_positions (title, description, required_skills, accepted_domains, created_by) VALUES 
-- ('Java Developer Intern', 'Java development internship', 
--  '["Java", "Spring", "SQL"]', 
--  '["computer-science", "software-engineering"]', 
--  1);

-- Sample Candidature
-- INSERT INTO candidatures (candidate_id, internship_position_id, status) VALUES 
-- (3, 1, 'PENDING');

-- =============================================
-- 9. Verification queries (optional)
-- =============================================

-- List all tables
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Count records in each table
-- SELECT 
--     'users' as table_name, COUNT(*) as record_count FROM users
-- UNION ALL SELECT 'candidates', COUNT(*) FROM candidates
-- UNION ALL SELECT 'managers', COUNT(*) FROM managers
-- UNION ALL SELECT 'hrs', COUNT(*) FROM hrs
-- UNION ALL SELECT 'internship_positions', COUNT(*) FROM internship_positions
-- UNION ALL SELECT 'candidatures', COUNT(*) FROM candidatures
-- UNION ALL SELECT 'candidate_cvs', COUNT(*) FROM candidate_cvs
-- UNION ALL SELECT 'technical_profiles', COUNT(*) FROM technical_profiles
-- UNION ALL SELECT 'generated_tests', COUNT(*) FROM generated_tests
-- UNION ALL SELECT 'test_questions', COUNT(*) FROM test_questions
-- UNION ALL SELECT 'test_sessions', COUNT(*) FROM test_sessions
-- UNION ALL SELECT 'answers', COUNT(*) FROM answers
-- UNION ALL SELECT 'evaluation_results', COUNT(*) FROM evaluation_results;
