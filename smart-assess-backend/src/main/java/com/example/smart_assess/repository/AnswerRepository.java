package com.example.smart_assess.repository;

import com.example.smart_assess.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByCandidateId(Long candidateId);
    List<Answer> findByCandidateIdAndQuestionId(Long candidateId, Long questionId);
    List<Answer> findByTestId(Long testId);
    List<Answer> findByTestIdAndQuestionId(Long testId, Long questionId);
    void deleteByCandidateId(Long candidateId);
    void deleteByTestId(Long testId);
    Optional<Answer> findByCandidateIdAndQuestionIdAndTestId(Long candidateId, Long questionId, Long testId);
}
