package com.example.smart_assess.controller;

import com.example.smart_assess.entity.GeneratedTest;
import com.example.smart_assess.entity.TestQuestion;
import com.example.smart_assess.service.TestQuestionService;
import com.example.smart_assess.repository.GeneratedTestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tests/{testId}/questions-management")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:3000")
public class TestQuestionController {

    private final TestQuestionService testQuestionService;
    private final GeneratedTestRepository generatedTestRepository;

    // 🎯 Récupérer toutes les questions d'un test
    @GetMapping
    public ResponseEntity<Map<String, Object>> getQuestionsByTestId(@PathVariable Long testId) {
        try {
            log.info("=== GET QUESTIONS FOR TEST {} ===", testId);
            
            // Vérifier que le test existe
            GeneratedTest test = generatedTestRepository.findById(testId)
                    .orElseThrow(() -> new RuntimeException("Test not found with id: " + testId));
            
            List<TestQuestion> questions = testQuestionService.getQuestionsByTestId(testId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "questions", questions,
                "totalQuestions", questions.size()
            ));
            
        } catch (Exception e) {
            log.error("Error getting questions for test {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // 🎯 Récupérer une question spécifique
    @GetMapping("/{questionId}")
    public ResponseEntity<Map<String, Object>> getQuestionById(
            @PathVariable Long testId,
            @PathVariable Long questionId) {
        try {
            log.info("=== GET QUESTION {} FOR TEST {} ===", questionId, testId);
            
            var question = testQuestionService.getQuestionByIdAndTestId(questionId, testId)
                    .orElseThrow(() -> new RuntimeException("Question not found with id: " + questionId));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "question", question
            ));
            
        } catch (Exception e) {
            log.error("Error getting question {} for test {}: {}", questionId, testId, e.getMessage(), e);
            return ResponseEntity.status(404).body(Map.of(
                "success", false,
                "error", "Question not found with id: " + questionId
            ));
        }
    }

    // 🎯 Créer une nouvelle question
    @PostMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> createQuestion(
            @PathVariable Long testId,
            @RequestBody TestQuestion question) {
        try {
            log.info("=== CREATE QUESTION FOR TEST {} ===", testId);
            log.info("Question data: {}", question);
            
            // Vérifier que le test existe
            GeneratedTest test = generatedTestRepository.findById(testId)
                    .orElseThrow(() -> new RuntimeException("Test not found with id: " + testId));
            
            // Associer la question au test
            question.setTest(test);
            
            // Définir l'ordre (à la fin)
            long currentCount = testQuestionService.countQuestionsByTestId(testId);
            question.setOrderIndex((int) currentCount);
            
            TestQuestion savedQuestion = testQuestionService.saveQuestion(question);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Question created successfully",
                "question", savedQuestion
            ));
            
        } catch (Exception e) {
            log.error("Error creating question for test {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // 🎯 Mettre à jour plusieurs questions (bulk update)
    @PutMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> updateQuestions(
            @PathVariable Long testId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("=== UPDATE QUESTIONS FOR TEST {} ===", testId);
            
            @SuppressWarnings("unchecked")
            List<TestQuestion> questions = (List<TestQuestion>) request.get("questions");
            
            if (questions == null || questions.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Questions list is required"
                ));
            }
            
            // Vérifier que le test existe
            GeneratedTest test = generatedTestRepository.findById(testId)
                    .orElseThrow(() -> new RuntimeException("Test not found with id: " + testId));
            
            // Associer chaque question au test et réorganiser
            for (int i = 0; i < questions.size(); i++) {
                TestQuestion question = questions.get(i);
                question.setTest(test);
                question.setOrderIndex(i);
            }
            
            List<TestQuestion> savedQuestions = testQuestionService.saveQuestions(questions);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Questions updated successfully",
                "questions", savedQuestions,
                "totalQuestions", savedQuestions.size()
            ));
            
        } catch (Exception e) {
            log.error("Error updating questions for test {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // 🎯 Mettre à jour une question spécifique
    @PutMapping("/{questionId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> updateQuestion(
            @PathVariable Long testId,
            @PathVariable Long questionId,
            @RequestBody TestQuestion question) {
        try {
            log.info("=== UPDATE QUESTION {} FOR TEST {} ===", questionId, testId);
            
            // Vérifier que la question existe et appartient au test
            TestQuestion existingQuestion = testQuestionService.getQuestionByIdAndTestId(questionId, testId)
                    .orElseThrow(() -> new RuntimeException("Question not found with id: " + questionId));
            
            // Mettre à jour les champs
            existingQuestion.setQuestionText(question.getQuestionText());
            existingQuestion.setQuestionType(question.getQuestionType());
            existingQuestion.setOptions(question.getOptions());
            existingQuestion.setCorrectAnswer(question.getCorrectAnswer());
            existingQuestion.setCorrectAnswerIndex(question.getCorrectAnswerIndex());  // 🎯 AJOUTER LE CORRECT ANSWER INDEX
            existingQuestion.setSkillTag(question.getSkillTag());
            existingQuestion.setMaxScore(question.getMaxScore());
            // orderIndex reste inchangé
            
            TestQuestion updatedQuestion = testQuestionService.updateQuestion(existingQuestion);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Question updated successfully",
                "question", updatedQuestion
            ));
            
        } catch (Exception e) {
            log.error("Error updating question {} for test {}: {}", questionId, testId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    // 🎯 Supprimer une question
    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> deleteQuestion(
            @PathVariable Long testId,
            @PathVariable Long questionId) {
        try {
            log.info("=== DELETE QUESTION {} FROM TEST {} ===", questionId, testId);
            
            testQuestionService.deleteQuestion(questionId, testId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Question deleted successfully"
            ));
            
        } catch (Exception e) {
            log.error("Error deleting question {} from test {}: {}", questionId, testId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Error deleting question: " + e.getMessage()
            ));
        }
    }

    // 🎯 Réorganiser les questions
    @PostMapping("/reorder")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> reorderQuestions(
            @PathVariable Long testId,
            @RequestBody Map<String, Object> request) {
        try {
            log.info("=== REORDER QUESTIONS FOR TEST {} ===", testId);
            
            @SuppressWarnings("unchecked")
            List<TestQuestion> questions = (List<TestQuestion>) request.get("questions");
            
            if (questions == null || questions.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Questions list is required"
                ));
            }
            
            // Vérifier que le test existe
            GeneratedTest test = generatedTestRepository.findById(testId)
                    .orElseThrow(() -> new RuntimeException("Test not found with id: " + testId));
            
            // Associer chaque question au test
            for (TestQuestion question : questions) {
                question.setTest(test);
            }
            
            testQuestionService.reorderQuestions(testId, questions);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Questions reordered successfully",
                "questions", questions
            ));
            
        } catch (Exception e) {
            log.error("Error reordering questions for test {}: {}", testId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }
}
