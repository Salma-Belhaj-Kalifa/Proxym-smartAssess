package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateCandidateRequest;
import com.example.smart_assess.dto.CandidateDto;
import com.example.smart_assess.entity.*;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.*;
import com.example.smart_assess.service.CandidateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateServiceImpl implements CandidateService {

    private final CandidateRepository candidateRepository;
    private final PasswordEncoder passwordEncoder;
    private final CandidatureRepository candidatureRepository;

    @Override
    public CandidateDto createCandidate(CreateCandidateRequest request) {
        if (candidateRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Candidate candidate = new Candidate();
        candidate.setEmail(request.getEmail());
        candidate.setPassword(passwordEncoder.encode(request.getPassword()));
        candidate.setFirstName(request.getFirstName());
        candidate.setLastName(request.getLastName());
        candidate.setPhone(request.getPhone());
        candidate.setRole(Role.CANDIDATE);

        candidate = candidateRepository.save(candidate);
        return toDto(candidate);
    }

    @Override
    public CandidateDto updateCandidate(Long id, CreateCandidateRequest request) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        candidate.setFirstName(request.getFirstName());
        candidate.setLastName(request.getLastName());
        candidate.setPhone(request.getPhone());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            candidate.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        candidate = candidateRepository.save(candidate);
        return toDto(candidate);
    }

    @Override
    public void deleteCandidate(Long id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        
        log.info("=== DÉBUT SUPPRESSION CANDIDAT {} ===", id);
        log.info("Email: {}", candidate.getEmail());
        
        try {
            // Compter les données qui seront supprimées par cascade
            int candidatureCount = candidatureRepository.findByCandidate_Id(id).size();
            CandidateCV cv = candidate.getCv();
            boolean hasCV = cv != null;
            boolean hasTechnicalProfile = hasCV && cv.getTechnicalProfile() != null;
            
            log.info("Données qui seront supprimées : {} candidature(s), CV: {}, Profil technique: {}", 
                candidatureCount, hasCV, hasTechnicalProfile);
            
            // La suppression du candidat déclenchera les cascades automatiquement grâce à CascadeType.ALL
            candidateRepository.delete(candidate);
            
            log.info("=== CANDIDAT {} SUPPRIMÉ AVEC SUCCÈS ===", id);
            log.info("Suppression en cascade effectuée via JPA CascadeType.ALL");
            
        } catch (Exception e) {
            log.error("Erreur lors de la suppression du candidat {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Impossible de supprimer ce candidat. Erreur lors de la suppression des données associées.", e);
        }
    }

    @Override
    public void deleteMyProfile() {
        // Récupérer l'email de l'utilisateur authentifié
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Utilisateur non authentifié");
        }
        
        Candidate candidate = candidateRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Candidat non trouvé"));
        
        log.info("=== DÉBUT AUTO-SUPPRESSION CANDIDAT {} ===", candidate.getId());
        log.info("Email: {}", email);
        
        try {
            // Compter les données qui seront supprimées par cascade
            int candidatureCount = candidatureRepository.findByCandidate_Id(candidate.getId()).size();
            CandidateCV cv = candidate.getCv();
            boolean hasCV = cv != null;
            boolean hasTechnicalProfile = hasCV && cv.getTechnicalProfile() != null;
            
            log.info("Données qui seront supprimées : {} candidature(s), CV: {}, Profil technique: {}", 
                candidatureCount, hasCV, hasTechnicalProfile);
            
            // La suppression du candidat déclenchera les cascades automatiquement grâce à CascadeType.ALL
            candidateRepository.delete(candidate);
            
            log.info("=== AUTO-SUPPRESSION CANDIDAT {} TERMINÉE AVEC SUCCÈS ===", candidate.getId());
            log.info("Suppression en cascade effectuée via JPA CascadeType.ALL");
            
        } catch (Exception e) {
            log.error("Erreur lors de l'auto-suppression du candidat {}: {}", candidate.getId(), e.getMessage(), e);
            throw new RuntimeException("Impossible de supprimer votre profil. Erreur lors de la suppression des données associées.", e);
        }
    }

    @Override
    public boolean isOwner(Long candidateId, String email) {
        try {
            Candidate candidate = candidateRepository.findById(candidateId)
                    .orElse(null);
            return candidate != null && candidate.getEmail().equals(email);
        } catch (Exception e) {
            log.error("Error checking ownership for candidate {}: {}", candidateId, e.getMessage());
            return false;
        }
    }

    @Override
    public CandidateDto getCandidateById(Long id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        return toDto(candidate);
    }

    @Override
    public CandidateDto getCandidateByEmail(String email) {
        Candidate candidate = candidateRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        return toDto(candidate);
    }

    @Override
    public List<CandidateDto> getAllCandidates() {
        log.info("Getting all candidates from database");
        try {
            List<Candidate> candidates = candidateRepository.findAll();
            log.info("Found {} candidates in database", candidates.size());
            
            List<CandidateDto> candidateDtos = candidates.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            
            log.info("Converted {} candidates to DTOs", candidateDtos.size());
            return candidateDtos;
        } catch (Exception e) {
            log.error("Error getting all candidates", e);
            throw e;
        }
    }

    private CandidateDto toDto(Candidate candidate) {
        return CandidateDto.builder()
                .id(candidate.getId())
                .email(candidate.getEmail())
                .firstName(candidate.getFirstName())
                .lastName(candidate.getLastName())
                .phone(candidate.getPhone())
                .createdAt(candidate.getCreatedAt())
                .build();
    }
}
