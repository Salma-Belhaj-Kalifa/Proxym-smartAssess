package com.example.smart_assess.service;

import com.example.smart_assess.entity.*;
import com.example.smart_assess.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationResultService {

    private final EvaluationResultRepository evaluationResultRepository;
    private final CandidateRepository candidateRepository;
    private final CandidatureRepository candidatureRepository;
    private final GeneratedTestRepository generatedTestRepository;
    private final ElasticsearchService elasticsearchService;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${python.api.base-url:http://localhost:8000}")
    private String pythonApiBaseUrl;

    /**
     * Sauvegarde les résultats techniques du test
     */
    @Transactional
    public EvaluationResult saveTechnicalTestResults(GeneratedTest test, Map<String, Object> testResults) {
        log.info("Saving technical test results for test: {}", test.getId());

        EvaluationResult result = EvaluationResult.builder()
            .test(test)
            .totalScore((Integer) testResults.get("total_score"))
            .maxScore((Integer) testResults.get("max_score"))
            .finalScore(((Number) testResults.get("final_score")).doubleValue())
            .totalQuestions((Integer) testResults.get("total_questions"))
            .correctAnswers((Integer) testResults.get("correct_answers"))
            .build();

        // Ajouter les scores par compétence
        if (testResults.containsKey("skill_scores")) {
            Map<String, Object> skillScoresData = (Map<String, Object>) testResults.get("skill_scores");
            Map<String, EvaluationResult.SkillScore> skillScores = new HashMap<>();
            
            for (Map.Entry<String, Object> entry : skillScoresData.entrySet()) {
                Map<String, Object> scoreData = (Map<String, Object>) entry.getValue();
                EvaluationResult.SkillScore skillScore = EvaluationResult.SkillScore.builder()
                    .correct(((Number) scoreData.get("correct")).intValue())
                    .total(((Number) scoreData.get("total")).intValue())
                    .build();
                skillScores.put(entry.getKey(), skillScore);
            }
            result.setSkillScores(skillScores);
        }

        return evaluationResultRepository.save(result);
    }

    /**
     * Calcule et sauvegarde le matching ciblé pour un candidat
     */
    @Transactional
    public EvaluationResult calculateAndSaveMatching(Long candidateId, Long testId) {
        try {
            log.info("Calculating targeted matching for candidate: {} and test: {}", candidateId, testId);

            // 1. Récupérer le résultat du test existant
            EvaluationResult evaluationResult = evaluationResultRepository.findByTestId(testId)
                .orElseThrow(() -> new RuntimeException("Test result not found for test: " + testId));

            // 2. Récupérer le candidat
            Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new RuntimeException("Candidate not found: " + candidateId));

            evaluationResult.setCandidate(candidate);

            // 3. Récupérer les postes postulés par le candidat
            List<Candidature> candidatures = candidatureRepository.findByCandidate_Id(candidateId);
            List<Long> appliedPositionIds = candidatures.stream()
                .filter(c -> c.getInternshipPositions() != null && !c.getInternshipPositions().isEmpty())
                .flatMap(c -> c.getInternshipPositions().stream())
                .map(position -> position.getId())
                .distinct()
                .collect(Collectors.toList());
            
            log.info("Found {} applied positions for candidate {}: {}", appliedPositionIds.size(), candidateId, appliedPositionIds);

            // 4. Appeler l'endpoint Python pour le matching ciblé
            Map<String, Object> request = new HashMap<>();
            request.put("candidate_id", candidateId);
            request.put("applied_position_ids", appliedPositionIds);

            // 🆕 Test de connexion au serveur Python avant l'appel
            log.info("🔍 Testing connection to Python API at: {}", pythonApiBaseUrl);
            try {
                String healthResponse = webClientBuilder.build()
                    .get()
                    .uri(pythonApiBaseUrl + "/api/v1/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block(Duration.ofSeconds(10));
                log.info("✅ Python API is accessible. Health response: {}", healthResponse);
            } catch (Exception healthException) {
                log.error("❌ Python API is not accessible at: {}", pythonApiBaseUrl);
                log.error("❌ Health check failed: {}", healthException.getMessage());
                throw new RuntimeException("Python API is not available", healthException);
            }

            log.info(" Calling Python API: {}/api/v1/compute-score-cible", pythonApiBaseUrl);
            log.info(" Request payload: {}", request);

            Map<String, Object> matchingResponse = webClientBuilder.build()
                .post()
                .uri(pythonApiBaseUrl + "/api/v1/compute-score-cible")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofMinutes(2));

            // 4. Sauvegarder les résultats de matching
            saveMatchingResults(evaluationResult, matchingResponse);

            log.info("Targeted matching calculated and saved for candidate {}: best match = {}", 
                candidateId, matchingResponse.get("best_match"));

            return evaluationResult;

        } catch (Exception e) {
            log.error("Error calculating targeted matching for candidate: {} and test: {}", candidateId, testId, e);
            throw new RuntimeException("Failed to calculate targeted matching", e);
        }
    }

    private void saveMatchingResults(EvaluationResult evaluationResult, Map<String, Object> response) {
        try {
            // 1. Sauvegarder les scores de matching pour chaque poste
            List<Map<String, Object>> matchingScoresList = (List<Map<String, Object>>) response.get("matching_scores");
            Map<Long, EvaluationResult.MatchingScore> matchingScores = new HashMap<>();
            
            for (Map<String, Object> score : matchingScoresList) {
                EvaluationResult.MatchingScore matchingScore = EvaluationResult.MatchingScore.builder()
                    .positionId(score.get("position_id") != null ? ((Number) score.get("position_id")).longValue() : 0L)
                    .positionTitle((String) score.get("position_title"))
                    .profileSimilarity(score.get("profile_similarity") != null ? ((Number) score.get("profile_similarity")).doubleValue() : 0.0)
                    .skillsSimilarity(score.get("skills_similarity") != null ? ((Number) score.get("skills_similarity")).doubleValue() : 0.0)
                    .technicalScore(score.get("technical_score") != null ? ((Number) score.get("technical_score")).doubleValue() : 0.0)
                    .compositeScore(score.get("combined_score") != null ? ((Number) score.get("combined_score")).doubleValue() : 0.0)
                    .recommendation((String) score.get("recommendation"))
                    .build();
                
                matchingScores.put(matchingScore.getPositionId(), matchingScore);
            }
            
            evaluationResult.setMatchingScores(matchingScores);

            // 2. Sauvegarder le best match (structure directe de la réponse Python)
            Double bestMatchScore = response.get("best_match_score") != null ? ((Number) response.get("best_match_score")).doubleValue() : 0.0;
            Long bestMatchPositionId = response.get("best_match_position_id") != null ? ((Number) response.get("best_match_position_id")).longValue() : 0L;
            String bestMatchTitle = (String) response.get("best_match_title");
            
            if (bestMatchScore > 0.0) {
                evaluationResult.setBestMatchScore(bestMatchScore);
                evaluationResult.setBestMatchPositionId(bestMatchPositionId);
                evaluationResult.setBestMatchTitle(bestMatchTitle);
                log.info("Best match saved: {} (ID: {}) with score: {}", bestMatchTitle, bestMatchPositionId, bestMatchScore);
            } else {
                log.warn("No valid best match found in response for candidate: {}", evaluationResult.getCandidate().getId());
            }

            // 3. Sauvegarder les scores moyens
            evaluationResult.setAverageMatchingScore(response.get("average_matching_score") != null ? ((Number) response.get("average_matching_score")).doubleValue() : 0.0);
            
            // 4. Sauvegarder les détails complets en JSON
            JsonNode matchingDetails = objectMapper.valueToTree(response);
            evaluationResult.setMatchingDetails(matchingDetails);

            evaluationResult.setMatchingCalculatedAt(LocalDateTime.now());
            
            // 5. Sauvegarder en base
            evaluationResultRepository.save(evaluationResult);
            
            log.info("Matching results saved successfully for evaluation result: {}", evaluationResult.getId());

        } catch (Exception e) {
            log.error("Error saving matching results", e);
            throw new RuntimeException("Failed to save matching results", e);
        }
    }

    /**
     * Récupère le best match pour un candidat
     */
    @Transactional(readOnly = true)
    public Optional<BestMatchDto> getBestMatchForCandidate(Long candidateId) {
        return evaluationResultRepository.findByCandidateIdOrderByMatchingCalculatedAtDesc(candidateId)
            .stream()
            .filter(result -> result.getBestMatchPositionId() != null)
            .findFirst()
            .map(this::convertToBestMatchDto);
    }

    /**
     * Récupère tous les scores de matching pour un candidat
     */
    @Transactional(readOnly = true)
    public List<MatchingScoreDto> getAllMatchingScoresForCandidate(Long candidateId) {
        return evaluationResultRepository.findByCandidateIdOrderByMatchingCalculatedAtDesc(candidateId)
            .stream()
            .filter(result -> result.getMatchingScores() != null && !result.getMatchingScores().isEmpty())
            .flatMap(result -> result.getMatchingScores().values().stream())
            .map(this::convertToMatchingScoreDto)
            .collect(Collectors.toList());
    }

    private BestMatchDto convertToBestMatchDto(EvaluationResult result) {
        return BestMatchDto.builder()
            .candidateId(result.getCandidate().getId())
            .bestMatchPositionId(result.getBestMatchPositionId())
            .bestMatchScore(result.getBestMatchScore())
            .bestMatchTitle(result.getBestMatchTitle())
            .averageMatchingScore(result.getAverageMatchingScore())
            .matchingCalculatedAt(result.getMatchingCalculatedAt())
            .allMatchingScores(result.getMatchingScores().values().stream()
                .map(this::convertToMatchingScoreDto)
                .collect(Collectors.toList()))
            .build();
    }

    private MatchingScoreDto convertToMatchingScoreDto(EvaluationResult.MatchingScore score) {
        return MatchingScoreDto.builder()
            .positionId(score.getPositionId())
            .positionTitle(score.getPositionTitle())
            .profileSimilarity(score.getProfileSimilarity())
            .skillsSimilarity(score.getSkillsSimilarity())
            .technicalScore(score.getTechnicalScore())
            .compositeScore(score.getCompositeScore())
            .recommendation(score.getRecommendation())
            .build();
    }

    /**
     * Met à jour le best_match dans evaluation_results
     */
    @Transactional
    public void updateBestMatch(Long candidateId, Long bestMatchPositionId, Double bestMatchScore, 
                               String bestMatchTitle, Map<String, Object> bestMatchDetails) {
        try {
            List<EvaluationResult> results = evaluationResultRepository.findByCandidateIdOrderByMatchingCalculatedAtDesc(candidateId);
            
            if (!results.isEmpty()) {
                EvaluationResult latestResult = results.get(0);
                
                latestResult.setBestMatchPositionId(bestMatchPositionId);
                latestResult.setBestMatchScore(bestMatchScore);
                latestResult.setBestMatchTitle(bestMatchTitle);
                
                // Mettre à jour les détails en JSON
                JsonNode matchingDetails = objectMapper.valueToTree(bestMatchDetails);
                latestResult.setMatchingDetails(matchingDetails);
                latestResult.setMatchingCalculatedAt(LocalDateTime.now());
                
                evaluationResultRepository.save(latestResult);
                
                log.info("Best match updated for candidate {}: {} (score: {})", 
                    candidateId, bestMatchTitle, bestMatchScore);
            }
        } catch (Exception e) {
            log.error("Error updating best match for candidate: {}", candidateId, e);
            throw new RuntimeException("Failed to update best match", e);
        }
    }

    /**
     * Récupère un résultat d'évaluation par ID de test
     */
    @Transactional(readOnly = true)
    public Optional<EvaluationResult> findByTestId(Long testId) {
        return evaluationResultRepository.findByTestId(testId);
    }

    /**
     * Calcule et sauvegarde le score composite complet après un test technique
     */
    public EvaluationResult calculateAndSaveCompositeScore(Long candidateId, Long testId) {
        try {
            log.info("=== CALCULATING COMPOSITE SCORE FOR CANDIDATE: {}, TEST: {} ===", candidateId, testId);
            
            // Defensive check for candidateId
            if (candidateId == null) {
                log.error("❌ CANNOT CALCULATE COMPOSITE SCORE: candidateId is null for test: {}", testId);
                throw new IllegalArgumentException("Candidate ID cannot be null");
            }

            // 1. Récupérer le résultat du test existant
            EvaluationResult evaluationResult = evaluationResultRepository.findByTestId(testId)
                .orElseThrow(() -> new RuntimeException("Test result not found for test: " + testId));

            // 2. Calculer le score de matching ciblé si pas déjà fait (hors transaction)
            if (evaluationResult.getMatchingScores() == null || evaluationResult.getMatchingScores().isEmpty()) {
                log.info("Calculating targeted matching for candidate: {}", candidateId);
                try {
                    evaluationResult = calculateAndSaveMatching(candidateId, testId);
                } catch (Exception e) {
                    log.warn("Failed to calculate targeted matching, continuing with available data: {}", e.getMessage());
                    // Continuer sans le matching ciblé
                }
            } else {
                log.info("Targeted matching already exists for candidate: {}, skipping calculation", candidateId);
            }

            // 3. Récupérer les scores bruts pour les envoyer à Python
            double testScore = calculateTestScore(evaluationResult);
            double fitScore = calculateFitScore(evaluationResult);
            
            log.info("=== ENVOI DES SCORES BRUTS À PYTHON ===");
            log.info("Test score: {:.2f}%", testScore);
            log.info("Fit score (best match): {:.2f}%", fitScore);
            log.info("Python calculera le composite_score et le retournera");
            log.info("=====================================");

            // 4. Mettre à jour Elasticsearch avec les scores bruts - Python calculera le composite_score
            if (evaluationResult.getBestMatchScore() != null) {
                updateCompositeScoreInElasticsearch(candidateId, testScore);
            } else {
                log.info("Skipping Elasticsearch update - no best match score available for candidate: {}", candidateId);
            }

            // 5. Retourner l'objet mis à jour (recharger depuis la base si nécessaire)
            EvaluationResult result = evaluationResultRepository.findById(evaluationResult.getId())
                .orElse(evaluationResult);
            
            log.info("Composite score calculation completed for candidate {} - Python will handle the calculation", candidateId);
            return result;

        } catch (Exception e) {
            log.error("Error calculating composite score for candidate: {} and test: {}", candidateId, testId, e);
            throw new RuntimeException("Failed to calculate composite score", e);
        }
    }
    
    /**
     * Calcule le score du test technique (0-100)
     */
    private double calculateTestScore(EvaluationResult result) {
        log.info("=== DEBUG TEST SCORE FOR CANDIDAT {} ===", result.getCandidate().getId());
        log.info("Result ID: {}", result.getId());
        log.info("Test ID: {}", result.getTest() != null ? result.getTest().getId() : "null");
        log.info("Total Score: {}", result.getTotalScore());
        log.info("Max Score: {}", result.getMaxScore());
        log.info("Final Score: {}", result.getFinalScore());
        log.info("Correct Answers: {}", result.getCorrectAnswers());
        log.info("Total Questions: {}", result.getTotalQuestions());
        log.info("Test Status: {}", result.getTest() != null ? result.getTest().getStatus() : "null");
        
        // 🆕 Le test vient d'être soumis, utiliser directement les données disponibles
        // Ne plus vérifier le statut SUBMITTED car nous sommes dans le contexte de la soumission
        
        if (result.getTotalScore() == null || result.getMaxScore() == null || result.getMaxScore() == 0) {
            log.warn("Test score is 0.0 - TotalScore: {}, MaxScore: {}, CorrectAnswers: {}, TotalQuestions: {}", 
                result.getTotalScore(), result.getMaxScore(), result.getCorrectAnswers(), result.getTotalQuestions());
            
            // Alternative: utiliser correctAnswers/totalQuestions si disponible
            if (result.getCorrectAnswers() != null && result.getTotalQuestions() != null && result.getTotalQuestions() > 0) {
                double alternativeScore = (result.getCorrectAnswers() / (double) result.getTotalQuestions()) * 100.0;
                log.info("Using alternative score calculation: {}/{} = {:.2f}%", 
                    result.getCorrectAnswers(), result.getTotalQuestions(), alternativeScore);
                return alternativeScore;
            }
            
            return 0.0;
        }
        
        // 🆕 Forcer la conversion en double pour éviter la division entière
        double testScore = (result.getTotalScore().doubleValue() / result.getMaxScore().doubleValue()) * 100.0;
        log.info("Calculated test score: {}/{} = {:.2f}%", 
            result.getTotalScore(), result.getMaxScore(), testScore);
        return testScore;
    }
    
    private double calculateFitScore(EvaluationResult result) {
        if (result.getBestMatchScore() == null) {
            return 0.0;
        }
        // Le bestMatchScore est déjà un pourcentage (0-100)
        return Math.min(100.0, Math.max(0.0, result.getBestMatchScore()));
    }

    
    /**
     * Met à jour le composite_score dans Elasticsearch en utilisant les données déjà calculées
     */
    private void updateCompositeScoreInElasticsearch(Long candidateId, Double technicalScore) {
        try {
            // Valider que le candidateId n'est pas null
            if (candidateId == null) {
                log.warn("Cannot update Elasticsearch: candidateId is null");
                return;
            }
            
            log.info("Updating Elasticsearch composite score for candidate {} with technical score: {}", candidateId, technicalScore);
            
            // Récupérer le résultat d'évaluation existant pour utiliser le bestMatchScore déjà calculé
            List<EvaluationResult> existingResults = evaluationResultRepository.findByCandidateIdOrderByMatchingCalculatedAtDesc(candidateId);
            if (existingResults.isEmpty()) {
                log.warn("No evaluation result found for candidate {}, cannot update Elasticsearch", candidateId);
                return;
            }
            
            EvaluationResult result = existingResults.get(0);
            Double bestMatchScore = result.getBestMatchScore();
            
            if (bestMatchScore == null) {
                log.warn("No best match score available for candidate {}, cannot update Elasticsearch", candidateId);
                return;
            }
            
            // Utiliser la formule unifiée : 50% test technique + 50% matching hybride
            // Les deux scores sont en pourcentage (0-100), on calcule directement
            double compositeScore = (technicalScore * 0.5) + (bestMatchScore * 0.5);
            
            log.info("Elasticsearch composite score calculation for candidate {}: technical={:.2f}, matching={:.2f}, composite={:.2f}", 
                candidateId, technicalScore, bestMatchScore, compositeScore);
            
            // DEBUG: Afficher le calcul détaillé
            log.info("=== CALCUL DÉTAILLÉ COMPOSITE (JAVA) ===");
            log.info("Technical score: {:.2f}% -> {:.4f}", technicalScore, technicalScore / 100.0);
            log.info("Best match score: {:.2f}% -> {:.4f}", bestMatchScore, bestMatchScore / 100.0);
            log.info("Composite: ({:.2f} × 0.5) + ({:.2f} × 0.5) = {:.2f}%", 
                technicalScore, bestMatchScore, compositeScore);
            log.info("Composite for Elasticsearch: {:.6f}", compositeScore / 100.0);
            log.info("=====================================");
                
            // Mettre à jour le document candidat via l'API Python
            // Python calculera lui-même le composite_score à partir des scores bruts
            Map<String, Object> updateData = new HashMap<>();
            updateData.put("last_scored_at", java.time.LocalDateTime.now().toString());
            
            // Envoyer les scores bruts pour que Python fasse le calcul
            updateData.put("technical_score", technicalScore); // En pourcentage
            updateData.put("best_match_score", bestMatchScore * 100.0); // Convertir de 0-1 vers pourcentage
            
            // Récupérer les postes postulés par le candidat
            List<Candidature> candidatures = candidatureRepository.findByCandidate_Id(candidateId);
            List<Long> appliedPositionIds = candidatures.stream()
                .filter(c -> c.getInternshipPositions() != null && !c.getInternshipPositions().isEmpty())
                .flatMap(c -> c.getInternshipPositions().stream())
                .map(position -> position.getId())
                .distinct()
                .collect(Collectors.toList());
            
            log.info("Found {} applied positions for candidate {}: {}", appliedPositionIds.size(), candidateId, appliedPositionIds);
            updateData.put("applied_position_ids", appliedPositionIds);
            
            log.info("Sending raw scores to Python for composite calculation: technical={:.2f}%, best_match={:.2f}%", 
                technicalScore, bestMatchScore * 100.0);
            
            // Appeler l'API Python pour mettre à jour Elasticsearch
            Map<String, Object> updateRequest = new HashMap<>();
            updateRequest.put("candidate_id", candidateId);
            updateRequest.put("update_data", updateData);
            
            try {
                Map<String, Object> updateResponse = (Map<String, Object>) webClientBuilder.build()
                    .put()
                    .uri(pythonApiBaseUrl + "/api/v1/candidate/" + candidateId + "/update")
                    .bodyValue(updateRequest)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(10));
                
                // Récupérer le composite_score calculé par Python
                Double pythonCompositeScore = (Double) updateResponse.get("composite_score");
                if (pythonCompositeScore != null) {
                    // Sauvegarder le composite_score dans la base de données Java
                    try {
                        // Récupérer l'evaluationResult depuis la base de données
                        List<EvaluationResult> dbResults = evaluationResultRepository.findByCandidateIdOrderByMatchingCalculatedAtDesc(candidateId);
                        if (!dbResults.isEmpty()) {
                            EvaluationResult dbResult = dbResults.get(0);
                            evaluationResultRepository.updateCompositeScore(
                                dbResult.getId(),
                                pythonCompositeScore,
                                LocalDateTime.now()
                            );
                            log.info("Composite score from Python saved to database for candidate {}: {:.6f}", 
                                candidateId, pythonCompositeScore);
                        } else {
                            log.warn("No evaluation result found for candidate {} to save composite score", candidateId);
                        }
                    } catch (Exception dbException) {
                        log.warn("Failed to save composite score to database for candidate {}: {}", 
                            candidateId, dbException.getMessage());
                    }
                }
                
                log.info("Elasticsearch updated successfully for candidate {}: response={}", candidateId, updateResponse);
            } catch (Exception e) {
                log.error("Failed to update Elasticsearch for candidate {}: {}", candidateId, e.getMessage());
                // Ne pas lancer d'exception pour ne pas bloquer le processus
            }
            
        } catch (Exception e) {
            log.error("Failed to calculate composite score for candidate {}: {}", candidateId, e.getMessage());
            // Pas de fallback - laisser l'erreur se propager pour diagnostiquer le problème réel
        }
    }

    /**
     * Récupère tous les résultats pour un candidat
     */
    @Transactional(readOnly = true)
    public List<EvaluationResult> findByCandidateIdOrderByMatchingCalculatedAtDesc(Long candidateId) {
        return evaluationResultRepository.findByCandidateIdOrderByMatchingCalculatedAtDesc(candidateId);
    }

    // DTOs pour les réponses
    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class BestMatchDto {
        private Long candidateId;
        private Long bestMatchPositionId;
        private Double bestMatchScore;
        private String bestMatchTitle;
        private Double averageMatchingScore;
        private LocalDateTime matchingCalculatedAt;
        private List<MatchingScoreDto> allMatchingScores;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class MatchingScoreDto {
        private Long positionId;
        private String positionTitle;
        private Double profileSimilarity;
        private Double skillsSimilarity;
        private Double technicalScore;
        private Double compositeScore;
        private String recommendation;
    }
}
