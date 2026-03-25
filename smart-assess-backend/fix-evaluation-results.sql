-- Fix pour supprimer la colonne test_session_id de la table evaluation_results
-- Exécuter dans pgAdmin pour corriger le problème

-- Supprimer la colonne test_session_id si elle existe
ALTER TABLE evaluation_results DROP COLUMN IF EXISTS test_session_id;

-- Vérifier la structure de la table
\d evaluation_results;
