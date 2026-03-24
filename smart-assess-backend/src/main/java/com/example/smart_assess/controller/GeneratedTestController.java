package com.example.smart_assess.controller;

import com.example.smart_assess.entity.*;
import com.example.smart_assess.enums.CandidatureStatus;
import com.example.smart_assess.enums.QuestionType;
import com.example.smart_assess.enums.TestStatus;
import com.example.smart_assess.repository.*;
import com.example.smart_assess.service.EmailService;
import com.example.smart_assess.service.TechnicalProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
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
    private final TestSessionRepository testSessionRepository;
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
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getAllTests() {
        log.info("=== GET ALL TESTS CALLED ===");
        
        try {
            List<GeneratedTest> allTests = generatedTestRepository.findAll();
            log.info("Found {} tests in database", allTests.size());
            
            List<Map<String, Object>> testList = allTests.stream()
                    .map(test -> {
                        Map<String, Object> testMap = new HashMap<>();
                        testMap.put("id", test.getId());
                        testMap.put("token", test.getToken());
                        testMap.put("status", test.getStatus().toString());
                        testMap.put("createdAt", test.getCreatedAt());
                        testMap.put("deadline", test.getDeadline());
                        testMap.put("timeLimitMinutes", test.getTimeLimitMinutes());
                        testMap.put("candidatureId", test.getCandidature() != null ? test.getCandidature().getId() : null);
                        testMap.put("internshipPositionId", test.getInternshipPosition() != null ? test.getInternshipPosition().getId() : null);
                        
                        // Ajouter les informations du candidat si disponibles
                        if (test.getCandidature() != null && test.getCandidature().getCandidate() != null) {
                            Map<String, Object> candidateMap = new HashMap<>();
                            candidateMap.put("id", test.getCandidature().getCandidate().getId());
                            candidateMap.put("firstName", test.getCandidature().getCandidate().getFirstName());
                            candidateMap.put("lastName", test.getCandidature().getCandidate().getLastName());
                            candidateMap.put("email", test.getCandidature().getCandidate().getEmail());
                            testMap.put("candidate", candidateMap);
                        }
                        
                        // Ajouter les informations de la position si disponibles
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
                    "tests", testList,
                    "count", testList.size()
            ));
            
        } catch (Exception e) {
            log.error("Get all tests error", e);
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    // =========================
    // CHECK EXISTING TEST
    // =========================
    @GetMapping("/check-existing/{candidatureId}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> checkExistingTest(@PathVariable Long candidatureId) {
        log.info("GeneratedTestController: check-existing endpoint called for candidature {}", candidatureId);
        
        try {
            Optional<GeneratedTest> existingTest = generatedTestRepository.findByCandidature_Id(candidatureId);
            
            if (existingTest.isPresent()) {
                GeneratedTest test = existingTest.get();
                return ResponseEntity.ok(Map.of(
                        "hasTest", true,
                        "testId", test.getId(),
                        "token", test.getToken(),
                        "status", test.getStatus().toString(),
                        "createdAt", test.getCreatedAt()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "hasTest", false
                ));
            }
            
        } catch (Exception e) {
            log.error("Check existing test error for candidature {}: {}", candidatureId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // TEST ENDPOINT
    // =========================
    @GetMapping("/test-endpoint")
    public ResponseEntity<Map<String, Object>> testEndpoint() {
        log.info("=== TEST ENDPOINT CALLED ===");
        return ResponseEntity.ok(Map.of(
                "message", "GeneratedTestController is working",
                "timestamp", LocalDateTime.now()
        ));
    }

    // =========================
    // GET TEST FOR REVIEW
    // =========================
    @GetMapping("/{id}/review")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getTestForReview(@PathVariable Long id) {
        log.info("=== GET TEST FOR REVIEW CALLED ===");
        log.info("Test ID: {}", id);
        
        try {
            log.info("Looking for test with ID: {}", id);
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));
            
            log.info("Test found: {} with status: {}", test.getId(), test.getStatus());
            
            // Récupérer les questions du test avec les réponses du candidat
            List<Map<String, Object>> questions = test.getQuestions().stream()
                    .map(q -> {
                        // Récupérer la réponse du candidat pour cette question
                        List<Answer> answers = answerRepository.findByQuestion_Id(q.getId());
                        String candidateAnswer = null;
                        Boolean isCorrect = false;
                        Double scoreObtained = 0.0;
                        
                        if (!answers.isEmpty()) {
                            Answer answer = answers.get(0); // Prendre la première réponse
                            candidateAnswer = answer.getAnswerText();
                            isCorrect = answer.getIsCorrect();
                            scoreObtained = answer.getScoreObtained();
                        }
                        
                        return Map.ofEntries(
                        Map.entry("id", q.getId()),
                        Map.entry("questionText", q.getQuestionText()),
                        Map.entry("questionType", q.getQuestionType().toString()),
                        Map.entry("options", q.getOptions()),
                        Map.entry("correctAnswer", q.getCorrectAnswer()),
                        Map.entry("skillTag", q.getSkillTag()),
                        Map.entry("maxScore", q.getMaxScore()),
                        Map.entry("orderIndex", q.getOrderIndex()),
                        Map.entry("candidateAnswer", candidateAnswer), // Réponse du candidat
                        Map.entry("isCorrect", isCorrect), // Si la réponse est correcte
                        Map.entry("scoreObtained", scoreObtained) // Score obtenu
                );
                    })
                    .collect(Collectors.toList());
            
            // Récupérer la session de test pour les informations temporelles
            TestSession session = testSessionRepository.findFirstByTestIdOrderByStartedAtDesc(test.getId())
                    .orElse(null);
            
            // Calculer les scores globaux
            double totalScore = 0.0;
            double maxScore = 0.0;
            int correctAnswers = 0;
            
            for (Map<String, Object> question : questions) {
                maxScore += ((Number) question.get("maxScore")).doubleValue();
                if (question.get("scoreObtained") != null) {
                    totalScore += ((Number) question.get("scoreObtained")).doubleValue();
                }
                if (Boolean.TRUE.equals(question.get("isCorrect"))) {
                    correctAnswers++;
                }
            }
            
            double finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
            
            log.info("Test {} - Total: {}/{} ({}%), Correct: {}/{}", 
                    id, totalScore, maxScore, finalScore, correctAnswers, questions.size());
            
            // Construire la réponse Map avec un builder pour éviter la limite de paramètres de Map.of()
            Map<String, Object> response = new HashMap<>();
            response.put("id", test.getId());
            response.put("token", test.getToken());
            response.put("status", test.getStatus().toString());
            response.put("createdAt", test.getCreatedAt());
            response.put("deadline", test.getDeadline());
            response.put("timeLimitMinutes", test.getTimeLimitMinutes());
            response.put("questions", questions);
            response.put("internshipPosition", Map.of(
                    "id", test.getInternshipPosition().getId(),
                    "title", test.getInternshipPosition().getTitle()
            ));
            response.put("candidate", Map.of(
                    "id", test.getCandidature().getCandidate().getId(),
                    "firstName", test.getCandidature().getCandidate().getFirstName(),
                    "lastName", test.getCandidature().getCandidate().getLastName(),
                    "email", test.getCandidature().getCandidate().getEmail()
            ));
            response.put("session", session != null ? Map.of(
                    "startedAt", session.getStartedAt(),
                    "submittedAt", session.getSubmittedAt(),
                    "timeSpentMinutes", session.getTimeSpentMinutes()
            ) : null);
            response.put("scores", Map.of(
                    "totalScore", totalScore,
                    "maxScore", maxScore,
                    "finalScore", finalScore,
                    "correctAnswers", correctAnswers,
                    "totalQuestions", questions.size()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Get test for review error for test {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
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

            Optional<GeneratedTest> existingTest = generatedTestRepository.findByCandidature_Id(candidatureId);
            if (existingTest.isPresent()) {
                return ResponseEntity.status(409).body(Map.of(
                        "success", false,
                        "message", "Un test existe déjà"
                ));
            }

            TechnicalProfile technicalProfile = technicalProfileService
                    .findByCandidateId(candidature.getCandidate().getId())
                    .orElseThrow(() -> new RuntimeException("Technical profile not found"));

            Map<String, Object> aiPayload = new HashMap<>();
            aiPayload.put("candidate_profile", technicalProfile.getParsedData());
            aiPayload.put("number_of_questions", questionCount);

            Map aiResponse = webClientBuilder.build()
                    .post()
                    .uri("http://localhost:8000/api/v1/generate-from-profile")
                    .bodyValue(aiPayload)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

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

            generatedTestRepository.save(test);

            candidature.setStatus(CandidatureStatus.TEST_SENT);
            candidatureRepository.save(candidature);

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
    // SAVE QUESTIONS
    // =========================
    @PutMapping("/{id}/questions")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> updateTestQuestions(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {

        try {
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> questionsData =
                    (List<Map<String, Object>>) request.get("questions");

            testQuestionRepository.deleteAll(test.getQuestions());

            List<TestQuestion> newQuestions = new ArrayList<>();

            for (int i = 0; i < questionsData.size(); i++) {
                Map<String, Object> q = questionsData.get(i);

                TestQuestion question = TestQuestion.builder()
                        .test(test)
                        .questionText((String) q.get("questionText"))
                        .questionType(QuestionType.valueOf((String) q.get("questionType")))
                        .options(objectMapper.valueToTree(q.get("options")))
                        .correctAnswer((String) q.get("correctAnswer"))
                        .skillTag((String) q.get("skillTag"))
                        .maxScore(1.0)
                        .orderIndex(i)
                        .build();

                newQuestions.add(testQuestionRepository.save(question));
            }

            test.setQuestions(newQuestions);
            generatedTestRepository.save(test);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "questionsCount", newQuestions.size()
            ));

        } catch (Exception e) {
            log.error("Update questions error", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // GENERATE LINK + SEND EMAIL
    // =========================
    @PostMapping("/{id}/generate-link")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> generateTestLink(@PathVariable Long id) {
        log.info("=== GENERATE TEST LINK CALLED ===");
        log.info("Test ID: {}", id);
        
        try {
            log.info("Looking for test with ID: {}", id);
            GeneratedTest test = generatedTestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Test not found"));
            
            log.info("Test found: {} with status: {}", test.getId(), test.getStatus());

            if (test.getStatus() == TestStatus.DRAFT) {
                log.info("Updating test status from DRAFT to READY");
                test.setStatus(TestStatus.READY);
                generatedTestRepository.save(test);
                log.info("Test status updated successfully");
            }

            String testLink = frontendUrl + "/candidate/test/" + test.getToken();
            log.info("Generated test link: {}", testLink);

            Candidate candidate = test.getCandidature().getCandidate();
            log.info("Candidate for link generation: {} {}", candidate.getFirstName(), candidate.getLastName());

            // Tenter d'envoyer l'email, mais ne pas échouer si ça ne marche pas
            try {
                String subject = "Votre test technique est prêt";

                String body = """
                        Bonjour %s,

                        Votre test technique pour le poste "%s" est prêt.

                        Cliquez ici :
                        %s

                        Deadline : %s

                        Bonne chance !

                        SmartAssess Team
                        """.formatted(
                        candidate.getFirstName(),
                        test.getInternshipPosition().getTitle(),
                        testLink,
                        test.getDeadline()
                );

                log.info("Preparing to send email to: {}", candidate.getEmail());
                emailService.sendEmail(
                        candidate.getEmail(),
                        subject,
                        body
                );
                log.info("Email sent successfully to: {}", candidate.getEmail());
                
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "testLink", testLink,
                        "message", "Lien généré et email envoyé"
                ));
                
            } catch (Exception emailError) {
                log.warn("Email failed but link generated successfully: {}", emailError.getMessage());
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "testLink", testLink,
                        "message", "Lien généré (email non envoyé - configuration requise)",
                        "emailWarning", "L'email n'a pas pu être envoyé. Veuillez configurer le service email."
                ));
            }

        } catch (Exception e) {
            log.error("Generate link error", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // PUBLIC TEST ACCESS
    // =========================
    @GetMapping("/public/{token}")
    public ResponseEntity<Map<String, Object>> getPublicTest(@PathVariable String token) {
        try {
            GeneratedTest test = generatedTestRepository.findByToken(token)
                    .orElseThrow(() -> new RuntimeException("Test invalid"));

            if (test.getDeadline().isBefore(LocalDateTime.now())) {
                return ResponseEntity.status(410).body(Map.of("error", "Test expired"));
            }

            List<Map<String, Object>> questions = test.getQuestions().stream()
                    .map(q -> Map.of(
                            "id", q.getId(),
                            "questionText", q.getQuestionText(),
                            "questionType", q.getQuestionType().toString(),
                            "options", q.getOptions()
                    ))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "testId", test.getId(),
                    "questions", questions,
                    "duration", test.getTimeLimitMinutes()
            ));

        } catch (Exception e) {
            log.error("Public test error", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // =========================
    // START TEST
    // =========================
    @PostMapping("/public/{token}/start")
    public ResponseEntity<Map<String, Object>> startTest(@PathVariable String token) {
        try {
            log.info("=== START TEST CALLED ===");
            log.info("Token: {}", token);
            
            GeneratedTest test = generatedTestRepository.findByToken(token)
                    .orElseThrow(() -> new RuntimeException("Test invalid"));
            
            log.info("Test found: {} with status: {}", test.getId(), test.getStatus());
            log.info("Test questions count: {}", test.getQuestions() != null ? test.getQuestions().size() : 0);
            log.info("Test candidature: {}", test.getCandidature() != null ? test.getCandidature().getId() : null);
            
            // Vérifier si le test a des questions
            if (test.getQuestions() == null || test.getQuestions().isEmpty()) {
                log.error("Test {} has no questions", test.getId());
                return ResponseEntity.status(400).body(Map.of(
                        "error", "Ce test n'a pas de questions. Veuillez contacter l'administrateur."
                ));
            }
            
            // Vérifier si le test n'est pas déjà démarré
            if (test.getStatus() != TestStatus.READY) {
                log.warn("Test {} is not ready for starting. Current status: {}", test.getId(), test.getStatus());
                // Permettre quand même le démarrage mais avec un avertissement
            }

            TestSession session = TestSession.builder()
                    .test(test)
                    .startedAt(LocalDateTime.now())
                    .build();

            TestSession savedSession = testSessionRepository.save(session);
            log.info("Session created with ID: {}", savedSession.getId());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "sessionId", savedSession.getId()
            ));

        } catch (Exception e) {
            log.error("Start test error for token {}: {}", token, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
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
            if (!test.getToken().equals(token)) {
                return ResponseEntity.status(403).body(Map.of("error", "Invalid token"));
            }
            
            @SuppressWarnings("unchecked")
            Map<String, String> answers = (Map<String, String>) submissionData.get("answers");
            Integer timeSpent = (Integer) submissionData.get("timeSpent");
            
            // Find existing session or create new one
            TestSession session = testSessionRepository.findFirstByTestIdOrderByStartedAtDesc(test.getId())
                    .orElse(null);
                    
            if (session == null) {
                session = TestSession.builder()
                        .test(test)
                        .startedAt(LocalDateTime.now())
                        .build();
            }
            
            // Update session with submission data
            session.setSubmittedAt(LocalDateTime.now());
            session.setTimeSpentMinutes(timeSpent != null ? timeSpent / 60 : 0);
            
            testSessionRepository.save(session);
            
            // ✅ SAUVEGARDER LES RÉPONSES DANS LA TABLE ANSWERS
            log.info("Saving {} answers for test session {}", answers.size(), session.getId());
            
            List<Answer> savedAnswers = new ArrayList<>();
            for (Map.Entry<String, String> answerEntry : answers.entrySet()) {
                String questionIdStr = answerEntry.getKey();
                String answerText = answerEntry.getValue();
                
                try {
                    // Convertir l'ID de question en Integer puis en Long
                    Integer questionId = Integer.parseInt(questionIdStr);
                    
                    // Récupérer la question correspondante
                    TestQuestion question = testQuestionRepository.findById(questionId.longValue())
                            .orElseThrow(() -> new RuntimeException("Question not found: " + questionId));
                    
                    // Créer l'objet Answer
                    Answer answer = Answer.builder()
                            .testSession(session)
                            .question(question)
                            .answerText(answerText)
                            .selectedOption(answerText) // Pour les QCM
                            .isCorrect(answerText.equals(question.getCorrectAnswer()))
                            .scoreObtained(answerText.equals(question.getCorrectAnswer()) ? question.getMaxScore() : 0.0)
                            .build();
                    
                    Answer savedAnswer = answerRepository.save(answer);
                    savedAnswers.add(savedAnswer);
                    
                    log.info("Answer saved for question {}: '{}' -> Correct: {}", 
                            questionId, answerText, answerText.equals(question.getCorrectAnswer()));
                    
                } catch (Exception e) {
                    log.error("Error saving answer for question {}: {}", questionIdStr, e.getMessage());
                }
            }
            
            log.info("Successfully saved {} answers out of {}", savedAnswers.size(), answers.size());
            
            // Update test status
            test.setStatus(TestStatus.SUBMITTED);
            generatedTestRepository.save(test);
            
            // Update candidature status to COMPLETED
            var candidature = test.getCandidature();
            candidature.setStatus(CandidatureStatus.COMPLETED);
            candidature.setUpdatedAt(LocalDateTime.now());
            
            // ✅ Sauvegarder la candidature en base de données
            candidatureRepository.save(candidature);
            
            log.info("Candidature status updated to COMPLETED: {}", candidature.getId());
            
            log.info("Test submitted successfully: {}", id);
            log.info("Answers saved in database: {}", savedAnswers.size());
            
            // Calculer et afficher le score
            double totalScore = savedAnswers.stream()
                    .mapToDouble(answer -> answer.getScoreObtained())
                    .sum();
            double maxScore = test.getQuestions().stream()
                    .mapToDouble(TestQuestion::getMaxScore)
                    .sum();
            double finalScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
            
            log.info("Test score: {}/{} ({}%)", totalScore, maxScore, finalScore);
            
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Test soumis avec succès",
                    "sessionId", session.getId(),
                    "totalScore", totalScore,
                    "maxScore", maxScore,
                    "finalScore", finalScore,
                    "answersCount", savedAnswers.size()
            ));
            
        } catch (Exception e) {
            log.error("Submit test error", e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}