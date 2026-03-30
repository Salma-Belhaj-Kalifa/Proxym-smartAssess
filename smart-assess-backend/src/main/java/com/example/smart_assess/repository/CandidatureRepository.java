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
    // Supprimé: List<Candidature> findByInternshipPosition_Id(Long positionId);
    List<Candidature> findByStatus(CandidatureStatus status);
    // Supprimé: Optional<Candidature> findByCandidate_IdAndInternshipPosition_Id(Long candidateId, Long positionId);
    
    // Méthodes avec JOIN FETCH pour éviter les lazy loading exceptions
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate LEFT JOIN FETCH c.internshipPositions WHERE c.candidate.id = :candidateId")
    List<Candidature> findByCandidate_IdWithRelations(Long candidateId);
    
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate LEFT JOIN FETCH c.internshipPositions ip WHERE ip.id = :positionId")
    List<Candidature> findByInternshipPosition_IdWithRelations(Long positionId);
    
    @Query("SELECT c FROM Candidature c JOIN FETCH c.candidate LEFT JOIN FETCH c.internshipPositions")
    List<Candidature> findAllWithRelations();
    
    // Requêtes natives pour récupérer les données IA depuis les tables candidate_cvs et technical_profiles
    @Query(value = "SELECT cc.id, cc.file_name, cc.file_size_bytes, cc.parsing_status, cc.upload_date, cc.file_data " +
                   "FROM candidate_cvs cc WHERE cc.candidate_id = :candidateId", nativeQuery = true)
    List<Object[]> findCandidateCVsWithData(Long candidateId);
    
    @Query(value = "SELECT tp.id, tp.cv_id, tp.created_at, tp.parsed_data " +
                   "FROM technical_profiles tp " +
                   "JOIN candidate_cvs cc ON tp.cv_id = cc.id " +
                   "WHERE cc.candidate_id = :candidateId", nativeQuery = true)
    List<Object[]> findTechnicalProfilesWithData(Long candidateId);
}
