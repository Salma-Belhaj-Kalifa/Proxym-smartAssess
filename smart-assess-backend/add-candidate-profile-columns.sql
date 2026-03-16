-- Script pour ajouter les champs de profil technique à la table candidates
-- Exécuter ce script dans pgAdmin pour mettre à jour la base de données

ALTER TABLE candidates 
ADD COLUMN technical_profile TEXT,
ADD COLUMN cv_analysis TEXT,
ADD COLUMN cv_file_name VARCHAR(255),
ADD COLUMN cv_analyzed_at TIMESTAMP,
ADD COLUMN cv_size BIGINT,
ADD COLUMN cv_type VARCHAR(100);

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN candidates.technical_profile IS 'Profil technique extrait du CV (JSON)';
COMMENT ON COLUMN candidates.cv_analysis IS 'Analyse complète du CV (JSON)';
COMMENT ON COLUMN candidates.cv_file_name IS 'Nom du fichier CV original';
COMMENT ON COLUMN candidates.cv_analyzed_at IS 'Date et heure de l''analyse du CV';
COMMENT ON COLUMN candidates.cv_size IS 'Taille du fichier CV en octets';
COMMENT ON COLUMN candidates.cv_type IS 'Type MIME du fichier CV';
