package com.example.smart_assess.repository;

import com.example.smart_assess.entity.TechnicalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TechnicalProfileRepository extends JpaRepository<TechnicalProfile, Long> {
    Optional<TechnicalProfile> findByCv_Id(Long cvId);
    TechnicalProfile findByCv_Candidate_Id(Long candidateId);
}
