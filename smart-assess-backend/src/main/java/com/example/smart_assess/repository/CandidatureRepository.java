package com.example.smart_assess.repository;

import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.enums.CandidatureStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    List<Candidature> findByCandidate_Id(Long candidateId);
    List<Candidature> findByInternshipPosition_Id(Long positionId);
    List<Candidature> findByStatus(CandidatureStatus status);
    Optional<Candidature> findByCandidate_IdAndInternshipPosition_Id(Long candidateId, Long positionId);
    
    // Méthodes avec JOIN FETCH pour éviter les lazy loading exceptions
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate JOIN FETCH c.internshipPosition WHERE c.candidate.id = :candidateId")
    List<Candidature> findByCandidate_IdWithRelations(Long candidateId);
    
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate JOIN FETCH c.internshipPosition")
    List<Candidature> findAllWithRelations();
}
