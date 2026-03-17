package com.example.smart_assess.controller;

import com.example.smart_assess.enums.CandidatureStatus;
import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.entity.GeneratedTest;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.entity.TechnicalProfile;
import com.example.smart_assess.entity.TestQuestion;
import com.example.smart_assess.enums.QuestionType;
import com.example.smart_assess.enums.TestStatus;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.GeneratedTestRepository;
import com.example.smart_assess.repository.InternshipPositionRepository;
import com.example.smart_assess.entity.*;
import com.example.smart_assess.repository.*;
import com.example.smart_assess.service.TechnicalProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
@Slf4j
public class GeneratedTestController {

    private final GeneratedTestRepository generatedTestRepository;
    private final CandidatureRepository candidatureRepository;
    private final InternshipPositionRepository internshipPositionRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestSessionRepository testSessionRepository;
    private final TechnicalProfileService technicalProfileService;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @GetMapping("/check-existing/{candidatureId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> checkExistingTest(@PathVariable Long candidatureId) {
        try {
            log.info("Checking existing test for candidature ID: {}", candidatureId);
            
            Optional<GeneratedTest> existingTest = generatedTestRepository.findByCandidature_Id(candidatureId);
            
            Map<String, Object> result = new HashMap<>();
            
            if (existingTest.isPresent()) {
                GeneratedTest test = existingTest.get();
                result.put("hasTest", true);
                result.put("testId", test.getId());
                result.put("token", test.getToken());
                result.put("status", test.getStatus().toString());
                result.put("createdAt", test.getCreatedAt().toString());
                log.info("Found existing test for candidature {}: test ID {}", candidatureId, test.getId());
            } else {
                result.put("hasTest", false);
                log.info("No existing test found for candidature {}", candidatureId);
            }
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error checking existing test for candidature {}", candidatureId, e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> generateTest(@RequestBody Map<String, Object> testData) {
        Map<String, Object> result = new HashMap<>();

        try {
            Long candidatureId = Long.valueOf(testData.get("candidatureId").toString());
            String level = testData.get("level").toString();
            Integer questionCount = Integer.valueOf(testData.get("questionCount").toString());
            Integer duration = Integer.valueOf(testData.get("duration").toString());
            String deadline = testData.get("deadline").toString();
            String note = testData.get("note").toString();

            log.info("=== GENERATING TEST ===");
            log.info("Candidature ID: {}", candidatureId);
            log.info("Level: {}", level);
            log.info("Question Count: {}", questionCount);
            log.info("Duration: {}", duration);
            log.info("Deadline: {}", deadline);
            log.info("Note: {}", note);

            // Vérifier candidature
            Candidature candidature = candidatureRepository.findById(candidatureId)
                    .orElseThrow(() -> new RuntimeException("Candidature not found with ID: " + candidatureId));

            // ===== VALIDATION =====
            // Vérifier si un test existe déjà pour cette candidature
            Optional<GeneratedTest> existingTest = generatedTestRepository.findByCandidature_Id(candidatureId);
            if (existingTest.isPresent()) {
                GeneratedTest test = existingTest.get();
                result.put("success", false);
                result.put("error", "UN TEST EXISTE DÉJÀ");
                result.put("message", "Un test a déjà été généré pour cette candidature le " + test.getCreatedAt().toLocalDate());
                result.put("existingTestId", test.getId());
                result.put("existingTestToken", test.getToken());
                result.put("existingTestStatus", test.getStatus().toString());
                result.put("existingTestCreatedAt", test.getCreatedAt().toString()); // Ajouter la date de création
                
                // Inclure les questions si elles existent
                if (test.getQuestions() != null && !test.getQuestions().isEmpty()) {
                    List<Map<String, Object>> questionsData = test.getQuestions().stream()
                            .map(q -> {
                                Map<String, Object> questionMap = new HashMap<>();
                                questionMap.put("id", q.getId());
                                questionMap.put("question", q.getQuestionText());
                                questionMap.put("question_type", q.getQuestionType().toString());
                                questionMap.put("options", q.getOptions() != null ? 
                                        objectMapper.convertValue(q.getOptions(), List.class) : new ArrayList<>());
                                questionMap.put("correct_answer", q.getCorrectAnswer());
                                questionMap.put("technology", q.getSkillTag());
                                return questionMap;
                            })
                            .collect(Collectors.toList());
                    result.put("questions", questionsData);
                    log.info("Included {} existing questions in 409 response", questionsData.size());
                } else {
                    result.put("questions", new ArrayList<>());
                    log.info("No questions found for existing test, returning empty list");
                }
                
                log.warn("Test generation attempted for candidature {} - Test already exists: {}", candidatureId, test.getId());
                return ResponseEntity.status(409).body(result); // 409 Conflict
            }

            InternshipPosition position = candidature.getInternshipPosition();

            // ===== CALL FASTAPI =====
            // Récupérer le profil technique via le CV du candidat
            TechnicalProfile technicalProfile = technicalProfileService.findByCandidateId(candidature.getCandidate().getId())
                .orElseThrow(() -> new RuntimeException("Technical profile not found for candidate"));
            
            Map<String, Object> aiPayload = new HashMap<>();
            aiPayload.put("candidate_profile", technicalProfile.getParsedData());
            aiPayload.put("number_of_questions", questionCount);

            log.info("Sending request to AI API with {} questions, level: {}", questionCount, level);
            log.info("AI payload: {}", aiPayload);

            Map aiResponse = webClientBuilder.build()
                    .post()
                    .uri("http://localhost:8000/api/v1/generate-from-profile")
                    .bodyValue(aiPayload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            log.info("AI response: {}", aiResponse);

            if (aiResponse == null) {
                throw new RuntimeException("AI generation failed");
            }

            // ===== CREATE TEST =====
            // Créer le test sans sauvegarder les questions
            GeneratedTest test = GeneratedTest.builder()
                    .candidature(candidature)
                    .internshipPosition(candidature.getInternshipPosition())
                    .token(UUID.randomUUID().toString())
                    .status(TestStatus.DRAFT)
                    .createdAt(LocalDateTime.now())
                    .assignedAt(LocalDateTime.now())
                    .deadline(LocalDateTime.parse(deadline + "T23:59:59"))
                    .timeLimitMinutes(duration)
                    .build();

            test = generatedTestRepository.save(test);
            log.info("Test created with ID: {}", test.getId());

            // Stocker les questions en mémoire (temporaire) - ne pas sauvegarder en base
            List<Map<String, Object>> questionsData = (List<Map<String, Object>>) aiResponse.get("questions");
            log.info("Received {} questions from AI API (requested: {})", questionsData.size(), questionCount);
            log.info("Questions stored temporarily - will be saved on validation");

            // Mettre à jour le statut de la candidature
            candidature.setStatus(CandidatureStatus.TEST_SENT);
            candidatureRepository.save(candidature);
            log.info("Updated candidature status to TEST_SENT for candidature ID: {}", candidatureId);

            result.put("success", true);
            result.put("testId", test.getId());
            result.put("token", test.getToken());
            result.put("questions", questionsData); // Retourner les questions pour l'affichage
            result.put("message", "Test generated successfully. Please review and validate the questions.");

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());

            log.error("Error generating test", e);

            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTest(@PathVariable Long id) {
        Map<String, Object> result = new HashMap<>();

        try {
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found with ID: " + id));

            result.put("success", true);
            result.put("test", test);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());

            return ResponseEntity.status(404).body(result);
        }
    }

    @GetMapping("/candidature/{candidatureId}")
    public ResponseEntity<Map<String, Object>> getTestByCandidature(@PathVariable Long candidatureId) {
        Map<String, Object> result = new HashMap<>();

        try {
            GeneratedTest test = generatedTestRepository.findByCandidature_Id(candidatureId)
                    .orElse(null);

            if (test == null) {
                result.put("success", false);
                result.put("message", "No test found for this candidature");
                return ResponseEntity.ok(result);
            }

            result.put("success", true);
            result.put("test", test);

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());

            return ResponseEntity.status(500).body(result);
        }
    }

    @GetMapping("/{id}/review")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getTestForReview(@PathVariable Long id) {
        try {
            log.info("Getting test for review - ID: {}", id);
            
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));
            
            Map<String, Object> reviewData = new HashMap<>();
            reviewData.put("testId", test.getId());
            reviewData.put("token", test.getToken());
            reviewData.put("candidatureId", test.getCandidature().getId());
            reviewData.put("candidateName", test.getCandidature().getCandidate().getFirstName() + " " + 
                            test.getCandidature().getCandidate().getLastName());
            reviewData.put("positionTitle", test.getInternshipPosition().getTitle());
            
            // Si le test est en mode DRAFT, les questions ne sont pas encore en base
            // Elles seront retournées comme une liste vide pour être gérées côté frontend
            List<Map<String, Object>> questions = new ArrayList<>();
            
            if (test.getStatus() != TestStatus.DRAFT && test.getQuestions() != null) {
                // Si le test n'est plus en DRAFT, récupérer les questions de la base
                questions = test.getQuestions().stream()
                        .map(q -> {
                            Map<String, Object> questionMap = new HashMap<>();
                            questionMap.put("id", q.getId());
                            questionMap.put("questionText", q.getQuestionText());
                            questionMap.put("questionType", q.getQuestionType().toString());
                            questionMap.put("options", q.getOptions() != null ? 
                                    objectMapper.convertValue(q.getOptions(), List.class) : new ArrayList<>());
                            questionMap.put("correctAnswer", q.getCorrectAnswer());
                            questionMap.put("skillTag", q.getSkillTag());
                            questionMap.put("maxScore", q.getMaxScore());
                            questionMap.put("orderIndex", q.getOrderIndex());
                            return questionMap;
                        })
                        .collect(Collectors.toList());
            }
            
            reviewData.put("questions", questions);
            reviewData.put("isDraft", test.getStatus() == TestStatus.DRAFT);
            
            log.info("Returning test review data with {} questions (isDraft: {})", questions.size(), test.getStatus() == TestStatus.DRAFT);
            return ResponseEntity.ok(reviewData);
            
        } catch (Exception e) {
            log.error("Error getting test for review", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/questions")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> updateTestQuestions(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> request) {
        
        try {
            log.info("Updating test questions - ID: {}", id);
            
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questionsData = (List<Map<String, Object>>) request.get("questions");
            
            // Supprimer les anciennes questions
            testQuestionRepository.deleteAll(test.getQuestions());
            
            // Créer les nouvelles questions
            List<TestQuestion> newQuestions = new ArrayList<>();
            for (int i = 0; i < questionsData.size(); i++) {
                Map<String, Object> questionData = questionsData.get(i);
                
                TestQuestion testQuestion = TestQuestion.builder()
                        .test(test)
                        .questionText((String) questionData.get("questionText"))
                        .questionType(QuestionType.valueOf((String) questionData.get("questionType")))
                        .options(objectMapper.valueToTree(questionData.get("options")))
                        .correctAnswer((String) questionData.get("correctAnswer"))
                        .skillTag((String) questionData.get("skillTag"))
                        .maxScore(((Number) questionData.getOrDefault("maxScore", 1.0)).doubleValue())
                        .orderIndex(i)
                        .build();
                
                testQuestion = testQuestionRepository.save(testQuestion);
                newQuestions.add(testQuestion);
            }
            
            test.setQuestions(newQuestions);
            generatedTestRepository.save(test);
            
            log.info("Successfully updated {} questions for test ID: {}", newQuestions.size(), id);
            return ResponseEntity.ok(Map.of("success", true, "questionsCount", newQuestions.size()));
            
        } catch (Exception e) {
            log.error("Error updating test questions", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/generate-link")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> generateTestLink(@PathVariable Long id) {
        try {
            log.info("Generating test link - ID: {}", id);
            
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));
            
            // Mettre à jour le statut du test à READY
            if (test.getStatus() == TestStatus.DRAFT) {
                test.setStatus(TestStatus.READY);
                generatedTestRepository.save(test);
                log.info("Test {} status updated to READY", id);
            }
            
            String testLink = "http://localhost:5173/candidate/test/" + test.getToken();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("testLink", testLink);
            response.put("token", test.getToken());
            response.put("testId", test.getId());
            response.put("candidateName", test.getCandidature().getCandidate().getFirstName() + " " + 
                            test.getCandidature().getCandidate().getLastName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error generating test link", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/public/{token}")
    public ResponseEntity<Map<String, Object>> getPublicTest(@PathVariable String token) {
        try {
            log.info("Getting public test - Token: {}", token);
            
            GeneratedTest test = generatedTestRepository.findByToken(token)
                    .orElseThrow(() -> new RuntimeException("Test not found or invalid token"));
            
            // Vérifier si le test est prêt
            if (test.getStatus() != TestStatus.READY && test.getStatus() != TestStatus.DRAFT) {
                return ResponseEntity.status(403).body(Map.of("error", "Test is not ready yet"));
            }
            
            // Vérifier si le test n'est pas expiré
            if (test.getDeadline().isBefore(java.time.LocalDateTime.now())) {
                return ResponseEntity.status(410).body(Map.of("error", "Test has expired"));
            }
            
            // Mettre à jour le statut de la candidature à IN_PROGRESS si c'est la première fois
            if (test.getCandidature().getStatus() == CandidatureStatus.TEST_SENT) {
                test.getCandidature().setStatus(CandidatureStatus.IN_PROGRESS);
                candidatureRepository.save(test.getCandidature());
                log.info("Candidature {} status updated to IN_PROGRESS (test accessed)", 
                    test.getCandidature().getId());
            }
            
            // NE PAS créer la session ici - elle sera créée quand le candidat cliquera sur "Commencer"
            log.info("Test page accessed for test ID: {} (session not created yet)", test.getId());
            
            Map<String, Object> publicData = new HashMap<>();
            publicData.put("testId", test.getId());
            publicData.put("token", test.getToken());
            publicData.put("positionTitle", test.getInternshipPosition().getTitle());
            publicData.put("duration", test.getTimeLimitMinutes());
            publicData.put("deadline", test.getDeadline().toString());
            
            // Convertir les questions en format public
            List<Map<String, Object>> questions = test.getQuestions().stream()
                    .map(q -> {
                        Map<String, Object> questionMap = new HashMap<>();
                        questionMap.put("id", q.getId());
                        questionMap.put("questionText", q.getQuestionText());
                        questionMap.put("questionType", q.getQuestionType().toString());
                        questionMap.put("options", q.getOptions() != null ? 
                                objectMapper.convertValue(q.getOptions(), List.class) : new ArrayList<>());
                        // Ne pas inclure la réponse correcte pour le candidat
                        questionMap.put("skillTag", q.getSkillTag());
                        questionMap.put("maxScore", q.getMaxScore());
                        questionMap.put("orderIndex", q.getOrderIndex());
                        return questionMap;
                    })
                    .collect(Collectors.toList());
            
            publicData.put("questions", questions);
            
            log.info("Returning public test data with {} questions for token: {}", questions.size(), token);
            return ResponseEntity.ok(publicData);
            
        } catch (Exception e) {
            log.error("Error getting public test", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/public/{token}/start")
    public ResponseEntity<Map<String, Object>> startTest(@PathVariable String token) {
        try {
            log.info("Starting test - Token: {}", token);
            
            GeneratedTest test = generatedTestRepository.findByToken(token)
                    .orElseThrow(() -> new RuntimeException("Test not found or invalid token"));
            
            // Vérifier si le test est prêt
            if (test.getStatus() != TestStatus.READY && test.getStatus() != TestStatus.DRAFT) {
                return ResponseEntity.status(403).body(Map.of("error", "Test is not ready yet"));
            }
            
            // Vérifier si le test n'est pas expiré
            if (test.getDeadline().isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(410).body(Map.of("error", "Test has expired"));
            }
            
            // Vérifier si une session existe déjà
            Optional<TestSession> existingSession = testSessionRepository.findByTest_Id(test.getId());
            if (existingSession.isPresent()) {
                return ResponseEntity.status(409).body(Map.of(
                    "error", "Test already started",
                    "sessionId", existingSession.get().getId()
                ));
            }
            
            // Créer la session de test
            TestSession testSession = TestSession.builder()
                .test(test)
                .startedAt(LocalDateTime.now())
                .build();
            testSessionRepository.save(testSession);
            
            // Mettre à jour le statut de la candidature à IN_PROGRESS
            if (test.getCandidature().getStatus() == CandidatureStatus.TEST_SENT) {
                test.getCandidature().setStatus(CandidatureStatus.IN_PROGRESS);
                candidatureRepository.save(test.getCandidature());
                log.info("Candidature {} status updated to IN_PROGRESS (test started)", 
                    test.getCandidature().getId());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("sessionId", testSession.getId());
            response.put("testId", test.getId());
            response.put("startedAt", testSession.getStartedAt().toString());
            
            log.info("Test session {} created for test ID: {}", testSession.getId(), test.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error starting test", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitTest(@PathVariable Long id, @RequestBody Map<String, Object> submissionData) {
        try {
            log.info("Submitting test - ID: {}", id);
            
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));
            
            // Vérifier si le test est prêt
            if (test.getStatus() != TestStatus.READY) {
                return ResponseEntity.status(403).body(Map.of("error", "Test is not ready for submission"));
            }
            
            // Vérifier si le test n'est pas déjà soumis
            if (test.getStatus() == TestStatus.SUBMITTED || test.getStatus() == TestStatus.IN_PROGRESS) {
                return ResponseEntity.status(403).body(Map.of("error", "Test has already been submitted"));
            }
            
            // Extraire les réponses
            @SuppressWarnings("unchecked")
            Map<Long, String> answers = (Map<Long, String>) submissionData.get("answers");
            Integer timeSpent = (Integer) submissionData.getOrDefault("timeSpent", 0);
            
            log.info("Received {} answers for test ID: {}", answers.size(), id);
            
            // Calculer le score
            double totalScore = 0;
            double maxPossibleScore = 0;
            int correctAnswers = 0;
            
            for (TestQuestion question : test.getQuestions()) {
                String userAnswer = answers.get(question.getId());
                String correctAnswer = question.getCorrectAnswer();
                
                maxPossibleScore += question.getMaxScore();
                
                if (userAnswer != null && userAnswer.equals(correctAnswer)) {
                    totalScore += question.getMaxScore();
                    correctAnswers++;
                }
                
                log.debug("Question {} - User: {}, Correct: {}, Points: {}", 
                    question.getId(), userAnswer, correctAnswer, 
                    userAnswer != null && userAnswer.equals(correctAnswer) ? question.getMaxScore() : 0);
            }
            
            double scorePercentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
            
            // Mettre à jour le statut du test
            test.setStatus(TestStatus.SUBMITTED);
            generatedTestRepository.save(test);
            
            // Récupérer la candidature associée
            Candidature candidature = test.getCandidature();
            
            // Mettre à jour le statut de la candidature en fonction du score
            if (scorePercentage >= 60) { // Seuil de réussite
                candidature.setStatus(CandidatureStatus.COMPLETED);
                log.info("Candidature {} status updated to COMPLETED (test passed with {}%)", 
                    candidature.getId(), Math.round(scorePercentage));
            } else {
                candidature.setStatus(CandidatureStatus.COMPLETED); // Ou REJECTED selon les critères
                log.info("Candidature {} status updated to COMPLETED (test failed with {}%)", 
                    candidature.getId(), Math.round(scorePercentage));
            }
            candidatureRepository.save(candidature);
            
            // Créer une réponse simple pour le moment
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("testId", test.getId());
            result.put("totalScore", totalScore);
            result.put("maxPossibleScore", maxPossibleScore);
            result.put("scorePercentage", Math.round(scorePercentage));
            result.put("correctAnswers", correctAnswers);
            result.put("totalQuestions", test.getQuestions().size());
            result.put("timeSpent", timeSpent);
            result.put("message", "Test submitted successfully");
            
            log.info("Test {} submitted successfully - Score: {}/{} ({}%)", 
                id, totalScore, maxPossibleScore, Math.round(scorePercentage));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error submitting test", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}