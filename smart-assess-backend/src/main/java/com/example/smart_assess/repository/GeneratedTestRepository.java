package com.example.smart_assess.repository;

import com.example.smart_assess.entity.GeneratedTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneratedTestRepository extends JpaRepository<GeneratedTest, Long> {
    Optional<GeneratedTest> findByToken(String token);
    Optional<GeneratedTest> findByCandidature_Id(Long candidatureId);
    Optional<GeneratedTest> findByCandidatureCandidateEmail(String email);
    List<GeneratedTest> findByStatusIn(List<String> statuses);
    List<GeneratedTest> findByCandidature_IdOrderByCreatedAtDesc(Long candidatureId);
    List<GeneratedTest> findAllByOrderByCreatedAtDesc();
}
