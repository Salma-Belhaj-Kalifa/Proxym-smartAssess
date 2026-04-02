package com.example.smart_assess.service;

import com.example.smart_assess.entity.TestQuestion;
import com.example.smart_assess.repository.TestQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TestQuestionService {

    private final TestQuestionRepository testQuestionRepository;

    // 🎯 Récupérer toutes les questions d'un test (ordonnées)
    public List<TestQuestion> getQuestionsByTestId(Long testId) {
        log.info("Getting questions for test: {}", testId);
        return testQuestionRepository.findByTestIdOrderByOrderIndex(testId);
    }

    // 🎯 Récupérer une question spécifique d'un test
    public Optional<TestQuestion> getQuestionByIdAndTestId(Long questionId, Long testId) {
        log.info("Getting question {} for test: {}", questionId, testId);
        return testQuestionRepository.findByIdAndTestId(questionId, testId);
    }

    // 🎯 Sauvegarder une question
    public TestQuestion saveQuestion(TestQuestion question) {
        log.info("Saving question: {} for test: {}", question.getId(), question.getTest().getId());
        return testQuestionRepository.save(question);
    }

    // 🎯 Sauvegarder plusieurs questions
    public List<TestQuestion> saveQuestions(List<TestQuestion> questions) {
        log.info("Saving {} questions for test: {}", questions.size(), 
                questions.isEmpty() ? "N/A" : questions.get(0).getTest().getId());
        return testQuestionRepository.saveAll(questions);
    }

    // 🎯 Mettre à jour une question
    public TestQuestion updateQuestion(TestQuestion question) {
        log.info("Updating question: {} for test: {}", question.getId(), question.getTest().getId());
        return testQuestionRepository.save(question);
    }

    // 🎯 Supprimer une question spécifique
    public void deleteQuestion(Long questionId, Long testId) {
        log.info("Deleting question: {} from test: {}", questionId, testId);
        
        // Vérifier que la question appartient bien au test
        Optional<TestQuestion> question = testQuestionRepository.findByIdAndTestId(questionId, testId);
        if (question.isPresent()) {
            testQuestionRepository.deleteById(questionId);
            log.info("Question {} deleted successfully", questionId);
        } else {
            log.warn("Question {} not found in test {}", questionId, testId);
            throw new RuntimeException("Question not found with id: " + questionId);
        }
    }

    // 🎯 Supprimer toutes les questions d'un test
    public void deleteQuestionsByTestId(Long testId) {
        log.info("Deleting all questions for test: {}", testId);
        testQuestionRepository.deleteByTestId(testId);
    }

    // 🎯 Compter les questions d'un test
    public long countQuestionsByTestId(Long testId) {
        return testQuestionRepository.countByTestId(testId);
    }

    // 🎯 Réorganiser les ordres des questions
    public void reorderQuestions(Long testId, List<TestQuestion> questions) {
        log.info("Reordering {} questions for test: {}", questions.size(), testId);
        
        for (int i = 0; i < questions.size(); i++) {
            TestQuestion question = questions.get(i);
            question.setOrderIndex(i);
        }
        
        saveQuestions(questions);
    }
}
