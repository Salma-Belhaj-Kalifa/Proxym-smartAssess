package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.EvaluationReportDto;
import com.example.smart_assess.dto.MatchingResultDto;
import com.example.smart_assess.dto.PositionRequirementsDto;
import com.example.smart_assess.dto.CandidateProfileDto;
import com.example.smart_assess.dto.InternshipPositionDto;
import com.example.smart_assess.entity.GeneratedTest;
import com.example.smart_assess.entity.TestQuestion;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.entity.EvaluationReportEntity;
import com.example.smart_assess.entity.Answer;
import com.example.smart_assess.entity.EvaluationResult;
import com.example.smart_assess.repository.GeneratedTestRepository;
import com.example.smart_assess.repository.TestQuestionRepository;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.AnswerRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import com.example.smart_assess.service.*;

@RestController
@RequestMapping("/api/v1/evaluation")
@RequiredArgsConstructor
@Slf4j
public class EvaluationController {

    private final TechnicalProfileService technicalProfileService;
    private final GeneratedTestRepository generatedTestRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final CandidatureService candidatureService;
    private final AnswerRepository answerRepository;
    private final CandidatureRepository candidatureRepository;
    private final InternshipPositionService internshipPositionService;
    private final EvaluationReportService evaluationReportService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @PostMapping("/generate-report/{candidatureId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<String> generateEvaluationReport(
            @PathVariable Long candidatureId) {
        
        try {
            log.info("Generating evaluation report for candidature: {}", candidatureId);
            
            // Get candidature entity
            Optional<Candidature> candidatureOpt = candidatureRepository.findByIdWithRelations(candidatureId);
            if (candidatureOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Candidature candidature = candidatureOpt.get();
            
            // Get candidate technical profile
            var technicalProfile = technicalProfileService.getByCandidateId(candidature.getCandidate().getId());
            if (technicalProfile == null) {
                return ResponseEntity.badRequest().body("{\"error\": \"Technical profile not found for candidate\"}");
            }
            
            // Get test results if exists
            List<Map<String, Object>> testResults = new ArrayList<>();
            Optional<GeneratedTest> testOpt = generatedTestRepository.findByCandidate_Id(candidature.getCandidate().getId());
            
            log.info("=== TEST RESULTS CHECK FOR CANDIDATE {} ===", candidature.getCandidate().getId());
            log.info("Test found: {}", testOpt.isPresent());
            
            if (testOpt.isPresent()) {
                GeneratedTest test = testOpt.get();
                log.info("Test ID: {}, Status: {}", test.getId(), test.getStatus());
                
                if ("SUBMITTED".equals(test.getStatus().toString())) {
                    log.info("Test is SUBMITTED - calculating real scores...");
                    // Use real test scores from answers
                    EvaluationResult evaluationResult = calculateTestResults(test);
                    if (evaluationResult != null) {
                        testResults = convertEvaluationResultToTestResults(evaluationResult);
                        log.info("Test results calculated: {} skills", testResults.size());
                        for (Map<String, Object> result : testResults) {
                            log.info("Skill {}: {}% ({}/{} correct)", 
                                result.get("skill_name"), 
                                result.get("percentage"),
                                result.get("correct_answers"),
                                result.get("total_questions"));
                        }
                        
                        // Store the evaluation result for later use
                        final EvaluationResult storedEvaluationResult = evaluationResult;
                        
                        // Prepare request for AI service with actual scores
                        Map<String, Object> request = new HashMap<>();
                        request.put("candidate_profile", technicalProfile.getParsedData());
                        request.put("test_results", testResults);
                        
                        // Add candidate information from candidature
                        Map<String, Object> candidateInfo = new HashMap<>();
                        candidateInfo.put("first_name", candidature.getCandidate().getFirstName());
                        candidateInfo.put("last_name", candidature.getCandidate().getLastName());
                        candidateInfo.put("email", candidature.getCandidate().getEmail());
                        candidateInfo.put("phone", candidature.getCandidate().getPhone());
                        candidateInfo.put("position_applied", candidature.getPositionTitle());
                        candidateInfo.put("company", candidature.getPositionCompany());
                        request.put("candidate_info", candidateInfo);
                        
                        // Add the actual global score to ensure LLM uses the correct value
                        request.put("actual_global_score", storedEvaluationResult.getFinalScore());
                        request.put("actual_correct_answers", storedEvaluationResult.getCorrectAnswers());
                        request.put("actual_total_questions", storedEvaluationResult.getTotalQuestions());
                        log.info("Adding actual scores to AI request: {}% ({}/{} correct)", 
                            storedEvaluationResult.getFinalScore(), 
                            storedEvaluationResult.getCorrectAnswers(), 
                            storedEvaluationResult.getTotalQuestions());
                        
                        // Continue with the rest of the method
                        return generateEvaluationReportWithScores(candidature, request, storedEvaluationResult, test);
                    } else {
                        log.warn("EvaluationResult is null - no scores calculated");
                    }
                } else {
                    log.warn("Test status is not SUBMITTED: {}", test.getStatus());
                }
            } else {
                log.warn("No test found for candidate {}", candidature.getCandidate().getId());
            }
            
            // If we reach here, there was no valid test result
            log.info("Final test_results size: {}", testResults.size());
            log.info("=== END TEST RESULTS CHECK ===");
            
            // Prepare request for AI service without actual scores
            Map<String, Object> request = new HashMap<>();
            request.put("candidate_profile", technicalProfile.getParsedData());
            request.put("test_results", testResults);
            
            // Add candidate information from candidature
            Map<String, Object> candidateInfo = new HashMap<>();
            candidateInfo.put("first_name", candidature.getCandidate().getFirstName());
            candidateInfo.put("last_name", candidature.getCandidate().getLastName());
            candidateInfo.put("email", candidature.getCandidate().getEmail());
            candidateInfo.put("phone", candidature.getCandidate().getPhone());
            candidateInfo.put("position_applied", candidature.getPositionTitle());
            candidateInfo.put("company", candidature.getPositionCompany());
            request.put("candidate_info", candidateInfo);
            
            return generateEvaluationReportWithScores(candidature, request, null, null);
            
        } catch (Exception e) {
            log.error("Error generating evaluation report for candidature: {}", candidatureId, e);
            return ResponseEntity.internalServerError().body("{\"error\": \"Internal server error: " + e.getMessage().replace("\"", "\\\"") + "\"}");
        }
    }

    private ResponseEntity<String> generateEvaluationReportWithScores(Candidature candidature, Map<String, Object> request, EvaluationResult evaluationResult, GeneratedTest test) {
        try {
            // Get ALL applied positions with full details
            List<Map<String, Object>> appliedPositions = new ArrayList<>();
            if (candidature.getInternshipPositions() != null && !candidature.getInternshipPositions().isEmpty()) {
                for (InternshipPosition position : candidature.getInternshipPositions()) {
                    Map<String, Object> positionInfo = new HashMap<>();
                    positionInfo.put("id", position.getId());
                    positionInfo.put("title", position.getTitle());
                    positionInfo.put("company", position.getCompany());
                    positionInfo.put("description", position.getDescription());
                    positionInfo.put("required_skills", position.getRequiredSkills());
                    appliedPositions.add(positionInfo);
                }
                log.info("Found {} applied positions for candidature {}: {}", 
                    appliedPositions.size(), candidature.getId(), 
                    appliedPositions.stream().map(p -> (String)p.get("title")).collect(Collectors.toList()));
            } else {
                log.info("No applied positions found for candidature: {}", candidature.getId());
            }
            request.put("applied_positions", appliedPositions);
            
            // Keep backward compatibility with single position
            String primaryPosition = appliedPositions.isEmpty() ? "Poste non spécifié" : (String) appliedPositions.get(0).get("title");
            request.put("applied_position", primaryPosition);
            
            // Call AI service
            String aiServiceUrl = "http://localhost:8000/api/v1/generate-evaluation-report";
            String json_response = restTemplate.postForObject(aiServiceUrl, request, String.class);
            
            if (json_response != null) {
                log.info("Evaluation report generated successfully for candidature: {}", candidature.getId());
                
                try {
                    // Parse JSON response to Map for saving
                    ObjectMapper objectMapper = new ObjectMapper();
                    Map<String, Object> responseMap = objectMapper.readValue(json_response, new TypeReference<Map<String, Object>>() {});

                    // Save the evaluation report with the test parameter
                    evaluationReportService.saveEvaluationReport(
                        candidature,
                        responseMap,
                        json_response,
                        (GeneratedTest) test
                    );

                    log.info("Evaluation report saved for candidature: {}", candidature.getId());
                    return ResponseEntity.ok(json_response);
                } catch (JsonProcessingException e) {
                    log.error("Error parsing AI service response for candidature {}: {}", candidature.getId(), e.getMessage());
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"error\": \"Error parsing AI service response\"}");
                }
            } else {
                log.error("AI service returned null response for candidature: {}", candidature.getId());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"error\": \"AI service returned null response\"}");
            }
        } catch (Exception e) {
            log.error("Error generating evaluation report for candidature: {}", candidature.getId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("{\"error\": \"Error generating evaluation report\", \"details\": \"" + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/reports/{candidatureId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<List<EvaluationReportEntity>> getReportsByCandidature(@PathVariable Long candidatureId) {
        try {
            List<EvaluationReportEntity> reports = evaluationReportService.getAllReportsByCandidatureId(candidatureId);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            log.error("Error retrieving reports for candidature: {}", candidatureId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reports/latest/{candidatureId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<EvaluationReportEntity> getLatestReportByCandidature(@PathVariable Long candidatureId) {
        try {
            Optional<EvaluationReportEntity> report = evaluationReportService.getLatestReportByCandidatureId(candidatureId);
            return report.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error retrieving latest report for candidature: {}", candidatureId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/reports")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<List<EvaluationReportDto>> getAllReports() {
        try {
            List<EvaluationReportDto> reports = evaluationReportService.getAllReports();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            log.error("Error retrieving all evaluation reports", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    
    
    @PostMapping("/match-candidates/{positionId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> matchCandidatesToPosition(
            @PathVariable Long positionId,
            @RequestParam(defaultValue = "10") int topN) {
        
        try {
            log.info("Matching candidates to position: {}", positionId);
            
            // Get position details
            InternshipPositionDto positionDto = internshipPositionService.getPositionById(positionId);
            if (positionDto == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Get all candidatures for this position
            List<CandidatureDto> candidatures = candidatureService.getCandidaturesByPosition(positionId);
            
            // Prepare position requirements
            Map<String, Object> positionRequirements = new HashMap<>();
            positionRequirements.put("title", positionDto.getTitle());
            positionRequirements.put("required_skills", extractSkillsFromDescription(positionDto.getDescription()));
            positionRequirements.put("experience_level", determineExperienceLevel(positionDto.getTitle()));
            positionRequirements.put("domain", determineDomain(positionDto.getTitle()));
            positionRequirements.put("key_requirements", extractRequirements(positionDto.getDescription()));
            positionRequirements.put("description", positionDto.getDescription());
            
            // Prepare candidates profiles
            List<Map<String, Object>> candidatesProfiles = new ArrayList<>();
            
            for (CandidatureDto candidature : candidatures) {
                var technicalProfile = technicalProfileService.getByCandidateId(candidature.getCandidateId());
                if (technicalProfile != null) {
                    Map<String, Object> candidateProfile = new HashMap<>();
                    candidateProfile.put("id", String.valueOf(candidature.getCandidateId()));
                    candidateProfile.put("name", candidature.getCandidateFirstName() + " " + candidature.getCandidateLastName());
                    candidateProfile.put("email", candidature.getCandidateEmail());
                    candidateProfile.put("technical_information", technicalProfile.getParsedData());
                    candidateProfile.put("summary", Map.of(
                        "career_level", "Mid",
                        "years_of_experience", "3-5",
                        "key_skills", Arrays.asList("Java", "Spring", "SQL")
                    ));
                    candidateProfile.put("basic_information", Map.of(
                        "full_name", candidature.getCandidateFirstName() + " " + candidature.getCandidateLastName(),
                        "email", candidature.getCandidateEmail()
                    ));
                    candidatesProfiles.add(candidateProfile);
                }
            }
            
            // Prepare request for AI service
            Map<String, Object> request = new HashMap<>();
            request.put("position_requirements", positionRequirements);
            request.put("candidates_profiles", candidatesProfiles);
            request.put("top_n", topN);
            
            // Call AI service
            String aiServiceUrl = "http://localhost:8000/api/v1/get-best-candidates";
            Map<String, Object> aiResponse = restTemplate.postForObject(aiServiceUrl, request, Map.class);
            
            if (aiResponse != null) {
                log.info("Candidate matching completed successfully for position: {}", positionId);
                return ResponseEntity.ok(aiResponse);
            } else {
                return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to match candidates"
                ));
            }
            
        } catch (Exception e) {
            log.error("Error matching candidates for position: {}", positionId, e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/positions-with-candidates")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<List<Map<String, Object>>> getPositionsWithCandidates() {
        try {
            log.info("Getting all positions with candidate counts");
            
            List<InternshipPositionDto> positions = internshipPositionService.getAllPositions();
            List<Map<String, Object>> positionsWithCandidates = new ArrayList<>();
            
            for (InternshipPositionDto position : positions) {
                List<CandidatureDto> candidatures = candidatureService.getCandidaturesByPosition(position.getId());
                
                Map<String, Object> positionData = new HashMap<>();
                positionData.put("id", position.getId());
                positionData.put("title", position.getTitle());
                positionData.put("company", position.getCompany());
                positionData.put("candidateCount", candidatures.size());
                positionData.put("pendingCount", candidatures.stream()
                    .filter(c -> "PENDING".equals(c.getStatus()))
                    .count());
                positionData.put("acceptedCount", candidatures.stream()
                    .filter(c -> "ACCEPTED".equals(c.getStatus()))
                    .count());
                
                positionsWithCandidates.add(positionData);
            }
            
            return ResponseEntity.ok(positionsWithCandidates);
            
        } catch (Exception e) {
            log.error("Error getting positions with candidates", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/candidate-evaluation-summary/{candidateId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> getCandidateEvaluationSummary(@PathVariable Long candidateId) {
        try {
            log.info("Getting evaluation summary for candidate: {}", candidateId);
            
            // Get candidate's candidatures
            List<CandidatureDto> candidatures = candidatureService.getCandidaturesByCandidate(candidateId);
            
            // Get technical profile
            var technicalProfile = technicalProfileService.getByCandidateId(candidateId);
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("candidateId", candidateId);
            summary.put("totalApplications", candidatures.size());
            summary.put("pendingApplications", candidatures.stream()
                .filter(c -> "PENDING".equals(c.getStatus()))
                .count());
            summary.put("acceptedApplications", candidatures.stream()
                .filter(c -> "ACCEPTED".equals(c.getStatus()))
                .count());
            
            if (technicalProfile != null) {
                Map<String, Object> parsedData = (Map<String, Object>) technicalProfile.getParsedData();
                summary.put("technicalDomain", parsedData.get("domain"));
                summary.put("technologies", parsedData.get("technologies"));
                summary.put("experienceLevel", parsedData.get("career_level"));
            }
            
            // Get test information
            List<Map<String, Object>> testInfo = new ArrayList<>();
            for (CandidatureDto candidature : candidatures) {
                Optional<GeneratedTest> testOpt = generatedTestRepository.findByCandidate_Id(candidature.getCandidateId());
                if (testOpt.isPresent()) {
                    GeneratedTest test = testOpt.get();
                    Map<String, Object> testMap = new HashMap<>();
                    testMap.put("position", candidature.getPositionTitle());
                    testMap.put("testStatus", test.getStatus().toString());
                    testMap.put("testId", test.getId());
                    testInfo.add(testMap);
                }
            }
            summary.put("tests", testInfo);
            
            return ResponseEntity.ok(summary);
            
        } catch (Exception e) {
            log.error("Error getting evaluation summary for candidate: {}", candidateId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // Helper methods
    private List<String> extractSkillsFromDescription(String description) {
        if (description == null) return Arrays.asList("Java", "Spring", "SQL");
        
        // Simple skill extraction - in real implementation, this would be more sophisticated
        List<String> skills = new ArrayList<>();
        String[] commonSkills = {"Java", "Python", "JavaScript", "React", "Spring", "SQL", "MongoDB", "Docker", "AWS"};
        
        for (String skill : commonSkills) {
            if (description.toLowerCase().contains(skill.toLowerCase())) {
                skills.add(skill);
            }
        }
        
        return skills.isEmpty() ? Arrays.asList("Java", "Spring", "SQL") : skills;
    }

    private String determineExperienceLevel(String title) {
        if (title.toLowerCase().contains("senior") || title.toLowerCase().contains("lead")) {
            return "Senior";
        } else if (title.toLowerCase().contains("junior") || title.toLowerCase().contains("intern")) {
            return "Junior";
        } else {
            return "Mid";
        }
    }

    private String determineDomain(String title) {
        if (title.toLowerCase().contains("backend") || title.toLowerCase().contains("back")) {
            return "Backend Development";
        } else if (title.toLowerCase().contains("frontend") || title.toLowerCase().contains("front")) {
            return "Frontend Development";
        } else if (title.toLowerCase().contains("fullstack") || title.toLowerCase().contains("full stack")) {
            return "Full Stack Development";
        } else if (title.toLowerCase().contains("data") || title.toLowerCase().contains("analytics")) {
            return "Data Science";
        } else {
            return "Software Development";
        }
    }

    private List<String> extractRequirements(String description) {
        if (description == null) return Arrays.asList("Strong programming skills", "Problem solving abilities");
        
        List<String> requirements = new ArrayList<>();
        String[] sentences = description.split("\\.");
        
        for (String sentence : sentences) {
            sentence = sentence.trim();
            if (sentence.length() > 10 && !sentence.toLowerCase().contains("we are") && 
                !sentence.toLowerCase().contains("looking for")) {
                requirements.add(sentence);
            }
        }
        
        return requirements.isEmpty() ? Arrays.asList("Strong programming skills", "Problem solving abilities") : 
               requirements.subList(0, Math.min(3, requirements.size()));
    }
    
    private EvaluationResult calculateTestResults(GeneratedTest test) {
        try {
            log.info("=== CALCULATING TEST RESULTS FOR TEST {} ===", test.getId());
            
            // Get answers from candidate
            List<Answer> answers = answerRepository.findByCandidateId(test.getCandidate().getId());
            log.info("Answers found for candidate {}: {}", test.getCandidate().getId(), answers != null ? answers.size() : 0);
            
            if (answers == null || answers.isEmpty()) {
                log.warn("No answers found for candidate {}", test.getCandidate().getId());
                return null;
            }
            
            // Filter answers for this specific test
            List<Answer> testAnswers = answers.stream()
                    .filter(answer -> answer.getTest() != null && answer.getTest().getId().equals(test.getId()))
                    .collect(Collectors.toList());
            
            log.info("Test-specific answers found: {}", testAnswers.size());
            
            if (testAnswers.isEmpty()) {
                log.warn("No test-specific answers found for test {}", test.getId());
                return null;
            }
            
            int totalQuestions = testAnswers.size();
            log.info("Total questions: {}", totalQuestions);
            
            long correctAnswers = testAnswers.stream()
                    .filter(answer -> answer.getIsCorrect() != null && answer.getIsCorrect())
                    .count();
            log.info("Correct answers: {}", correctAnswers);
            
            double totalScore = testAnswers.stream()
                    .mapToDouble(answer -> answer.getScoreObtained() != null ? answer.getScoreObtained() : 0.0)
                    .sum();
            log.info("Total score: {}", totalScore);
            
            double maxScore = testAnswers.stream()
                    .mapToDouble(answer -> answer.getMaxScore() != null ? answer.getMaxScore() : 1.0)
                    .sum();
            log.info("Max score: {}", maxScore);
            
            double finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
            log.info("Final score: {}", finalScore);
            
            // Calculate skill scores using the existing SkillScore structure
            Map<String, EvaluationResult.SkillScore> skillScores = new HashMap<>();
            
            // Group by skillTag
            Map<String, List<Answer>> answersBySkill = testAnswers.stream()
                    .filter(answer -> answer.getQuestion() != null && answer.getQuestion().getSkillTag() != null)
                    .collect(Collectors.groupingBy(answer -> answer.getQuestion().getSkillTag()));
            
            for (Map.Entry<String, List<Answer>> entry : answersBySkill.entrySet()) {
                String skill = entry.getKey();
                List<Answer> skillAnswers = entry.getValue();
                
                int skillCorrect = skillAnswers.stream()
                        .filter(answer -> answer.getIsCorrect() != null && answer.getIsCorrect())
                        .mapToInt(answer -> 1)
                        .sum();
                
                EvaluationResult.SkillScore skillScore = new EvaluationResult.SkillScore();
                skillScore.setCorrect(skillCorrect);
                skillScore.setTotal(skillAnswers.size());
                
                skillScores.put(skill, skillScore);
                log.info("Skill {}: {}/{}", skill, skillCorrect, skillAnswers.size());
            }
            
            // Create EvaluationResult using the existing entity structure
            EvaluationResult result = EvaluationResult.builder()
                    .test(test)
                    .totalScore((int) Math.round(totalScore))
                    .maxScore((int) Math.round(maxScore))
                    .finalScore(finalScore)
                    .totalQuestions(totalQuestions)
                    .correctAnswers((int) correctAnswers)
                    .skillScores(skillScores)
                    .build();
            
            log.info("=== TEST RESULTS CALCULATED ===");
            log.info("Total: {}/{} ({:.1f}%)", (int) Math.round(totalScore), (int) Math.round(maxScore), finalScore);
            log.info("Correct: {}/{}", correctAnswers, totalQuestions);
            
            return result;
            
        } catch (Exception e) {
            log.error("Error calculating test results for test {}: {}", test.getId(), e.getMessage(), e);
            return null;
        }
    }
    
    private List<Map<String, Object>> convertEvaluationResultToTestResults(EvaluationResult evaluationResult) {
        List<Map<String, Object>> testResults = new ArrayList<>();
        
        if (evaluationResult.getSkillScores() != null) {
            for (Map.Entry<String, EvaluationResult.SkillScore> entry : evaluationResult.getSkillScores().entrySet()) {
                String skill = entry.getKey();
                EvaluationResult.SkillScore skillScore = entry.getValue();
                
                // Calculate percentage from correct/total
                double percentage = skillScore.getTotal() > 0 ? 
                    (double) skillScore.getCorrect() / skillScore.getTotal() * 100 : 0;
                
                // Estimate score based on percentage (assuming max score of 10 per skill)
                double estimatedScore = (percentage / 100) * 10;
                double maxScore = 10.0;
                
                Map<String, Object> result = new HashMap<>();
                result.put("skill_name", skill);
                result.put("score", estimatedScore);
                result.put("max_score", maxScore);
                result.put("percentage", percentage);
                result.put("correct_answers", skillScore.getCorrect());
                result.put("total_questions", skillScore.getTotal());
                result.put("comment", String.format("Score: %.1f%% (%d/%d correct)", 
                    percentage, skillScore.getCorrect(), skillScore.getTotal()));
                
                testResults.add(result);
            }
        }
        
        return testResults;
    }
}
