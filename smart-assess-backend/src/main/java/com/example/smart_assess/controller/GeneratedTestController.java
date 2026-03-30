package com.example.smart_assess.controller;

import com.example.smart_assess.entity.*;
import com.example.smart_assess.enums.*;
import com.example.smart_assess.repository.*;
import com.example.smart_assess.service.TechnicalProfileService;
import com.example.smart_assess.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

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
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

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
                        if (test.getCandidate() != null) {
                            Map<String, Object> candidateMap = new HashMap<>();
                            candidateMap.put("id", test.getCandidate().getId());
                            candidateMap.put("firstName", test.getCandidate().getFirstName());
                            candidateMap.put("lastName", test.getCandidate().getLastName());
                            candidateMap.put("email", test.getCandidate().getEmail());
                            testMap.put("candidate", candidateMap);
                        }
                        
                        // Informations du poste (récupérées depuis la candidature)
                        List<Candidature> candidateCandidatures = candidatureRepository.findByCandidate_Id(test.getCandidate().getId());
                        if (!candidateCandidatures.isEmpty() && candidateCandidatures.get(0).getInternshipPositions() != null && !candidateCandidatures.get(0).getInternshipPositions().isEmpty()) {
                            InternshipPosition firstPosition = candidateCandidatures.get(0).getInternshipPositions().iterator().next();
                            Map<String, Object> positionMap = new HashMap<>();
                            positionMap.put("id", firstPosition.getId());
                            positionMap.put("title", firstPosition.getTitle());
                            positionMap.put("company", firstPosition.getCompany());
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
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> generateTest(@RequestBody Map<String, Object> testData) {
        try {
            Long candidatureId = Long.valueOf(testData.get("candidatureId").toString());
            Integer questionCount = Integer.valueOf(testData.get("questionCount").toString());
            Integer duration = Integer.valueOf(testData.get("duration").toString());
            String deadline = testData.get("deadline").toString();

            Candidature candidature = candidatureRepository.findById(candidatureId)
                    .orElseThrow(() -> new RuntimeException("Candidature not found"));

            Optional<GeneratedTest> existingTest = generatedTestRepository.findByCandidate_Id(candidature.getCandidate().getId());
            if (existingTest.isPresent()) {
                return ResponseEntity.status(409).body(Map.of(
                        "success", false,
                        "message", "Un test existe déjà"
                ));
            }

            TechnicalProfile technicalProfile = technicalProfileService
                    .getByCandidateId(candidature.getCandidate().getId());
            
            if (technicalProfile == null) {
                return ResponseEntity.status(404).body(Map.of(
                        "success", false,
                        "error", "Technical profile not found for candidate"
                ));
            }

            Map<String, Object> aiPayload = new HashMap<>();
            
            // Convertir ObjectNode en Map en utilisant ObjectMapper
            ObjectNode profileData = (ObjectNode) technicalProfile.getParsedData();
            Map<String, Object> profileMap = objectMapper.convertValue(profileData, Map.class);
            
            aiPayload.put("candidate_profile", profileMap);
            aiPayload.put("number_of_questions", questionCount);

            log.info("=== AI PAYLOAD (WebClient Approach) ===");
            log.info("candidate_profile keys: {}", profileMap != null ? profileMap.keySet() : "null");
            log.info("number_of_questions: {}", questionCount);

            // Utiliser WebClient comme l'ancien code fonctionnel
            Map aiResponse = webClientBuilder.build()
                    .post()
                    .uri("http://localhost:8000/api/v1/generate-from-profile")
                    .bodyValue(aiPayload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            log.info("=== FASTAPI RESPONSE RECEIVED ===");
            log.info("AI Response: {}", aiResponse);
            log.info("AI Response keys: {}", aiResponse != null ? aiResponse.keySet() : "null");

            if (aiResponse == null || !aiResponse.containsKey("questions")) {
                log.error("❌ AI Response is null or missing 'questions' key");
                return ResponseEntity.status(500).body(Map.of(
                        "success", false,
                        "error", "Failed to generate questions from AI service"
                ));
            }

            List<Map<String, Object>> apiQuestions = (List<Map<String, Object>>) aiResponse.get("questions");
            log.info("✅ Questions received from AI: {}", apiQuestions != null ? apiQuestions.size() : 0);
            
            if (apiQuestions != null && !apiQuestions.isEmpty()) {
                log.info("First question sample: {}", apiQuestions.get(0));
            } else {
                log.error("❌ No questions received from AI service");
                return ResponseEntity.status(500).body(Map.of(
                        "success", false,
                        "error", "AI service returned empty questions list"
                ));
            }

            GeneratedTest test = GeneratedTest.builder()
                    .candidate(candidature.getCandidate())
                    .token(UUID.randomUUID().toString())
                    .status(TestStatus.DRAFT)
                    .createdAt(LocalDateTime.now())
                    .assignedAt(LocalDateTime.now())
                    .deadline(LocalDateTime.parse(deadline + "T23:59:59"))
                    .timeLimitMinutes(duration)
                    .build();

            generatedTestRepository.save(test);

            // ✅ SAUVEGARDER LES QUESTIONS RETOURNÉES PAR L'API FASTAPI
            log.info("=== STARTING QUESTION SAVING PROCESS ===");
            log.info("Number of questions to save: {}", apiQuestions.size());
            
            List<TestQuestion> savedQuestions = new ArrayList<>();
            
            if (apiQuestions != null && !apiQuestions.isEmpty()) {
                for (int i = 0; i < apiQuestions.size(); i++) {
                    Map<String, Object> apiQuestion = apiQuestions.get(i);
                    log.info("=== PROCESSING QUESTION {} ===", i + 1);
                    log.info("Question data: {}", apiQuestion);
                    
                    try {
                        String questionText = (String) apiQuestion.get("question");
                        String technology = (String) apiQuestion.get("technology");
                        String level = (String) apiQuestion.get("level");
                        String correctAnswer = (String) apiQuestion.get("correct_answer");
                        List<String> options = (List<String>) apiQuestion.get("options");
                        
                        log.info("Extracted - Question: '{}', Technology: '{}', Level: '{}'", 
                            questionText, technology, level);
                        log.info("Extracted - Correct Answer: '{}', Options: {}", correctAnswer, options);
                        
                        // Convertir les options en ArrayNode
                        ArrayNode optionsNode = objectMapper.valueToTree(options);
                        log.info("Options converted to ArrayNode successfully");
                        
                        TestQuestion question = TestQuestion.builder()
                                .test(test)
                                .questionText(questionText)
                                .questionType(QuestionType.MCQ)
                                .options(optionsNode)
                                .correctAnswer(correctAnswer)
                                .maxScore(10.0)
                                .skillTag(technology)
                                .orderIndex(i)
                                .build();
                        
                        log.info("TestQuestion object created successfully");
                        
                        TestQuestion savedQuestion = testQuestionRepository.save(question);
                        savedQuestions.add(savedQuestion);
                        
                        log.info("✅ Successfully saved question {} to database with ID: {}", 
                            i + 1, savedQuestion.getId());
                        
                    } catch (Exception e) {
                        log.error("❌ Error saving question {}: {}", i + 1, e.getMessage(), e);
                    }
                }
                
                log.info("=== QUESTION SAVING COMPLETED ===");
                log.info("Successfully saved {} questions out of {} received", 
                    savedQuestions.size(), apiQuestions.size());
                
            } else {
                log.error("❌ No questions to save - apiQuestions is null or empty");
            }

            candidature.setStatus(CandidatureStatus.TEST_SENT);
            candidatureRepository.save(candidature);

            log.info("Generated test with {} questions for test {}", 
                savedQuestions.size(), test.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "testId", test.getId(),
                    "token", test.getToken(),
                    "questions", aiResponse.get("questions")
            ));

        } catch (Exception e) {
            log.error("Generate test error", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
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
            GeneratedTest existingTest = generatedTestRepository.findByCandidate_Id(candidature.getCandidate().getId()).orElse(null);
            
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
                
                // Convertir les options en ArrayNode en utilisant ObjectMapper
                List<String> optionsList = (List<String>) questionData.get("options");
                ArrayNode optionsNode = objectMapper.valueToTree(optionsList);
                
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
            log.info("=== GET TEST FOR REVIEW CALLED ===");
            log.info("Test ID: {}", id);
            
            Optional<GeneratedTest> testOpt = generatedTestRepository.findById(id);
            if (testOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Test not found with id: " + id
                ));
            }

            GeneratedTest test = testOpt.get();
            log.info("Test found - ID: {}, Status: {}, EvaluationResult: {}", 
                test.getId(), test.getStatus(), test.getEvaluationResult() != null ? "PRESENT" : "NULL");
            
            // Préparer la réponse
            Map<String, Object> response = new HashMap<>();
            
            // Calculer les scores
            Map<String, Object> scores = new HashMap<>();
            
            // TOUJOURS recalculer les scores depuis les réponses pour éviter les incohérences
            log.info("Forcing score calculation from answers for test {}", test.getId());
            EvaluationResult calculatedResult = calculateTestResults(test);
            
            if (calculatedResult != null) {
                scores.put("totalScore", calculatedResult.getTotalScore());
                scores.put("maxScore", calculatedResult.getMaxScore());
                scores.put("finalScore", calculatedResult.getFinalScore());
                scores.put("totalQuestions", calculatedResult.getTotalQuestions());
                scores.put("correctAnswers", calculatedResult.getCorrectAnswers());
                scores.put("skillScores", calculatedResult.getSkillScores());
                log.info("Calculated scores for test {}: finalScore={}, totalScore={}, maxScore={}", 
                    test.getId(), calculatedResult.getFinalScore(), calculatedResult.getTotalScore(), calculatedResult.getMaxScore());
            } else {
                log.warn("Could not calculate scores for test {}", test.getId());
                scores.put("totalScore", 0);
                scores.put("maxScore", 0);
                scores.put("finalScore", 0);
                scores.put("totalQuestions", 0);
                scores.put("correctAnswers", 0);
                scores.put("skillScores", new HashMap<>());
            }
            
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
            response.put("status", test.getStatus().toString());
            response.put("timeLimitMinutes", test.getTimeLimitMinutes());
            response.put("createdAt", test.getCreatedAt());
            response.put("deadline", test.getDeadline());
            // Ajouter le niveau basé sur la complexité des questions ou le poste
            String level = "JUNIOR"; // Par défaut
            // Récupérer le poste depuis la candidature du candidat
            List<Candidature> candidateCandidatures = candidatureRepository.findByCandidate_Id(test.getCandidate().getId());
            if (!candidateCandidatures.isEmpty() && candidateCandidatures.get(0).getInternshipPositions() != null && !candidateCandidatures.get(0).getInternshipPositions().isEmpty()) {
                String title = candidateCandidatures.get(0).getInternshipPositions().iterator().next().getTitle().toLowerCase();
                if (title.contains("senior") || title.contains("expert")) {
                    level = "SENIOR";
                } else if (title.contains("middle") || title.contains("intermédiaire")) {
                    level = "MIDDLE";
                } else if (title.contains("junior") || title.contains("débutant")) {
                    level = "JUNIOR";
                }
            }
            response.put("level", level);
            response.put("session", sessionData);
            response.put("scores", scores);
            response.put("questions", enrichedQuestions);
            
            // Informations du candidat
            if (test.getCandidate() != null) {
                Map<String, Object> candidate = new HashMap<>();
                candidate.put("id", test.getCandidate().getId());
                candidate.put("firstName", test.getCandidate().getFirstName());
                candidate.put("lastName", test.getCandidate().getLastName());
                candidate.put("email", test.getCandidate().getEmail());
                response.put("candidate", candidate);
            }
            
            // Informations du poste (récupérées depuis la candidature)
            if (!candidateCandidatures.isEmpty() && candidateCandidatures.get(0).getInternshipPositions() != null && !candidateCandidatures.get(0).getInternshipPositions().isEmpty()) {
                InternshipPosition firstPosition = candidateCandidatures.get(0).getInternshipPositions().iterator().next();
                Map<String, Object> position = new HashMap<>();
                position.put("id", firstPosition.getId());
                position.put("title", firstPosition.getTitle());
                position.put("company", firstPosition.getCompany());
                response.put("internshipPosition", position);
            }
            
            response.put("testId", test.getId()); // Pour compatibilité
            
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
            
            // Mettre à jour le statut de la candidature si nécessaire
            List<Candidature> candidateCandidatures = candidatureRepository.findByCandidate_Id(test.getCandidate().getId());
            if (!candidateCandidatures.isEmpty()) {
                Candidature candidature = candidateCandidatures.get(0);
                candidature.setStatus(CandidatureStatus.COMPLETED);
                candidatureRepository.save(candidature);
                log.info("Updated candidature status to COMPLETED for test submission");
            }
            
            // Envoyer l'email de notification
            try {
                String candidateEmail = test.getCandidate().getEmail();
                String candidateName = test.getCandidate().getFirstName() + " " + test.getCandidate().getLastName();
                
                // Récupérer le titre du poste depuis la candidature
                String positionTitle = "Poste technique";
                if (!candidateCandidatures.isEmpty() && candidateCandidatures.get(0).getInternshipPositions() != null && !candidateCandidatures.get(0).getInternshipPositions().isEmpty()) {
                    positionTitle = candidateCandidatures.get(0).getInternshipPositions().iterator().next().getTitle();
                }
                
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
            log.info("=== CALCULATING TEST RESULTS FOR TEST {} ===", test.getId());
            List<Answer> answers = test.getAnswers();
            log.info("Answers found: {}", answers != null ? answers.size() : 0);
            
            if (answers == null || answers.isEmpty()) {
                log.warn("No answers found for test {}", test.getId());
                return null;
            }
            
            // Calculer les scores de base
            int totalQuestions = answers.size();
            log.info("Total questions: {}", totalQuestions);
            
            long correctAnswers = answers.stream()
                    .filter(answer -> answer.getIsCorrect() != null && answer.getIsCorrect())
                    .count();
            log.info("Correct answers: {}", correctAnswers);
            
            double totalScore = answers.stream()
                    .mapToDouble(answer -> answer.getScoreObtained() != null ? answer.getScoreObtained() : 0.0)
                    .sum();
            log.info("Total score: {}", totalScore);
            
            double maxScore = answers.stream()
                    .mapToDouble(answer -> answer.getMaxScore() != null ? answer.getMaxScore() : 1.0)
                    .sum();
            log.info("Max score: {}", maxScore);
            
            double finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
            log.info("Final score calculated: {}", finalScore);
            
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
    // SEND TEST EMAIL
    // =========================
    @PostMapping("/{id}/send-email")
    public ResponseEntity<Map<String, Object>> sendTestEmail(
            @PathVariable Long id,
            @RequestBody Map<String, Object> emailData) {
        
        try {
            log.info("=== SEND TEST EMAIL CALLED ===");
            log.info("Test ID: {}", id);
            log.info("Email data: {}", emailData);
            
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));
            
            String recipientEmail = (String) emailData.get("recipientEmail");
            String customMessage = (String) emailData.get("customMessage");
            
            if (recipientEmail == null || recipientEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Recipient email is required"
                ));
            }
            
            String candidateFirstName = null;
            String candidateLastName = null;
            String candidateName = "Candidat";
            String positionTitle = "Poste technique";
            
            if (test.getCandidate() != null) {
                candidateFirstName = test.getCandidate().getFirstName();
                candidateLastName = test.getCandidate().getLastName();
                if (candidateFirstName != null && candidateLastName != null) {
                    candidateName = candidateFirstName + " " + candidateLastName;
                }
            }
            
            // Récupérer la candidature du candidat pour obtenir les postes
            List<Candidature> candidateCandidatures = candidatureRepository.findByCandidate_Id(test.getCandidate().getId());
            String positions = "Poste technique";
            if (!candidateCandidatures.isEmpty() && candidateCandidatures.get(0).getInternshipPositions() != null && !candidateCandidatures.get(0).getInternshipPositions().isEmpty()) {
                // ✅ Récupérer TOUS les postes maintenant
                positions = candidateCandidatures.get(0).getInternshipPositions().stream()
                    .map(position -> position.getTitle())
                    .collect(Collectors.joining(", "));
            }
            
            String testLink = frontendUrl + "/candidate/test/" + test.getToken();
            LocalDateTime expirationDate = test.getDeadline();
            
            // ✅ UTILISER LE VRAI SERVICE D'EMAIL
            try {
                // Récupérer la durée du test
                Integer timeLimitMinutes = test.getTimeLimitMinutes();
                String duration = timeLimitMinutes != null ? timeLimitMinutes.toString() + " minutes" : "45-60 minutes";
                
                emailService.sendTestEmail(
                    recipientEmail,
                    candidateName,
                    test.getToken(),
                    positions,
                    expirationDate,
                    duration
                );
                
                log.info("Test email sent successfully to: {} with duration: {}", recipientEmail, duration);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email sent successfully",
                    "recipient", recipientEmail
                ));
                
            } catch (Exception emailError) {
                log.error("Error sending email via EmailService: {}", emailError.getMessage(), emailError);
                // En cas d'erreur avec l'email HTML, essayer avec l'email simple
                try {
                    String simpleMessage = customMessage != null ? customMessage : 
                        String.format("Bonjour %s,\n\nVous êtes invité à passer un test technique pour le poste suivant : %s\n\nVoici votre lien personnel : %s\n\nDate d'expiration : %s\n\nCordialement,\nL'équipe de recrutement",
                        candidateName, positions, testLink, 
                        expirationDate != null ? expirationDate.format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")) : "Non définie");
                    
                    emailService.sendSimpleEmail(
                        recipientEmail,
                        "📋 Test technique - PROXYM SmartAssess",
                        simpleMessage
                    );
                    
                    log.info("Simple email sent successfully to: {}", recipientEmail);
                    
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Email sent successfully (simple format)",
                        "recipient", recipientEmail
                    ));
                    
                } catch (Exception simpleEmailError) {
                    log.error("Error sending simple email: {}", simpleEmailError.getMessage(), simpleEmailError);
                    throw new RuntimeException("Impossible d'envoyer l'email: " + simpleEmailError.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("Error sending test email: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Error sending email: " + e.getMessage()
            ));
        }
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
                    "candidate", test.getCandidate() != null ? Map.of(
                        "firstName", test.getCandidate().getFirstName(),
                        "lastName", test.getCandidate().getLastName()
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
