-- Migration pour ajouter les champs de matching ciblé à la table evaluation_results

-- Ajouter les nouvelles colonnes pour le matching ciblé
ALTER TABLE evaluation_results 
ADD COLUMN candidate_id BIGINT REFERENCES candidates(id);

ALTER TABLE evaluation_results 
ADD COLUMN best_match_position_id BIGINT;

ALTER TABLE evaluation_results 
ADD COLUMN best_match_score DECIMAL(5,3);

ALTER TABLE evaluation_results 
ADD COLUMN best_match_title VARCHAR(255);

ALTER TABLE evaluation_results 
ADD COLUMN average_matching_score DECIMAL(5,3);

ALTER TABLE evaluation_results 
ADD COLUMN profile_embedding_score DECIMAL(5,3);

ALTER TABLE evaluation_results 
ADD COLUMN skills_embedding_score DECIMAL(5,3);

ALTER TABLE evaluation_results 
ADD COLUMN matching_details JSONB;

ALTER TABLE evaluation_results 
ADD COLUMN matching_calculated_at TIMESTAMP;

ALTER TABLE evaluation_results 
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Créer la table pour les scores de matching
CREATE TABLE matching_scores (
    evaluation_result_id BIGINT NOT NULL REFERENCES evaluation_results(id) ON DELETE CASCADE,
    position_id BIGINT NOT NULL,
    position_title VARCHAR(255),
    profile_similarity DECIMAL(5,3),
    skills_similarity DECIMAL(5,3),
    technical_score DECIMAL(5,3),
    composite_score DECIMAL(5,3),
    recommendation VARCHAR(100),
    PRIMARY KEY (evaluation_result_id, position_id)
);

-- Créer les index pour les performances
CREATE INDEX idx_evaluation_results_candidate_id ON evaluation_results(candidate_id);
CREATE INDEX idx_evaluation_results_best_match ON evaluation_results(best_match_position_id);
CREATE INDEX idx_evaluation_results_matching_calculated_at ON evaluation_results(matching_calculated_at);
CREATE INDEX idx_matching_scores_position_id ON matching_scores(position_id);

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_evaluation_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER evaluation_results_updated_at_trigger
    BEFORE UPDATE ON evaluation_results
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluation_results_updated_at();

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN evaluation_results.candidate_id IS 'Référence au candidat pour le matching ciblé';
COMMENT ON COLUMN evaluation_results.best_match_position_id IS 'ID du meilleur poste correspondant';
COMMENT ON COLUMN evaluation_results.best_match_score IS 'Score du meilleur matching';
COMMENT ON COLUMN evaluation_results.best_match_title IS 'Titre du meilleur poste correspondant';
COMMENT ON COLUMN evaluation_results.average_matching_score IS 'Score moyen de matching';
COMMENT ON COLUMN evaluation_results.profile_embedding_score IS 'Score basé sur le profile embedding (summary)';
COMMENT ON COLUMN evaluation_results.skills_embedding_score IS 'Score basé sur les skills embeddings';
COMMENT ON COLUMN evaluation_results.matching_details IS 'Détails complets du matching en JSON';
COMMENT ON COLUMN evaluation_results.matching_calculated_at IS 'Date de calcul du matching';
COMMENT ON COLUMN evaluation_results.updated_at IS 'Date de dernière mise à jour';

COMMENT ON TABLE matching_scores IS 'Scores de matching détaillés par poste';
COMMENT ON COLUMN matching_scores.position_id IS 'ID du poste';
COMMENT ON COLUMN matching_scores.position_title IS 'Titre du poste';
COMMENT ON COLUMN matching_scores.profile_similarity IS 'Similarité du profil';
COMMENT ON COLUMN matching_scores.skills_similarity IS 'Similarité des compétences';
COMMENT ON COLUMN matching_scores.technical_score IS 'Score technique';
COMMENT ON COLUMN matching_scores.composite_score IS 'Score composite';
COMMENT ON COLUMN matching_scores.recommendation IS 'Recommandation';
