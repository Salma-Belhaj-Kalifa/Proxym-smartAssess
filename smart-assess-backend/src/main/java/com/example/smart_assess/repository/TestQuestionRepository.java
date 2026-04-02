package com.example.smart_assess.repository;

import com.example.smart_assess.entity.TestQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestQuestionRepository extends JpaRepository<TestQuestion, Long> {
    List<TestQuestion> findByTest_Id(Long testId);
    List<TestQuestion> findByTestId(Long testId);
    
    // 🎯 NOUVELLES MÉTHODES pour une meilleure gestion
    Optional<TestQuestion> findByIdAndTestId(Long questionId, Long testId);
    
    @Query("SELECT q FROM TestQuestion q WHERE q.test.id = :testId ORDER BY q.orderIndex")
    List<TestQuestion> findByTestIdOrderByOrderIndex(@Param("testId") Long testId);
    
    @Query("SELECT COUNT(q) FROM TestQuestion q WHERE q.test.id = :testId")
    long countByTestId(@Param("testId") Long testId);
    
    // 🎯 Pour la suppression en cascade
    void deleteByTestId(Long testId);
}
