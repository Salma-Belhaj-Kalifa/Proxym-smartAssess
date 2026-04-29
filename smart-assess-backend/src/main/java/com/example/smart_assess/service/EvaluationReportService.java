package com.example.smart_assess.service;

import com.example.smart_assess.dto.EvaluationReportDto;
import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.entity.EvaluationReportEntity;
import com.example.smart_assess.entity.GeneratedTest;
import com.example.smart_assess.repository.EvaluationReportRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvaluationReportService {

    private final EvaluationReportRepository evaluationReportRepository;
    private final ObjectMapper objectMapper;

    /**
     * Convertit une chaîne en entier de manière sécuritaire
     */
    private Integer parseInteger(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    // Helper methods to avoid repeated casting and null checks
    @SuppressWarnings("unchecked")
    private Map<String, Object> cast(Object obj) {
        return obj instanceof Map ? (Map<String, Object>) obj : new HashMap<>();
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Double) return (Double) val;
        if (val instanceof Number) return ((Number) val).doubleValue();
        try { return Double.parseDouble(val.toString()); }
        catch (NumberFormatException e) { return null; }
    }

    private JsonNode toJson(Object obj) {
        return objectMapper.valueToTree(obj);
    }

    @Transactional
    public EvaluationReportEntity saveEvaluationReport(
            Candidature candidature,
            Map<String, Object> aiReportData,
            String jsonReport,
            GeneratedTest test
    ) {
        log.info("Saving evaluation report for candidature: {} and test: {}", 
                candidature.getId(), test != null ? test.getId() : "null");

        // Debug logs pour voir les données reçues
        log.info("=== DEBUG BACKEND SAUVEGARDE RAPPORT ===");
        log.info("aiReportData received: {}", aiReportData);
        log.info("jsonReport received: {}", jsonReport);
        log.info("jsonReport length: {}", jsonReport != null ? jsonReport.length() : 0);
        log.info("=== FIN DEBUG BACKEND ===");

        try {
            // Stocker uniquement le JSON complet dans full_report
            JsonNode jsonNode = objectMapper.readTree(jsonReport);
            log.info("Parsed JsonNode: {}", jsonNode);
            
            // Enrichir le rapport avec les détails du calcul du score composite
            JsonNode enrichedReport = enrichCompositeScoreBreakdown(jsonNode);
            log.info("Enriched report with composite score breakdown");
            
            EvaluationReportEntity report = EvaluationReportEntity.builder()
                    .candidature(candidature)
                    .test(test)
                    .fullReport(enrichedReport)
                    .generatedAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            EvaluationReportEntity savedReport = evaluationReportRepository.save(report);
            log.info("Evaluation report saved successfully with ID: {}", savedReport.getId());
            log.info("Saved fullReport: {}", savedReport.getFullReport());

            return savedReport;

        } catch (Exception e) {
            log.error("Error saving evaluation report for candidature: {}", candidature.getId(), e);
            throw new RuntimeException("Failed to save evaluation report", e);
        }
    }

    @Transactional(readOnly = true)
    public Optional<EvaluationReportEntity> getLatestReportByCandidatureId(Long candidatureId) {
        return evaluationReportRepository.findTopByCandidatureIdOrderByGeneratedAtDesc(candidatureId);
    }

    @Transactional(readOnly = true)
    public List<EvaluationReportEntity> getAllReportsByCandidatureId(Long candidatureId) {
        return evaluationReportRepository.findByCandidatureIdOrderByGeneratedAtDesc(candidatureId);
    }

    private EvaluationReportDto convertToDto(EvaluationReportEntity entity) {
        return EvaluationReportDto.builder()
                .id(entity.getId())
                .candidatureId(entity.getCandidature() != null ? entity.getCandidature().getId() : null)
                .testId(entity.getTest() != null ? entity.getTest().getId() : null)
                .candidateFirstName(entity.getCandidature() != null && entity.getCandidature().getCandidate() != null ? 
                    entity.getCandidature().getCandidate().getFirstName() : null)
                .candidateLastName(entity.getCandidature() != null && entity.getCandidature().getCandidate() != null ? 
                    entity.getCandidature().getCandidate().getLastName() : null)
                .candidateEmail(entity.getCandidature() != null && entity.getCandidature().getCandidate() != null ? 
                    entity.getCandidature().getCandidate().getEmail() : null)
                .positionTitle(entity.getCandidature() != null ? entity.getCandidature().getPositionTitle() : null)
                .positionCompany(entity.getCandidature() != null ? entity.getCandidature().getPositionCompany() : null)
                .candidatureStatus(entity.getCandidature() != null ? entity.getCandidature().getStatus().name() : null)
                .fullReport(entity.getFullReport())
                .generatedAt(entity.getGeneratedAt())
                .updatedAt(entity.getUpdatedAt())
                .testStatus(entity.getTest() != null ? entity.getTest().getStatus().name() : null)
                .aiScore(extractAiScore(entity.getFullReport()))
                .build();
    }

    private Double extractAiScore(JsonNode fullReport) {
        if (fullReport != null && fullReport.has("technical_assessment")) {
            JsonNode technicalAssessment = fullReport.get("technical_assessment");
            if (technicalAssessment.has("overall_score")) {
                return technicalAssessment.get("overall_score").asDouble();
            }
        }
        return null;
    }

    /**
     * Enrichit le rapport avec les détails du calcul du score composite
     */
    private JsonNode enrichCompositeScoreBreakdown(JsonNode fullReport) {
        try {
            if (fullReport == null || !fullReport.has("hiring_recommendation")) {
                return fullReport;
            }

            JsonNode hiringRecommendation = fullReport.get("hiring_recommendation");
            
            // 🆕 Vérifier si le composite_score pré-calculé existe déjà
            if (hiringRecommendation.has("composite_score") && 
                hiringRecommendation.get("composite_score").isNumber()) {
                
                double preCalculatedScore = hiringRecommendation.get("composite_score").asDouble();
                log.info("✅ Using pre-calculated composite score: {}%", preCalculatedScore);
                
                // Extraire les scores nécessaires pour le breakdown
                Double technicalScore = extractTechnicalScore(fullReport);
                Double positionFitScore = extractPositionFitScore(fullReport);
                
                if (technicalScore != null && positionFitScore != null) {
                    // Créer le breakdown avec le score pré-calculé
                    ObjectNode breakdown = objectMapper.createObjectNode();
                    breakdown.put("technical_test_score", technicalScore);
                    breakdown.put("position_fit_score", positionFitScore);
                    breakdown.put("technical_weight", 0.6);
                    breakdown.put("position_weight", 0.4);
                    breakdown.put("calculation_formula", "60% Test Technique + 40% Fit Poste (pré-calculé)");
                    breakdown.put("final_composite_score", preCalculatedScore);

                    // Mettre à jour le JSON SANS écraser le composite_score
                    if (hiringRecommendation.isObject()) {
                        ((ObjectNode) hiringRecommendation).set("composite_score_breakdown", breakdown);
                        // 🚨 NE PAS écraser composite_score - utiliser la valeur pré-calculée
                    }
                }
                
                return fullReport;
            }
            
            // 🔄 Fallback: Calculer le score composite uniquement si aucun score pré-calculé n'existe
            log.warn("⚠️ No pre-calculated composite score found - calculating fallback score");
            
            // Extraire les scores nécessaires
            Double technicalScore = extractTechnicalScore(fullReport);
            Double positionFitScore = extractPositionFitScore(fullReport);
            
            if (technicalScore == null || positionFitScore == null) {
                return fullReport;
            }

            // Calculer le score composite (uniquement technique + matching)
            double technicalWeight = 0.6;  // 60% pour le test technique
            double positionWeight = 0.4;   // 40% pour le matching poste

            double finalCompositeScore = technicalScore * technicalWeight + 
                                       positionFitScore * positionWeight;

            // Créer le breakdown
            ObjectNode breakdown = objectMapper.createObjectNode();
            breakdown.put("technical_test_score", technicalScore);
            breakdown.put("position_fit_score", positionFitScore);
            breakdown.put("technical_weight", technicalWeight);
            breakdown.put("position_weight", positionWeight);
            breakdown.put("calculation_formula", "60% Test Technique + 40% Fit Poste");
            breakdown.put("final_composite_score", Math.round(finalCompositeScore));

            // Mettre à jour le JSON
            if (hiringRecommendation.isObject()) {
                ((ObjectNode) hiringRecommendation).set("composite_score_breakdown", breakdown);
                ((ObjectNode) hiringRecommendation).put("composite_score", Math.round(finalCompositeScore));
            }

            return fullReport;
        } catch (Exception e) {
            log.error("Error enriching composite score breakdown", e);
            return fullReport;
        }
    }

    private Double extractTechnicalScore(JsonNode fullReport) {
        if (fullReport.has("technical_assessment")) {
            JsonNode technicalAssessment = fullReport.get("technical_assessment");
            if (technicalAssessment.has("overall_score")) {
                return technicalAssessment.get("overall_score").asDouble();
            }
        }
        return null;
    }

    private Double extractPositionFitScore(JsonNode fullReport) {
        if (fullReport.has("position_analysis")) {
            JsonNode positionAnalysis = fullReport.get("position_analysis");
            if (positionAnalysis.has("applied_position_match")) {
                return positionAnalysis.get("applied_position_match").asDouble();
            }
        }
        return null;
    }

    
    @Transactional(readOnly = true)
    public List<EvaluationReportDto> getAllReports() {
        List<EvaluationReportEntity> entities = evaluationReportRepository.findAllByOrderByGeneratedAtDesc();
        return entities.stream()
                .map(this::convertToDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<EvaluationReportEntity> getReportById(Long reportId) {
        return evaluationReportRepository.findById(reportId);
    }

    @Transactional
    public void deleteReport(Long reportId) {
        if (evaluationReportRepository.existsById(reportId)) {
            evaluationReportRepository.deleteById(reportId);
            log.info("Evaluation report deleted with ID: {}", reportId);
        } else {
            throw new RuntimeException("Evaluation report not found with ID: " + reportId);
        }
    }
}