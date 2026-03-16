package com.example.smart_assess.repository;

import com.example.smart_assess.entity.HR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HRRepository extends JpaRepository<HR, Long> {
    Optional<HR> findByEmail(String email);
    boolean existsByEmail(String email);
}
