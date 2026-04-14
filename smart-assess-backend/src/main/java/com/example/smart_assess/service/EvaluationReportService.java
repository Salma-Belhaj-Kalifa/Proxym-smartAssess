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
            
            // Extraire les scores nécessaires
            Double technicalScore = extractTechnicalScore(fullReport);
            Double positionFitScore = extractPositionFitScore(fullReport);
            Double cvProfileScore = extractCvProfileScore(fullReport);
            
            if (technicalScore == null || positionFitScore == null || cvProfileScore == null) {
                return fullReport;
            }

            // Calculer le score composite
            double technicalWeight = 0.4;
            double positionWeight = 0.3;
            double cvWeight = 0.3;
            double finalCompositeScore = technicalScore * technicalWeight + 
                                       positionFitScore * positionWeight + 
                                       cvProfileScore * cvWeight;

            // Créer le breakdown
            ObjectNode breakdown = objectMapper.createObjectNode();
            breakdown.put("technical_test_score", technicalScore);
            breakdown.put("position_fit_score", positionFitScore);
            breakdown.put("cv_profile_score", cvProfileScore);
            breakdown.put("technical_weight", technicalWeight);
            breakdown.put("position_weight", positionWeight);
            breakdown.put("cv_weight", cvWeight);
            breakdown.put("calculation_formula", "40% Test Technique + 30% Fit Poste + 30% Profil CV");
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

    private Double extractCvProfileScore(JsonNode fullReport) {
        // Pour le CV Profile Score, nous utilisons une logique basée sur l'expérience et les compétences
        if (fullReport.has("candidate_summary")) {
            JsonNode candidateSummary = fullReport.get("candidate_summary");
            
            // Base score selon le niveau d'expérience
            double baseScore = 50.0; // Default
            
            if (candidateSummary.has("experience_level")) {
                String experienceLevel = candidateSummary.get("experience_level").asText();
                switch (experienceLevel.toLowerCase()) {
                    case "senior":
                        baseScore = 85.0;
                        break;
                    case "intermediate":
                    case "mid":
                        baseScore = 70.0;
                        break;
                    case "junior":
                        baseScore = 55.0;
                        break;
                    case "intern":
                    case "stage":
                        baseScore = 40.0;
                        break;
                }
            }
            
            // Bonus pour le nombre de compétences clés
            if (candidateSummary.has("key_skills_from_profile")) {
                JsonNode keySkills = candidateSummary.get("key_skills_from_profile");
                if (keySkills.isArray()) {
                    int skillCount = keySkills.size();
                    baseScore += Math.min(skillCount * 2, 15); // Max 15 points bonus
                }
            }
            
            return Math.min(baseScore, 100.0);
        }
        return 60.0; // Default fallback
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