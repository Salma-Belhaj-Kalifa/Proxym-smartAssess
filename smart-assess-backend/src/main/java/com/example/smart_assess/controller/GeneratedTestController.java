package com.example.smart_assess.controller;

import com.example.smart_assess.entity.*;
import com.example.smart_assess.enums.*;
import com.example.smart_assess.repository.*;
import com.example.smart_assess.service.TechnicalProfileService;
import com.example.smart_assess.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.UUID;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.springframework.http.MediaType;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
@Slf4j
public class GeneratedTestController {

    private final GeneratedTestRepository generatedTestRepository;
    private final CandidatureRepository candidatureRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final AnswerRepository answerRepository;
    private final TechnicalProfileService technicalProfileService;
    private final EmailService emailService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    // =========================
    // GET ALL TESTS
    // =========================
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllTests() {
        try {
            List<GeneratedTest> tests = generatedTestRepository.findAll();
            List<Map<String, Object>> testList = tests.stream()
                    .map(test -> {
                        Map<String, Object> testMap = new HashMap<>();
                        testMap.put("id", test.getId());
                        testMap.put("token", test.getToken());
                        testMap.put("status", test.getStatus().toString());
                        testMap.put("timeLimitMinutes", test.getTimeLimitMinutes());
                        testMap.put("createdAt", test.getCreatedAt());
                        testMap.put("deadline", test.getDeadline());
                        testMap.put("submittedAt", test.getSubmittedAt());
                        testMap.put("timeSpentMinutes", test.getTimeSpentMinutes());
                        testMap.put("startedAt", test.getStartedAt());
                        
                        // Informations du candidat
                        if (test.getCandidature() != null) {
                            Map<String, Object> candidateMap = new HashMap<>();
                            candidateMap.put("id", test.getCandidature().getCandidate().getId());
                            candidateMap.put("firstName", test.getCandidature().getCandidate().getFirstName());
                            candidateMap.put("lastName", test.getCandidature().getCandidate().getLastName());
                            candidateMap.put("email", test.getCandidature().getCandidate().getEmail());
                            testMap.put("candidate", candidateMap);
                        }
                        
                        // Informations du poste
                        if (test.getInternshipPosition() != null) {
                            Map<String, Object> positionMap = new HashMap<>();
                            positionMap.put("id", test.getInternshipPosition().getId());
                            positionMap.put("title", test.getInternshipPosition().getTitle());
                            positionMap.put("company", test.getInternshipPosition().getCompany());
                            testMap.put("internshipPosition", positionMap);
                        }
                        
                        return testMap;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "tests", testList
            ));
        } catch (Exception e) {
            log.error("Error getting all tests", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Error retrieving tests: " + e.getMessage()
            ));
        }
    }

    // =========================
    // GENERATE TEST
    // =========================
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateTest(@RequestBody Map<String, Object> request) {
        try {
            log.info("=== GENERATE TEST CALLED ===");
            log.info("Test data: {}", request);
            
            Integer candidatureId = (Integer) request.get("candidatureId");
            String level = (String) request.get("level");
            Integer questionCount = (Integer) request.get("questionCount");
            Integer duration = (Integer) request.get("duration");
            String deadline = (String) request.get("deadline");
            String note = (String) request.get("note");
            
            log.info("Extracted parameters - candidatureId: {}, level: {}, questionCount: {}, duration: {}, deadline: {}", 
                candidatureId, level, questionCount, duration, deadline);
            
            // Vérifier si un test existe déjà pour cette candidature
            Optional<GeneratedTest> existingTestOpt = generatedTestRepository.findByCandidature_Id(candidatureId.longValue());
            if (existingTestOpt.isPresent()) {
                GeneratedTest existingTest = existingTestOpt.get();
                log.info("Test already exists for candidature {}: testId={}, status={}", 
                    candidatureId, existingTest.getId(), existingTest.getStatus());
                
                // Si le test est en DRAFT, retourner les informations du test existant
                if (existingTest.getStatus() == TestStatus.DRAFT) {
                    List<TestQuestion> questions = testQuestionRepository.findByTestId(existingTest.getId());
                    
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "testId", existingTest.getId(),
                        "token", existingTest.getToken(),
                        "status", existingTest.getStatus().toString(),
                        "message", "Test already exists in DRAFT status",
                        "questions", questions.stream().map(q -> {
                            Map<String, Object> questionMap = new HashMap<>();
                            questionMap.put("id", q.getId());
                            questionMap.put("questionText", q.getQuestionText());
                            questionMap.put("questionType", q.getQuestionType());
                            questionMap.put("options", q.getOptions());
                            questionMap.put("correctAnswer", q.getCorrectAnswer());
                            questionMap.put("skillTag", q.getSkillTag());
                            questionMap.put("maxScore", q.getMaxScore());
                            return questionMap;
                        }).collect(Collectors.toList())
                    ));
                } else {
                    // Si le test n'est plus en DRAFT, retourner une erreur
                    return ResponseEntity.status(400).body(Map.of(
                        "success", false,
                        "error", "Test already exists for this candidature with status: " + existingTest.getStatus()
                    ));
                }
            }
            
            // Récupérer la candidature
            Candidature candidature = candidatureRepository.findById(candidatureId.longValue())
                    .orElseThrow(() -> new RuntimeException("Candidature not found"));
            
            // Créer le test généré
            GeneratedTest test = GeneratedTest.builder()
                    .candidature(candidature)
                    .internshipPosition(candidature.getInternshipPosition())
                    .status(TestStatus.DRAFT)
                    .timeLimitMinutes(40) // 24 heures par défaut
                    .token(UUID.randomUUID().toString())
                    .deadline(LocalDateTime.now().plusDays(7))
                    .build();
            
            generatedTestRepository.save(test);
            
            // Générer les questions basées sur le profil technique
            List<TestQuestion> questions = generateQuestionsForTest(test, level, questionCount);
            testQuestionRepository.saveAll(questions);
            log.info("Saved {} questions to database for test {}", questions.size(), test.getId());
            
            // Log des questions sauvegardées avec leurs réponses correctes
            for (TestQuestion q : questions) {
                log.info("Saved question - ID: {}, Text: '{}', Correct: '{}', Options: {}", 
                    q.getId(), q.getQuestionText(), q.getCorrectAnswer(), q.getOptions());
            }
            
            log.info("Generated {} questions for test {}", questions.size(), test.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "testId", test.getId(),
                "token", test.getToken(),
                "status", test.getStatus().toString(),
                "questions", questions.stream().map(q -> {
                    Map<String, Object> questionMap = new HashMap<>();
                    questionMap.put("id", q.getId());
                    questionMap.put("questionText", q.getQuestionText());
                    questionMap.put("questionType", q.getQuestionType());
                    questionMap.put("options", q.getOptions());
                    questionMap.put("correctAnswer", q.getCorrectAnswer());
                    questionMap.put("maxScore", q.getMaxScore());
                    questionMap.put("skillTag", q.getSkillTag());
                    return questionMap;
                }).collect(Collectors.toList()),
                "message", "Test generated successfully with " + questions.size() + " questions"
            ));
            
        } catch (Exception e) {
            log.error("Error generating test", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Error generating test: " + e.getMessage()
            ));
        }
    }

    // =========================
    // CHECK EXISTING TEST
    // =========================
    @GetMapping("/check-existing/{candidatureId}")
    public ResponseEntity<Map<String, Object>> checkExistingTest(@PathVariable Long candidatureId) {
        try {
            log.info("Checking existing test for candidature: {}", candidatureId);
            
            Optional<Candidature> candidatureOpt = candidatureRepository.findById(candidatureId);
            if (candidatureOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "exists", false,
                    "message", "Candidature not found"
                ));
            }
            
            Candidature candidature = candidatureOpt.get();
            GeneratedTest existingTest = candidature.getGeneratedTest();
            
            if (existingTest != null) {
                return ResponseEntity.ok(Map.of(
                    "exists", true,
                    "testId", existingTest.getId(),
                    "status", existingTest.getStatus(),
                    "message", "Test already exists for this candidature"
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "exists", false,
                    "message", "No test found for this candidature"
                ));
            }
            
        } catch (Exception e) {
            log.error("Error checking existing test: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "exists", false,
                "message", "Error checking test: " + e.getMessage()
            ));
        }
    }

    // =========================
    // GET QUESTIONS FOR TEST
    // =========================
    @GetMapping("/{testId}/questions")
    public ResponseEntity<Map<String, Object>> getTestQuestions(@PathVariable Long testId) {
        try {
            log.info("Getting questions for test ID: {}", testId);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found with id: " + testId
                ));
            }

            GeneratedTest test = testOpt.get();
            List<TestQuestion> questions = testQuestionRepository.findByTestId(test.getId());
            
            List<Map<String, Object>> questionsData = questions.stream()
                    .map(question -> {
                        Map<String, Object> questionMap = new HashMap<>();
                        questionMap.put("id", question.getId());
                        questionMap.put("questionText", question.getQuestionText());
                        questionMap.put("questionType", question.getQuestionType());
                        questionMap.put("options", question.getOptions());
                        questionMap.put("correctAnswer", question.getCorrectAnswer());
                        questionMap.put("skillTag", question.getSkillTag());
                        questionMap.put("maxScore", question.getMaxScore());
                        questionMap.put("orderIndex", question.getOrderIndex());
                        return questionMap;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "questions", questionsData
            ));
            
        } catch (Exception e) {
            log.error("Error getting test questions: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Error getting test questions: " + e.getMessage()
            ));
        }
    }

    // =========================
    // SAVE QUESTIONS FOR TEST
    // =========================
    @PutMapping("/{testId}/questions")
    public ResponseEntity<Map<String, Object>> saveTestQuestions(@PathVariable Long testId, @RequestBody Map<String, Object> request) {
        try {
            log.info("Saving questions for test ID: {}", testId);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findById(testId);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found with id: " + testId
                ));
            }

            GeneratedTest test = testOpt.get();
            
            // Supprimer les questions existantes
            List<TestQuestion> existingQuestions = testQuestionRepository.findByTestId(test.getId());
            testQuestionRepository.deleteAll(existingQuestions);
            
            // Sauvegarder les nouvelles questions
            List<Map<String, Object>> questionsData = (List<Map<String, Object>>) request.get("questions");
            List<TestQuestion> newQuestions = new ArrayList<>();
            
            for (int i = 0; i < questionsData.size(); i++) {
                Map<String, Object> questionData = questionsData.get(i);
                
                // Convertir les options en ArrayNode
                List<String> optionsList = (List<String>) questionData.get("options");
                ArrayNode optionsNode = JsonNodeFactory.instance.arrayNode();
                if (optionsList != null) {
                    for (String option : optionsList) {
                        optionsNode.add(option);
                    }
                }
                
                TestQuestion question = TestQuestion.builder()
                        .test(test)
                        .questionText((String) questionData.get("questionText"))
                        .questionType(QuestionType.MCQ)
                        .options(optionsNode)
                        .correctAnswer((String) questionData.get("correctAnswer"))
                        .maxScore(((Number) questionData.get("maxScore")).doubleValue())
                        .skillTag((String) questionData.get("skillTag"))
                        .orderIndex(i)
                        .build();
                
                newQuestions.add(question);
            }
            
            testQuestionRepository.saveAll(newQuestions);
            log.info("Saved {} questions for test {}", newQuestions.size(), test.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Questions saved successfully",
                "questions", newQuestions.size()
            ));
            
        } catch (Exception e) {
            log.error("Error saving test questions: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Error saving test questions: " + e.getMessage()
            ));
        }
    }

    // =========================
    // GET TEST FOR REVIEW
    // =========================
    @GetMapping("/{id}/review")
    public ResponseEntity<Map<String, Object>> getTestForReview(@PathVariable Long id) {
        try {
            log.info("Getting test for review: {}", id);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findById(id);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found with id: " + id
                ));
            }

            GeneratedTest test = testOpt.get();
            
            // Récupérer les questions avec les réponses du candidat
            List<TestQuestion> questions = testQuestionRepository.findByTestId(test.getId());
            
            log.info("Retrieved {} questions from database for test {}", questions.size(), test.getId());
            for (TestQuestion q : questions) {
                log.info("Question from DB - ID: {}, Text: '{}', Type: {}, Options: {}", 
                    q.getId(), q.getQuestionText(), q.getQuestionType(), q.getOptions());
            }
            
            // Enrichir les questions avec les réponses et scores
            List<Map<String, Object>> enrichedQuestions = questions.stream()
                    .map(question -> {
                        Map<String, Object> questionMap = new HashMap<>();
                        questionMap.put("id", question.getId());
                        questionMap.put("questionText", question.getQuestionText());
                        questionMap.put("questionType", question.getQuestionType());
                        questionMap.put("options", question.getOptions());
                        questionMap.put("correctAnswer", question.getCorrectAnswer());
                        questionMap.put("skillTag", question.getSkillTag());
                        questionMap.put("maxScore", question.getMaxScore());
                        
                        // Récupérer la réponse du candidat
                        Optional<Answer> answerOpt = test.getAnswers().stream()
                                .filter(answer -> answer.getQuestion().getId().equals(question.getId()))
                                .findFirst();
                        
                        if (answerOpt.isPresent()) {
                            Answer answer = answerOpt.get();
                            questionMap.put("candidateAnswer", answer.getAnswerText());
                            questionMap.put("selectedOption", answer.getSelectedOption());
                            questionMap.put("isCorrect", answer.getIsCorrect());
                            questionMap.put("scoreObtained", answer.getScoreObtained());
                        } else {
                            questionMap.put("candidateAnswer", null);
                            questionMap.put("selectedOption", null);
                            questionMap.put("isCorrect", false);
                            questionMap.put("scoreObtained", 0.0);
                        }
                        
                        return questionMap;
                    })
                    .collect(Collectors.toList());
            
            // Construire la réponse avec les informations de session
            Map<String, Object> sessionData = new HashMap<>();
            sessionData.put("startedAt", test.getStartedAt() != null ? test.getStartedAt().toString() : null);
            sessionData.put("submittedAt", test.getSubmittedAt() != null ? test.getSubmittedAt().toString() : null);
            sessionData.put("timeSpentMinutes", test.getTimeSpentMinutes());
            sessionData.put("tabSwitchCount", test.getTabSwitchCount());
            sessionData.put("isAutoSubmitted", test.isAutoSubmitted());
            
            // Calculer les scores
            Map<String, Object> scores = new HashMap<>();
            if (test.getEvaluationResult() != null) {
                scores.put("totalScore", test.getEvaluationResult().getTotalScore());
                scores.put("maxScore", test.getEvaluationResult().getMaxScore());
                scores.put("finalScore", test.getEvaluationResult().getFinalScore());
                scores.put("totalQuestions", test.getEvaluationResult().getTotalQuestions());
                scores.put("correctAnswers", test.getEvaluationResult().getCorrectAnswers());
                scores.put("skillScores", test.getEvaluationResult().getSkillScores());
            }
            
            // Réponse finale
            Map<String, Object> response = new HashMap<>();
            response.put("id", test.getId());
            response.put("token", test.getToken());
            response.put("status", test.getStatus().toString());
            response.put("timeLimitMinutes", test.getTimeLimitMinutes());
            response.put("createdAt", test.getCreatedAt());
            response.put("deadline", test.getDeadline());
            response.put("session", sessionData);
            response.put("scores", scores);
            response.put("questions", enrichedQuestions);
            
            // Informations du candidat
            if (test.getCandidature() != null) {
                Map<String, Object> candidate = new HashMap<>();
                candidate.put("id", test.getCandidature().getCandidate().getId());
                candidate.put("firstName", test.getCandidature().getCandidate().getFirstName());
                candidate.put("lastName", test.getCandidature().getCandidate().getLastName());
                candidate.put("email", test.getCandidature().getCandidate().getEmail());
                response.put("candidate", candidate);
            }
            
            // Informations du poste
            if (test.getInternshipPosition() != null) {
                Map<String, Object> position = new HashMap<>();
                position.put("id", test.getInternshipPosition().getId());
                position.put("title", test.getInternshipPosition().getTitle());
                position.put("company", test.getInternshipPosition().getCompany());
                response.put("internshipPosition", position);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting test for review: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // =========================
    // START TEST
    // =========================
    @PostMapping("/{id}/start")
    public ResponseEntity<Map<String, Object>> startTest(@PathVariable Long id) {
        try {
            log.info("Starting test: {}", id);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findById(id);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found"
                ));
            }

            GeneratedTest test = testOpt.get();
            
            // Vérifier si le test n'est pas déjà démarré
            if (test.getStartedAt() != null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Test already started"
                ));
            }

            // Démarrer le test
            test.setStartedAt(LocalDateTime.now());
            test.setStatus(TestStatus.IN_PROGRESS);
            generatedTestRepository.save(test);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test started successfully",
                "startedAt", test.getStartedAt()
            ));
            
        } catch (Exception e) {
            log.error("Error starting test: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // =========================
    // SUBMIT TEST
    // =========================
    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submitTest(
            @PathVariable Long id,
            @RequestBody Map<String, Object> submissionData) {
        
        try {
            log.info("=== SUBMIT TEST CALLED ===");
            log.info("Test ID: {}", id);
            log.info("Submission data: {}", submissionData);
            
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));
            
            String token = (String) submissionData.get("token");
            if (token == null || !token.equals(test.getToken())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid token"
                ));
            }

            // Mettre à jour les informations de session
            Integer timeSpent = (Integer) submissionData.get("timeSpent");
            test.setSubmittedAt(LocalDateTime.now());
            test.setTimeSpentMinutes(timeSpent != null ? (int)(timeSpent.longValue() / 60) : 0);
            test.setStatus(TestStatus.SUBMITTED);
            
            generatedTestRepository.save(test);
            
            // ✅ SAUVEGARDER LES RÉPONSES DANS LA TABLE ANSWERS
            log.info("Saving answers for test {}", test.getId());
            
            @SuppressWarnings("unchecked")
            Map<String, Object> answers = (Map<String, Object>) submissionData.get("answers");
            
            if (answers != null) {
                for (Map.Entry<String, Object> entry : answers.entrySet()) {
                    try {
                        Integer questionId = Integer.parseInt(entry.getKey());
                        String answerText = (String) entry.getValue();
                        
                        // Récupérer la question
                        TestQuestion question = testQuestionRepository.findById(questionId.longValue())
                                .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));
                    
                    // Calculer si la réponse est correcte et le score
                    Boolean isCorrect = calculateAnswerCorrectness(question, answerText);
                    Double scoreObtained = isCorrect ? question.getMaxScore() : 0.0;
                    
                    // Créer l'objet Answer
                    Answer answer = Answer.builder()
                            .test(test)
                            .question(question)
                            .answerText(answerText)
                            .selectedOption(answerText)
                            .isCorrect(isCorrect)
                            .scoreObtained(scoreObtained)
                            .maxScore(question.getMaxScore())
                            .build();
                    
                    answerRepository.save(answer);
                    log.info("Saved answer for question {}: {} -> {}", questionId, answerText, isCorrect);
                    
                } catch (NumberFormatException e) {
                    log.warn("Invalid question ID in answers: {}", entry.getKey());
                } catch (Exception e) {
                    log.error("Error saving answer for question {}: {}", entry.getKey(), e.getMessage());
                }
                }
            }
            
            // Calculer et sauvegarder les résultats d'évaluation
            EvaluationResult evaluationResult = calculateTestResults(test);
            if (evaluationResult != null) {
                test.setEvaluationResult(evaluationResult);
            }
            
            // Mettre à jour le statut du test à SUBMITTED
            test.setStatus(TestStatus.SUBMITTED);
            test.setSubmittedAt(LocalDateTime.now());
            generatedTestRepository.save(test);
            
            // Mettre à jour le statut de la candidature pour cohérence
            if (test.getCandidature() != null) {
                test.getCandidature().setStatus(CandidatureStatus.COMPLETED);
                candidatureRepository.save(test.getCandidature());
                log.info("Updated candidature status to COMPLETED for test submission");
            }
            
            // Envoyer l'email de notification
            try {
                String candidateEmail = test.getCandidature().getCandidate().getEmail();
                String candidateName = test.getCandidature().getCandidate().getFirstName() + " " + test.getCandidature().getCandidate().getLastName();
                String positionTitle = test.getInternshipPosition().getTitle();
                String testUrl = frontendUrl + "/test-results/" + test.getToken();
                
                emailService.sendTestCompletedNotification(candidateEmail, candidateName, positionTitle, testUrl);
                log.info("Email notification sent to: {}", candidateEmail);
                
            } catch (Exception emailError) {
                log.error("Failed to send email notification: {}", emailError.getMessage());
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test submitted successfully",
                "sessionId", test.getId()
            ));
            
        } catch (Exception e) {
            log.error("Error submitting test: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // =========================
    // MÉTHODES UTILITAIRES
    // =========================
    
    private Boolean calculateAnswerCorrectness(TestQuestion question, String answer) {
        if (answer == null || answer.trim().isEmpty()) {
            return false;
        }
        
        String correctAnswer = question.getCorrectAnswer();
        if (correctAnswer == null) {
            return false;
        }
        
        return answer.trim().equalsIgnoreCase(correctAnswer.trim());
    }
    
    private EvaluationResult calculateTestResults(GeneratedTest test) {
        try {
            List<Answer> answers = test.getAnswers();
            if (answers.isEmpty()) {
                return null;
            }
            
            // Calculer les scores de base
            int totalQuestions = answers.size();
            long correctAnswers = answers.stream()
                    .filter(answer -> answer.getIsCorrect() != null && answer.getIsCorrect())
                    .count();
            
            double totalScore = answers.stream()
                    .mapToDouble(answer -> answer.getScoreObtained() != null ? answer.getScoreObtained() : 0.0)
                    .sum();
            
            double maxScore = answers.stream()
                    .mapToDouble(answer -> answer.getMaxScore() != null ? answer.getMaxScore() : 1.0)
                    .sum();
            
            double finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
            
            // Calculer les scores par compétence
            Map<String, EvaluationResult.SkillScore> skillScores = new HashMap<>();
            
            // Regrouper par skillTag
            Map<String, List<Answer>> answersBySkill = answers.stream()
                    .filter(answer -> answer.getQuestion() != null && answer.getQuestion().getSkillTag() != null)
                    .collect(Collectors.groupingBy(answer -> answer.getQuestion().getSkillTag()));
            
            for (Map.Entry<String, List<Answer>> entry : answersBySkill.entrySet()) {
                String skill = entry.getKey();
                List<Answer> skillAnswers = entry.getValue();
                
                int skillCorrect = skillAnswers.stream()
                        .filter(answer -> answer.getIsCorrect() != null && answer.getIsCorrect())
                        .mapToInt(answer -> 1)
                        .sum();
                
                int skillTotal = skillAnswers.size();
                
                skillScores.put(skill, EvaluationResult.SkillScore.builder()
                        .correct(skillCorrect)
                        .total(skillTotal)
                        .build());
            }
            
            return EvaluationResult.builder()
                    .test(test)
                    .totalScore((int) totalScore)
                    .maxScore((int) maxScore)
                    .finalScore(finalScore)
                    .totalQuestions(totalQuestions)
                    .correctAnswers((int) correctAnswers)
                    .skillScores(skillScores)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error calculating test results: {}", e.getMessage(), e);
            return null;
        }
    }
    
    // =========================
    // GENERATE QUESTIONS HELPER
    // =========================
    private List<TestQuestion> generateQuestionsForTest(GeneratedTest test, String level, Integer questionCount) {
        try {
            // Récupérer le profil réel du candidat
            Map<String, Object> candidateProfile = getCandidateProfileFromCandidature(test.getCandidature());
            
            // Appeler l'API FastAPI
            return callFastAPIForQuestions(candidateProfile, test, questionCount);
            
        } catch (Exception e) {
            log.error("Error generating questions via AI: {}", e.getMessage(), e);
            // Retourner une liste vide en cas d'erreur
            return new ArrayList<>();
        }
    }
    
    private Map<String, Object> getCandidateProfileFromCandidature(Candidature candidature) {
        Map<String, Object> candidateProfile = new HashMap<>();
        
        try {
            // Informations de base du candidat
            Map<String, String> basicInfo = new HashMap<>();
            if (candidature.getCandidate() != null) {
                basicInfo.put("name", 
                    (candidature.getCandidate().getFirstName() != null ? candidature.getCandidate().getFirstName() : "") + 
                    " " + 
                    (candidature.getCandidate().getLastName() != null ? candidature.getCandidate().getLastName() : ""));
                basicInfo.put("email", candidature.getCandidate().getEmail() != null ? candidature.getCandidate().getEmail() : "");
                basicInfo.put("phone", candidature.getCandidate().getPhone() != null ? candidature.getCandidate().getPhone() : "");
                basicInfo.put("address", "");
            }
            candidateProfile.put("basic_information", basicInfo);
            
            // Récupérer le profil technique réel depuis le CV du candidat
            Map<String, Object> realTechnicalProfile = getRealTechnicalProfile(candidature.getCandidate().getId());
            
            // Utiliser UNIQUEMENT le profil technique réel
            Map<String, String> summary = new HashMap<>();
            Map<String, Object> technicalInfo = new HashMap<>();
            
            if (realTechnicalProfile != null && !realTechnicalProfile.isEmpty()) {
                // Utiliser le profil technique réel
                log.info("Using real technical profile from CV parsing");
                
                // Extraire les informations du profil réel
                Map<String, Object> parsedData = (Map<String, Object>) realTechnicalProfile.get("parsed_data");
                if (parsedData != null) {
                    // Résumé depuis le CV
                    String careerSummary = (String) parsedData.get("career_summary");
                    String professionalExperience = (String) parsedData.get("professional_experience");
                    summary.put("career_summary", careerSummary != null ? careerSummary : "");
                    summary.put("professional_experience", professionalExperience != null ? professionalExperience : "");
                    
                    // Informations techniques depuis le CV
                    Map<String, Object> technicalFromCV = (Map<String, Object>) parsedData.get("technical_information");
                    if (technicalFromCV != null) {
                        List<String> programmingLanguages = (List<String>) technicalFromCV.get("programming_languages");
                        List<String> webFrameworks = (List<String>) technicalFromCV.get("web_frameworks");
                        List<String> databases = (List<String>) technicalFromCV.get("databases");
                        List<String> tools = (List<String>) technicalFromCV.get("tools");
                        
                        // N'utiliser que les données réelles, pas de valeurs par défaut
                        technicalInfo.put("programming_languages", programmingLanguages != null ? programmingLanguages : new ArrayList<>());
                        technicalInfo.put("web_frameworks", webFrameworks != null ? webFrameworks : new ArrayList<>());
                        technicalInfo.put("databases", databases != null ? databases : new ArrayList<>());
                        technicalInfo.put("tools", tools != null ? tools : new ArrayList<>());
                    } else {
                        // Aucune information technique trouvée
                        technicalInfo.put("programming_languages", new ArrayList<>());
                        technicalInfo.put("web_frameworks", new ArrayList<>());
                        technicalInfo.put("databases", new ArrayList<>());
                        technicalInfo.put("tools", new ArrayList<>());
                    }
                    
                    // Soft skills depuis le CV
                    Map<String, List<String>> softSkillsFromCV = (Map<String, List<String>>) parsedData.get("soft_skills");
                    if (softSkillsFromCV != null) {
                        candidateProfile.put("soft_skills", softSkillsFromCV);
                    } else {
                        // Aucun soft skill trouvé
                        candidateProfile.put("soft_skills", new HashMap<>());
                    }
                    
                    // Projets depuis le CV
                    List<Map<String, Object>> projectsFromCV = (List<Map<String, Object>>) parsedData.get("projects_list");
                    if (projectsFromCV != null) {
                        candidateProfile.put("projects_list", projectsFromCV);
                    } else {
                        // Aucun projet trouvé
                        candidateProfile.put("projects_list", new ArrayList<>());
                    }
                } else {
                    // Aucune donnée parsée trouvée
                    log.warn("No parsed data found in technical profile");
                    summary.put("career_summary", "");
                    summary.put("professional_experience", "");
                    technicalInfo.put("programming_languages", new ArrayList<>());
                    technicalInfo.put("web_frameworks", new ArrayList<>());
                    technicalInfo.put("databases", new ArrayList<>());
                    technicalInfo.put("tools", new ArrayList<>());
                    candidateProfile.put("soft_skills", new HashMap<>());
                    candidateProfile.put("projects_list", new ArrayList<>());
                }
            } else {
                // Aucun profil technique disponible - retourner un profil vide
                log.warn("No technical profile available for candidate");
                summary.put("career_summary", "");
                summary.put("professional_experience", "");
                technicalInfo.put("programming_languages", new ArrayList<>());
                technicalInfo.put("web_frameworks", new ArrayList<>());
                technicalInfo.put("databases", new ArrayList<>());
                technicalInfo.put("tools", new ArrayList<>());
                candidateProfile.put("soft_skills", new HashMap<>());
                candidateProfile.put("projects_list", new ArrayList<>());
            }
            
            candidateProfile.put("summary", summary);
            candidateProfile.put("technical_information", technicalInfo);
            
            // Logging pour débogage
            log.info("Generated candidate profile from CV parsing only:");
            log.info("- Name: {}", basicInfo.get("name"));
            log.info("- Using CV-based technical profile: {}", realTechnicalProfile != null && !realTechnicalProfile.isEmpty());
            log.info("- Programming languages: {}", technicalInfo.get("programming_languages"));
            log.info("- Frameworks: {}", technicalInfo.get("web_frameworks"));
            log.info("- Databases: {}", technicalInfo.get("databases"));
            log.info("- Tools: {}", technicalInfo.get("tools"));
            
        } catch (Exception e) {
            log.error("Error creating candidate profile: {}", e.getMessage(), e);
            // Retourner un profil vide en cas d'erreur
            Map<String, String> basicInfo = new HashMap<>();
            basicInfo.put("name", "Candidate");
            basicInfo.put("email", "");
            basicInfo.put("phone", "");
            basicInfo.put("address", "");
            candidateProfile.put("basic_information", basicInfo);
            candidateProfile.put("summary", new HashMap<>());
            candidateProfile.put("technical_information", new HashMap<>());
            candidateProfile.put("soft_skills", new HashMap<>());
            candidateProfile.put("projects_list", new ArrayList<>());
        }
        
        return candidateProfile;
    }
    
    private Map<String, Object> getRealTechnicalProfile(Long candidateId) {
        try {
            // Récupérer le profil technique depuis la base de données
            TechnicalProfile technicalProfile = technicalProfileService.getByCandidateId(candidateId);
            if (technicalProfile != null) {
                // Convertir le TechnicalProfile en Map
                Map<String, Object> profileMap = new HashMap<>();
                profileMap.put("id", technicalProfile.getId());
                profileMap.put("parsed_data", technicalProfile.getParsedData());
                return profileMap;
            }
            return null;
        } catch (Exception e) {
            log.warn("Could not retrieve technical profile for candidate {}: {}", candidateId, e.getMessage());
            return null;
        }
    }
    
    private List<TestQuestion> callFastAPIForQuestions(Map<String, Object> candidateProfile, GeneratedTest test, Integer questionCount) {
        try {
            // Préparer la requête pour l'API FastAPI
            Map<String, Object> request = new HashMap<>();
            request.put("candidate_profile", candidateProfile);
            request.put("number_of_questions", questionCount);
            
            // Appeler l'API FastAPI
            String apiUrl = "http://localhost:8000/api/v1/generate-from-profile";
            log.info("Calling FastAPI at: {} with {} questions", apiUrl, questionCount);
            log.info("Request payload: {}", request);
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, entity, Map.class);
                
                log.info("FastAPI response status: {}", response.getStatusCode());
                log.info("FastAPI response body: {}", response.getBody());
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> responseBody = response.getBody();
                    log.info("Raw FastAPI response: {}", responseBody);
                    
                    if (responseBody.containsKey("questions")) {
                        List<Map<String, Object>> apiQuestions = (List<Map<String, Object>>) responseBody.get("questions");
                        log.info("Successfully retrieved {} questions from FastAPI", apiQuestions.size());
                        
                        // Log first question structure
                        if (!apiQuestions.isEmpty()) {
                            log.info("First question structure: {}", apiQuestions.get(0));
                        }
                        
                        return convertAPIToTestQuestions(apiQuestions, test);
                    } else {
                        log.warn("FastAPI response doesn't contain 'questions' key");
                    }
                } else {
                    log.warn("FastAPI returned non-2xx status: {}", response.getStatusCode());
                }
            } catch (Exception e) {
                log.error("Failed to call FastAPI: {}", e.getMessage(), e);
            }
            
        } catch (Exception e) {
            log.error("Error in FastAPI integration: {}", e.getMessage(), e);
        }
        
        // Retourner une liste vide en cas d'échec de l'API
        log.warn("Returning empty list due to FastAPI failure");
        return new ArrayList<>();
    }
    
    private List<TestQuestion> convertAPIToTestQuestions(List<Map<String, Object>> apiQuestions, GeneratedTest test) {
        List<TestQuestion> questions = new ArrayList<>();
        
        for (Map<String, Object> apiQuestion : apiQuestions) {
            try {
                String technology = (String) apiQuestion.get("technology");
                String level = (String) apiQuestion.get("level");
                String questionText = (String) apiQuestion.get("question");
                List<String> options = (List<String>) apiQuestion.get("options");
                String correctAnswer = (String) apiQuestion.get("correct_answer");
                
                log.info("Processing API question - technology: {}, level: {}, question: '{}', options: {}, correct: '{}'", 
                    technology, level, questionText, options, correctAnswer);
                
                // Convertir les options en JsonNode
                ArrayNode optionsNode = JsonNodeFactory.instance.arrayNode();
                if (options != null) {
                    for (String option : options) {
                        optionsNode.add(option);
                    }
                }
                
                TestQuestion question = TestQuestion.builder()
                        .test(test)
                        .questionText(questionText)
                        .questionType(QuestionType.MCQ)
                        .options(optionsNode)
                        .correctAnswer(correctAnswer)
                        .maxScore(10.0)
                        .skillTag(technology != null ? technology : "General")
                        .build();
                
                questions.add(question);
                
            } catch (Exception e) {
                log.warn("Failed to convert API question: {}", e.getMessage(), e);
            }
        }
        
        return questions;
    }
    
    // =========================
    // GENERATE TEST LINK
    // =========================
    @PostMapping("/{id}/generate-link")
    public ResponseEntity<Map<String, Object>> generateTestLink(@PathVariable Long id) {
        try {
            log.info("=== GENERATE TEST LINK CALLED ===");
            log.info("Test ID: {}", id);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findById(id);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found with id: " + id
                ));
            }
            
            GeneratedTest test = testOpt.get();
            
            // Mettre à jour le statut du test à READY (ou autre statut approprié)
            test.setStatus(TestStatus.READY);
            generatedTestRepository.save(test);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test link generated successfully",
                "testId", test.getId(),
                "token", test.getToken(),
                "status", test.getStatus().toString()
            ));
            
        } catch (Exception e) {
            log.error("Error generating test link: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Error generating test link: " + e.getMessage()
            ));
        }
    }
    
    // =========================
    // GET TEST BY TOKEN (PUBLIC ACCESS)
    // =========================
    @GetMapping("/public/{token}")
    public ResponseEntity<Map<String, Object>> getTestByToken(@PathVariable String token) {
        try {
            log.info("=== GET TEST BY TOKEN CALLED ===");
            log.info("Token: {}", token);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findByToken(token);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found with token: " + token
                ));
            }
            
            GeneratedTest test = testOpt.get();
            
            // Vérifier si le test est prêt
            if (test.getStatus() != TestStatus.READY && test.getStatus() != TestStatus.IN_PROGRESS) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Test is not ready. Current status: " + test.getStatus()
                ));
            }
            
            // Récupérer les questions du test
            List<TestQuestion> questions = testQuestionRepository.findByTestId(test.getId());
            
            List<Map<String, Object>> questionsData = questions.stream()
                    .map(question -> {
                        Map<String, Object> questionMap = new HashMap<>();
                        questionMap.put("id", question.getId());
                        questionMap.put("questionText", question.getQuestionText());
                        questionMap.put("questionType", question.getQuestionType());
                        questionMap.put("options", question.getOptions());
                        questionMap.put("skillTag", question.getSkillTag());
                        questionMap.put("maxScore", question.getMaxScore());
                        questionMap.put("orderIndex", question.getOrderIndex());
                        // Ne pas inclure correctAnswer pour le candidat
                        return questionMap;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "test", Map.of(
                    "id", test.getId(),
                    "token", test.getToken(),
                    "status", test.getStatus().toString(),
                    "timeLimitMinutes", test.getTimeLimitMinutes(),
                    "deadline", test.getDeadline(),
                    "questions", questionsData
                )
            ));
            
        } catch (Exception e) {
            log.error("Error getting test by token: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Error getting test by token: " + e.getMessage()
            ));
        }
    }
    
    // =========================
    // START TEST BY TOKEN (PUBLIC ACCESS)
    // =========================
    @PostMapping("/public/{token}/start")
    public ResponseEntity<Map<String, Object>> startTestByToken(@PathVariable String token) {
        try {
            log.info("=== START TEST BY TOKEN CALLED ===");
            log.info("Token: {}", token);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findByToken(token);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found with token: " + token
                ));
            }
            
            GeneratedTest test = testOpt.get();
            
            // Vérifier si le test est prêt
            if (test.getStatus() != TestStatus.READY) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Test is not ready. Current status: " + test.getStatus()
                ));
            }
            
            // Démarrer le test
            test.setStartedAt(LocalDateTime.now());
            test.setStatus(TestStatus.IN_PROGRESS);
            generatedTestRepository.save(test);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test started successfully",
                "testId", test.getId(),
                "status", test.getStatus().toString()
            ));
            
        } catch (Exception e) {
            log.error("Error starting test by token: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Error starting test by token: " + e.getMessage()
            ));
        }
    }
    
    // =========================
    // GET TEST RESULTS BY TOKEN (PUBLIC ACCESS)
    // =========================
    @GetMapping("/public/{token}/results")
    public ResponseEntity<Map<String, Object>> getTestResultsByToken(@PathVariable String token) {
        try {
            log.info("=== GET TEST RESULTS BY TOKEN CALLED ===");
            log.info("Token: {}", token);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findByToken(token);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found with token: " + token
                ));
            }
            
            GeneratedTest test = testOpt.get();
            
            // Vérifier si le test est soumis
            if (test.getStatus() != TestStatus.SUBMITTED) {
                return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", "Test results not available. Current status: " + test.getStatus()
                ));
            }
            
            // Récupérer les questions avec les réponses du candidat
            List<TestQuestion> questions = testQuestionRepository.findByTestId(test.getId());
            
            List<Map<String, Object>> questionsData = questions.stream()
                    .map(question -> {
                        Map<String, Object> questionMap = new HashMap<>();
                        questionMap.put("id", question.getId());
                        questionMap.put("questionText", question.getQuestionText());
                        questionMap.put("questionType", question.getQuestionType());
                        questionMap.put("options", question.getOptions());
                        questionMap.put("correctAnswer", question.getCorrectAnswer());
                        questionMap.put("skillTag", question.getSkillTag());
                        questionMap.put("maxScore", question.getMaxScore());
                        questionMap.put("orderIndex", question.getOrderIndex());
                        
                        // Récupérer la réponse du candidat
                        Optional<Answer> answerOpt = test.getAnswers().stream()
                                .filter(answer -> answer.getQuestion().getId().equals(question.getId()))
                                .findFirst();
                        
                        if (answerOpt.isPresent()) {
                            Answer answer = answerOpt.get();
                            questionMap.put("candidateAnswer", answer.getAnswerText());
                            questionMap.put("selectedOption", answer.getSelectedOption());
                            questionMap.put("isCorrect", answer.getIsCorrect());
                            questionMap.put("scoreObtained", answer.getScoreObtained());
                        } else {
                            questionMap.put("candidateAnswer", null);
                            questionMap.put("selectedOption", null);
                            questionMap.put("isCorrect", false);
                            questionMap.put("scoreObtained", 0);
                        }
                        
                        return questionMap;
                    })
                    .collect(Collectors.toList());
            
            // Récupérer les scores d'évaluation
            Map<String, Object> scores = new HashMap<>();
            if (test.getEvaluationResult() != null) {
                EvaluationResult evalResult = test.getEvaluationResult();
                scores.put("totalScore", evalResult.getTotalScore());
                scores.put("maxScore", evalResult.getMaxScore());
                scores.put("finalScore", evalResult.getFinalScore());
                scores.put("correctAnswers", evalResult.getCorrectAnswers());
                scores.put("totalQuestions", evalResult.getTotalQuestions());
                scores.put("skillScores", evalResult.getSkillScores());
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "test", Map.of(
                    "id", test.getId(),
                    "token", test.getToken(),
                    "status", test.getStatus().toString(),
                    "createdAt", test.getCreatedAt(),
                    "submittedAt", test.getSubmittedAt(),
                    "timeLimitMinutes", test.getTimeLimitMinutes(),
                    "questions", questionsData,
                    "scores", scores,
                    "candidate", test.getCandidature() != null ? Map.of(
                        "firstName", test.getCandidature().getCandidate().getFirstName(),
                        "lastName", test.getCandidature().getCandidate().getLastName()
                    ) : null,
                    "internshipPosition", test.getInternshipPosition() != null ? Map.of(
                        "title", test.getInternshipPosition().getTitle()
                    ) : null
                )
            ));
            
        } catch (Exception e) {
            log.error("Error getting test results by token: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Error getting test results by token: " + e.getMessage()
            ));
        }
    }
}
