-- Migration: Fusionner tables generated_tests et test_sessions
-- Exécuter dans pgAdmin pour migrer les données

-- 1. Ajouter les colonnes de session à la table generated_tests
ALTER TABLE generated_tests 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_auto_submitted BOOLEAN DEFAULT FALSE;

-- 2. Migrer les données de test_sessions vers generated_tests
UPDATE generated_tests gt
SET 
    started_at = ts.started_at,
    submitted_at = ts.submitted_at,
    time_spent_minutes = ts.time_spent_minutes,
    tab_switch_count = ts.tab_switch_count,
    is_auto_submitted = ts.is_auto_submitted
FROM test_sessions ts
WHERE ts.test_id = gt.id;

-- 3. Supprimer l'ancienne colonne test_session_id si elle existe dans generated_tests
ALTER TABLE generated_tests DROP COLUMN IF EXISTS test_session_id;

-- 4. Supprimer l'ancienne table test_sessions (après vérification)
-- D'abord supprimer les contraintes qui dépendent de test_sessions
ALTER TABLE evaluation_results DROP CONSTRAINT IF EXISTS evaluation_results_test_session_id_fkey;
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_test_session_id_fkey;

-- Puis supprimer la table test_sessions avec CASCADE
DROP TABLE IF EXISTS test_sessions CASCADE;

-- 5. Recréer les contraintes sur generated_tests pour evaluation_results et answers
ALTER TABLE evaluation_results 
ADD CONSTRAINT IF NOT EXISTS evaluation_results_test_id_fkey 
FOREIGN KEY (test_id) REFERENCES generated_tests(id) ON DELETE CASCADE;

ALTER TABLE answers 
ADD CONSTRAINT IF NOT EXISTS answers_test_id_fkey 
FOREIGN KEY (test_id) REFERENCES generated_tests(id) ON DELETE CASCADE;

-- 5. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_generated_tests_token ON generated_tests(token);
CREATE INDEX IF NOT EXISTS idx_generated_tests_status ON generated_tests(status);
CREATE INDEX IF NOT EXISTS idx_generated_tests_candidature ON generated_tests(candidature_id);
CREATE INDEX IF NOT EXISTS idx_generated_tests_position ON generated_tests(internship_position_id);
CREATE INDEX IF NOT EXISTS idx_generated_tests_started_at ON generated_tests(started_at);
CREATE INDEX IF NOT EXISTS idx_generated_tests_submitted_at ON generated_tests(submitted_at);
CREATE INDEX IF NOT EXISTS idx_answers_test_id ON answers(test_id);

-- 7. Vérifier la migration
SELECT 
    COUNT(*) as total_tests,
    COUNT(started_at) as tests_with_session_data,
    COUNT(submitted_at) as submitted_tests,
    COUNT(time_spent_minutes) as tests_with_time_data
FROM generated_tests;

-- 8. Afficher un résumé de la migration
SELECT 'Migration terminée avec succès' as status,
       (SELECT COUNT(*) FROM generated_tests) as tests_count,
       (SELECT COUNT(*) FROM answers WHERE test_id IS NOT NULL) as answers_migrees,
       (SELECT COUNT(*) FROM test_sessions) as old_sessions_count;
