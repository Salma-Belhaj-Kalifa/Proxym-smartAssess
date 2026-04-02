package com.example.smart_assess.repository;

import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.enums.CandidatureStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidatureRepository extends JpaRepository<Candidature, Long> {
    List<Candidature> findByCandidate_Id(Long candidateId);
    List<Candidature> findByStatus(CandidatureStatus status);
    
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate LEFT JOIN FETCH c.internshipPositions WHERE c.candidate.id = :candidateId")
    List<Candidature> findByCandidate_IdWithRelations(Long candidateId);
    
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate LEFT JOIN FETCH c.internshipPositions ip WHERE ip.id = :positionId")
    List<Candidature> findByInternshipPosition_IdWithRelations(Long positionId);
    
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate LEFT JOIN FETCH c.internshipPositions")
    List<Candidature> findAllWithRelations();
    
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate LEFT JOIN FETCH c.internshipPositions WHERE c.id = :id")
    Optional<Candidature> findByIdWithRelations(Long id);
    
    @Query(value = "SELECT cc.id, cc.file_name, cc.file_size_bytes, cc.parsing_status, cc.upload_date, cc.file_data " +
                   "FROM candidate_cvs cc WHERE cc.candidate_id = :candidateId", nativeQuery = true)
    List<Object[]> findCandidateCVsWithData(Long candidateId);
    
    @Query(value = "SELECT tp.id, tp.cv_id, tp.created_at, tp.parsed_data " +
                   "FROM technical_profiles tp " +
                   "JOIN candidate_cvs cc ON tp.cv_id = cc.id " +
                   "WHERE cc.candidate_id = :candidateId", nativeQuery = true)
    List<Object[]> findTechnicalProfilesWithData(Long candidateId);
}
