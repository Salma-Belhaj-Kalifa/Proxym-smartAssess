package com.example.smart_assess.repository;

import com.example.smart_assess.entity.CandidateCV;
import com.example.smart_assess.enums.ParsingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidateCVRepository extends JpaRepository<CandidateCV, Long> {
    Optional<CandidateCV> findByCandidate_Id(Long candidateId);
    Optional<CandidateCV> findByCandidate_IdAndParsingStatus(Long candidateId, ParsingStatus status);
}
