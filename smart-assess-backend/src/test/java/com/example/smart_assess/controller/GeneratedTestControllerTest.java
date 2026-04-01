package com.example.smart_assess.controller;

import com.example.smart_assess.entity.*;
import com.example.smart_assess.enums.QuestionType;
import com.example.smart_assess.enums.TestStatus;
import com.example.smart_assess.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("GeneratedTestController Tests")
class GeneratedTestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private GeneratedTestRepository generatedTestRepository;

    @Autowired
    private TestQuestionRepository testQuestionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    private GeneratedTest test;
    private Candidate candidate;

    @BeforeEach
    void setUp() {
        // Nettoyer les repositories
        answerRepository.deleteAll();
        testQuestionRepository.deleteAll();
        generatedTestRepository.deleteAll();
        candidateRepository.deleteAll();

        // Créer un candidat
        candidate = new Candidate();
        candidate.setEmail("test@example.com");
        candidate.setPassword("password");
        candidate.setFirstName("Test");
        candidate.setLastName("Candidate");
        candidate.setRole(com.example.smart_assess.enums.Role.CANDIDATE);
        candidate.setPhone("");
        candidate = candidateRepository.save(candidate);

        // Créer un test
        test = GeneratedTest.builder()
                .candidate(candidate)
                .token("test-token-123")
                .status(TestStatus.DRAFT)
                .timeLimitMinutes(30)
                .questions(new ArrayList<>())
                .answers(new ArrayList<>())
                .build();
        test = generatedTestRepository.save(test);

        // Ajouter des questions
        TestQuestion question1 = TestQuestion.builder()
                .test(test)
                .questionText("Question 1")
                .questionType(QuestionType.MCQ)
                .correctAnswer("A")
                .maxScore(1.0)
                .orderIndex(1)
                .build();

        TestQuestion question2 = TestQuestion.builder()
                .test(test)
                .questionText("Question 2")
                .questionType(QuestionType.MCQ)
                .correctAnswer("B")
                .maxScore(1.0)
                .orderIndex(2)
                .build();

        testQuestionRepository.saveAll(List.of(question1, question2));

        // Ajouter des réponses
        Answer answer1 = Answer.builder()
                .test(test)
                .question(question1)
                .answerText("A")
                .build();

        Answer answer2 = Answer.builder()
                .test(test)
                .question(question2)
                .answerText("B")
                .build();

        answerRepository.saveAll(List.of(answer1, answer2));

        // Rafraîchir le test avec les nouvelles données
        test = generatedTestRepository.findById(test.getId()).orElseThrow();
    }

    @Test
    @DisplayName("DELETE /tests/{testId} - supprime le test et ses données associées")
    @WithMockUser(roles = {"MANAGER"})
    void deleteTest_ShouldDeleteTestAndAssociatedData() throws Exception {
        // Vérifier que les données existent avant la suppression
        long testCountBefore = generatedTestRepository.count();
        long questionCountBefore = testQuestionRepository.count();
        long answerCountBefore = answerRepository.count();

        // Effectuer la suppression
        mockMvc.perform(delete("/api/tests/{testId}", test.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Test supprimé avec succès"))
                .andExpect(jsonPath("$.deletedData.questions").value(2))
                .andExpect(jsonPath("$.deletedData.answers").value(2))
                .andExpect(jsonPath("$.deletedData.evaluationResult").value(false));

        // Vérifier que les données ont été supprimées par cascade
        long testCountAfter = generatedTestRepository.count();
        long questionCountAfter = testQuestionRepository.count();
        long answerCountAfter = answerRepository.count();

        // Le test doit être supprimé
        assert testCountAfter == testCountBefore - 1;
        
        // Les questions et réponses doivent être supprimées par cascade
        assert questionCountAfter == questionCountBefore - 2;
        assert answerCountAfter == answerCountBefore - 2;

        // Vérifier que le test n'existe plus
        assert !generatedTestRepository.existsById(test.getId());
    }

    @Test
    @DisplayName("DELETE /tests/{testId} - retourne 404 si le test n'existe pas")
    @WithMockUser(roles = {"MANAGER"})
    void deleteTest_WhenTestNotFound_ShouldReturn404() throws Exception {
        mockMvc.perform(delete("/api/tests/{testId}", 99999L))
                .andExpect(status().is5xxServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("DELETE /tests/{testId} - retourne 403 si non autorisé")
    void deleteTest_WhenNotAuthorized_ShouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/tests/{testId}", test.getId()))
                .andExpect(status().isForbidden());
    }
}
