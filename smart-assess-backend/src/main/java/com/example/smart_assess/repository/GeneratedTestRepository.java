package com.example.smart_assess.repository;

import com.example.smart_assess.entity.GeneratedTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneratedTestRepository extends JpaRepository<GeneratedTest, Long> {
    Optional<GeneratedTest> findByToken(String token);
    // Supprimé: Optional<GeneratedTest> findByCandidature_Id(Long candidatureId);
    Optional<GeneratedTest> findByCandidate_Id(Long candidateId);  // ✅ Ajouté
    Optional<GeneratedTest> findByCandidateEmail(String email);  // ✅ Corrigé
    List<GeneratedTest> findByStatusIn(List<String> statuses);
    // Supprimé: List<GeneratedTest> findByCandidature_IdOrderByCreatedAtDesc(Long candidatureId);
    List<GeneratedTest> findByCandidate_IdOrderByCreatedAtDesc(Long candidateId);  // ✅ Ajouté
    List<GeneratedTest> findAllByOrderByCreatedAtDesc();
    
    void deleteAllByCandidate_Id(Long candidateId);
    
    @Query("SELECT t FROM GeneratedTest t LEFT JOIN FETCH t.candidate WHERE t.id = :id")
    Optional<GeneratedTest> findByIdWithCandidate(Long id);
}
