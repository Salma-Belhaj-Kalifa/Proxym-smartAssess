package com.example.smart_assess.repository;

import com.example.smart_assess.entity.GeneratedTest;
import com.example.smart_assess.enums.TestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GeneratedTestRepository extends JpaRepository<GeneratedTest, Long> {
    Optional<GeneratedTest> findByToken(String token);
    Optional<GeneratedTest> findByCandidature_Id(Long candidatureId);
    Optional<GeneratedTest> findByTokenAndStatus(String token, TestStatus status);
}
