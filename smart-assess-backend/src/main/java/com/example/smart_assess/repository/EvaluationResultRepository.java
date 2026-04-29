package com.example.smart_assess.repository;

import com.example.smart_assess.entity.EvaluationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationResultRepository extends JpaRepository<EvaluationResult, Long> {
    
    Optional<EvaluationResult> findByTestId(Long testId);
    
    List<EvaluationResult> findByCandidateIdOrderByMatchingCalculatedAtDesc(Long candidateId);
    
    @Query("SELECT er FROM EvaluationResult er WHERE er.candidate.id = :candidateId AND er.bestMatchPositionId IS NOT NULL ORDER BY er.matchingCalculatedAt DESC")
    List<EvaluationResult> findWithBestMatchByCandidateIdOrderByMatchingCalculatedAtDesc(@Param("candidateId") Long candidateId);
    
    @Query("SELECT er FROM EvaluationResult er WHERE er.candidate.id = :candidateId AND er.matchingScores IS NOT EMPTY ORDER BY er.matchingCalculatedAt DESC")
    List<EvaluationResult> findWithMatchingScoresByCandidateIdOrderByMatchingCalculatedAtDesc(@Param("candidateId") Long candidateId);
    
    @Query("SELECT DISTINCT er.candidate.id FROM EvaluationResult er WHERE er.matchingCalculatedAt IS NOT NULL")
    List<Long> findCandidateIdsWithMatching();
    
    @Modifying
    @Transactional
    @Query("UPDATE EvaluationResult er SET er.compositeScore = :compositeScore, er.compositeCalculatedAt = :calculatedAt WHERE er.id = :id")
    int updateCompositeScore(@Param("id") Long id, @Param("compositeScore") Double compositeScore, @Param("calculatedAt") LocalDateTime calculatedAt);
}
