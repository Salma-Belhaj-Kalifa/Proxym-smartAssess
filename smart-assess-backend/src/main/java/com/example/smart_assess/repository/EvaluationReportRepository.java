package com.example.smart_assess.repository;

import com.example.smart_assess.entity.EvaluationReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationReportRepository extends JpaRepository<EvaluationReportEntity, Long> {
    Optional<EvaluationReportEntity> findByCandidatureId(Long candidatureId);
    List<EvaluationReportEntity> findByCandidatureIdOrderByGeneratedAtDesc(Long candidatureId);
    Optional<EvaluationReportEntity> findTopByCandidatureIdOrderByGeneratedAtDesc(Long candidatureId);
    List<EvaluationReportEntity> findAllByOrderByGeneratedAtDesc();
}
