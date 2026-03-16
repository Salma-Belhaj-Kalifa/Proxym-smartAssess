-- =============================================
-- Triggers for automatic insertion into child tables
-- =============================================

-- Function to handle user insertion and route to appropriate child table
CREATE OR REPLACE FUNCTION insert_user_child()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into candidates table if role is CANDIDATE
    IF NEW.role = 'CANDIDATE' THEN
        INSERT INTO candidates (user_id) VALUES (NEW.id);
    -- Insert into managers table if role is MANAGER
    ELSIF NEW.role = 'MANAGER' THEN
        INSERT INTO managers (user_id) VALUES (NEW.id);
    -- Insert into hrs table if role is HR
    ELSIF NEW.role = 'HR' THEN
        INSERT INTO hrs (user_id) VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on users table
CREATE TRIGGER trigger_insert_user_child
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION insert_user_child();

-- =============================================
-- Function to handle user deletion and cascade to child table
-- =============================================

CREATE OR REPLACE FUNCTION delete_user_child()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete from candidates table if role is CANDIDATE
    IF OLD.role = 'CANDIDATE' THEN
        DELETE FROM candidates WHERE user_id = OLD.id;
    -- Delete from managers table if role is MANAGER
    ELSIF OLD.role = 'MANAGER' THEN
        DELETE FROM managers WHERE user_id = OLD.id;
    -- Delete from hrs table if role is HR
    ELSIF OLD.role = 'HR' THEN
        DELETE FROM hrs WHERE user_id = OLD.id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deletion (optional, since we have ON DELETE CASCADE)
CREATE TRIGGER trigger_delete_user_child
    BEFORE DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION delete_user_child();

-- =============================================
-- Function to handle user role update and move between child tables
-- =============================================

CREATE OR REPLACE FUNCTION update_user_child()
RETURNS TRIGGER AS $$
BEGIN
    -- If role changed, we need to move from one child table to another
    IF OLD.role != NEW.role THEN
        -- Delete from old child table
        IF OLD.role = 'CANDIDATE' THEN
            DELETE FROM candidates WHERE user_id = OLD.id;
        ELSIF OLD.role = 'MANAGER' THEN
            DELETE FROM managers WHERE user_id = OLD.id;
        ELSIF OLD.role = 'HR' THEN
            DELETE FROM hrs WHERE user_id = OLD.id;
        END IF;
        
        -- Insert into new child table
        IF NEW.role = 'CANDIDATE' THEN
            INSERT INTO candidates (user_id) VALUES (NEW.id);
        ELSIF NEW.role = 'MANAGER' THEN
            INSERT INTO managers (user_id) VALUES (NEW.id);
        ELSIF NEW.role = 'HR' THEN
            INSERT INTO hrs (user_id) VALUES (NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for role updates
CREATE TRIGGER trigger_update_user_child
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_child();

-- =============================================
-- Test the trigger (optional)
-- =============================================

-- Test inserting a candidate
-- INSERT INTO users (email, password, first_name, last_name, role) VALUES 
-- ('test.candidate@example.com', '$2a$10$dummyHashedPassword', 'Test', 'Candidate', 'CANDIDATE');

-- Verify it was inserted in both tables
-- SELECT u.id, u.email, u.role FROM users u WHERE u.email = 'test.candidate@example.com';
-- SELECT c.user_id FROM candidates c WHERE c.user_id = (SELECT id FROM users WHERE email = 'test.candidate@example.com');

-- Test role change
-- UPDATE users SET role = 'MANAGER' WHERE email = 'test.candidate@example.com';

-- Verify it moved from candidates to managers
-- SELECT u.id, u.email, u.role FROM users u WHERE u.email = 'test.candidate@example.com';
-- SELECT m.user_id FROM managers m WHERE m.user_id = (SELECT id FROM users WHERE email = 'test.candidate@example.com');
-- SELECT c.user_id FROM candidates c WHERE c.user_id = (SELECT id FROM users WHERE email = 'test.candidate@example.com'); -- Should return empty

-- Clean up test data
-- DELETE FROM users WHERE email = 'test.candidate@example.com';
