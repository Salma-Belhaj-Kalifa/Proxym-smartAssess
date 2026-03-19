package com.example.smart_assess.repository;

import com.example.smart_assess.entity.TestSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TestSessionRepository extends JpaRepository<TestSession, Long> {
    Optional<TestSession> findByTest_Id(Long testId);
    
    Optional<TestSession> findFirstByTestIdOrderByStartedAtDesc(Long testId);
}
