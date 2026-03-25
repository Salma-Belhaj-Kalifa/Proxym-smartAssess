package com.example.smart_assess.service;

import com.example.smart_assess.dto.TechnicalProfileDto;
import com.example.smart_assess.entity.CandidateCV;
import com.example.smart_assess.entity.TechnicalProfile;
import com.example.smart_assess.repository.CandidateCVRepository;
import com.example.smart_assess.repository.TechnicalProfileRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TechnicalProfileService {

    private final TechnicalProfileRepository technicalProfileRepository;
    private final CandidateCVRepository candidateCVRepository;
    private final ObjectMapper objectMapper;

    public Optional<TechnicalProfile> findByCvId(Long cvId) {
        log.info("Finding technical profile by CV ID: {}", cvId);
        return technicalProfileRepository.findByCv_Id(cvId);
    }

    public TechnicalProfile save(TechnicalProfile technicalProfile) {
        log.info("Saving technical profile for CV ID: {}", technicalProfile.getCv().getId());
        return technicalProfileRepository.save(technicalProfile);
    }

    public TechnicalProfile getByCvId(Long cvId) {
        log.info("Getting technical profile by CV ID: {}", cvId);
        Optional<TechnicalProfile> profile = technicalProfileRepository.findByCv_Id(cvId);
        return profile.orElse(null);
    }

    public TechnicalProfile getByCandidateId(Long candidateId) {
        log.info("Getting technical profile by candidate ID: {}", candidateId);
        return technicalProfileRepository.findByCv_Candidate_Id(candidateId);
    }

    public List<TechnicalProfile> getAll() {
        log.info("Getting all technical profiles");
        return technicalProfileRepository.findAll();
    }

    public void deleteById(Long id) {
        log.info("Deleting technical profile by ID: {}", id);
        technicalProfileRepository.deleteById(id);
    }

    public TechnicalProfile update(Long id, TechnicalProfile technicalProfile) {
        log.info("Updating technical profile ID: {}", id);
        technicalProfile.setId(id);
        return technicalProfileRepository.save(technicalProfile);
    }

    // New methods for controller
    public List<TechnicalProfileDto> getAllTechnicalProfiles() {
        log.info("Getting all technical profiles as DTOs");
        return getAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Optional<TechnicalProfileDto> getTechnicalProfileById(Long id) {
        log.info("Getting technical profile by ID as DTO: {}", id);
        return technicalProfileRepository.findById(id)
                .map(this::convertToDto);
    }

    public Optional<TechnicalProfile> findByCandidateId(Long candidateId) {
        log.info("Finding technical profile by candidate ID: {}", candidateId);
        TechnicalProfile profile = technicalProfileRepository.findByCv_Candidate_Id(candidateId);
        return profile != null ? Optional.of(profile) : Optional.empty();
    }

    public void deleteTechnicalProfile(Long id) {
        log.info("Deleting technical profile: {}", id);
        deleteById(id);
    }

    public TechnicalProfileDto convertToDto(TechnicalProfile profile) {
        if (profile == null) return null;
        
        return TechnicalProfileDto.builder()
                .id(profile.getId())
                .cvId(profile.getCv() != null ? profile.getCv().getId() : null)
                .parsedData(profile.getParsedData())
                .createdAt(profile.getCreatedAt())
                .build();
    }

    public TechnicalProfileDto createTechnicalProfile(Long cvId, TechnicalProfileDto profileDto) {
        log.info("=== CREATE TECHNICAL PROFILE ===");
        log.info("CV ID: {}", cvId);
        log.info("Profile DTO received: {}", profileDto);
        
        if (profileDto == null) {
            log.error("Profile DTO is null!");
            throw new RuntimeException("Profile DTO cannot be null");
        }
        
        if (profileDto.getParsedData() == null) {
            log.error("Parsed data is null in DTO!");
            throw new RuntimeException("Parsed data cannot be null");
        }
        
        try {
            // Vérifier si un profil existe déjà pour ce CV
            Optional<TechnicalProfile> existingProfile = technicalProfileRepository.findByCv_Id(cvId);
            
            if (existingProfile.isPresent()) {
                log.info("Technical profile already exists for CV ID: {}, updating it", cvId);
                TechnicalProfile profile = existingProfile.get();
                profile.setParsedData(profileDto.getParsedData());
                profile = technicalProfileRepository.save(profile);
                log.info("Technical profile updated successfully with ID: {}", profile.getId());
                return convertToDto(profile);
            }
            
            // Récupérer le CV
            log.info("Looking for CV with ID: {}", cvId);
            CandidateCV cv = candidateCVRepository.findById(cvId)
                    .orElseThrow(() -> new RuntimeException("CV not found with ID: " + cvId));
            
            log.info("CV found: {}", cv.getId());
            log.info("CV file name: {}", cv.getFileName());
            log.info("CV file size: {} bytes", cv.getFileSizeBytes());
            log.info("CV candidate ID: {}", cv.getCandidate() != null ? cv.getCandidate().getId() : "null");
            log.info("Parsed data type: {}", profileDto.getParsedData().getClass().getSimpleName());
            
            // Créer le profil technique directement avec le JsonNode du DTO
            TechnicalProfile profile = TechnicalProfile.builder()
                    .cv(cv)
                    .parsedData(profileDto.getParsedData())
                    .build();
            
            log.info("Technical profile built successfully");
            
            // Sauvegarder
            profile = technicalProfileRepository.save(profile);
            
            log.info("Technical profile created successfully with ID: {}", profile.getId());
            return convertToDto(profile);
            
        } catch (Exception e) {
            log.error("Error creating technical profile for CV ID: {}", cvId, e);
            log.error("Error message: {}", e.getMessage());
            log.error("Error cause: {}", e.getCause() != null ? e.getCause().getMessage() : "null");
            log.error("Error type: {}", e.getClass().getSimpleName());
            
            // Log complet du stack trace pour debugging
            log.error("Stack trace:", e);
            
            throw new RuntimeException("Failed to create technical profile: " + e.getMessage(), e);
        }
    }

    public TechnicalProfileDto createTechnicalProfile(TechnicalProfileDto dto) {
        log.info("Creating technical profile for CV ID: {}", dto.getCvId());
        
        try {
            // Récupérer le CV
            CandidateCV cv = candidateCVRepository.findById(dto.getCvId())
                    .orElseThrow(() -> new RuntimeException("CV not found with ID: " + dto.getCvId()));
            
            // Créer le profil technique avec seulement les parsed data
            TechnicalProfile profile = TechnicalProfile.builder()
                    .cv(cv)
                    .parsedData(dto.getParsedData())
                    .build();
            
            // Sauvegarder
            profile = technicalProfileRepository.save(profile);
            
            log.info("Technical profile created successfully with ID: {}", profile.getId());
            return convertToDto(profile);
            
        } catch (Exception e) {
            log.error("Error creating technical profile", e);
            throw new RuntimeException("Failed to create technical profile: " + e.getMessage(), e);
        }
    }

    public TechnicalProfileDto createOrUpdateFromAnalysis(Long candidateId, Long cvId, Map<String, Object> analysisResult) {
        log.info("Creating/updating technical profile from analysis for candidateId: {}, cvId: {}", candidateId, cvId);
        
        try {
            // Récupérer le CV
            CandidateCV cv = candidateCVRepository.findById(cvId)
                    .orElseThrow(() -> new RuntimeException("CV not found with ID: " + cvId));
            
            // Vérifier si un profil existe déjà
            Optional<TechnicalProfile> existingProfile = findByCvId(cvId);
            
            TechnicalProfile profile;
            if (existingProfile.isPresent()) {
                // Mettre à jour le profil existant
                profile = existingProfile.get();
                log.info("Updating existing technical profile for CV ID: {}", cvId);
            } else {
                // Créer un nouveau profil
                profile = TechnicalProfile.builder()
                        .cv(cv)
                        .build();
                log.info("Creating new technical profile for CV ID: {}", cvId);
            }
            
            // Stocker uniquement le parsed_data (JSON de l'analyse)
            profile.setParsedData(convertToJsonNode(analysisResult));
            
            // Sauvegarder le profil
            profile = save(profile);
            
            log.info("Technical profile saved successfully with ID: {}", profile.getId());
            return convertToDto(profile);
            
        } catch (Exception e) {
            log.error("Error creating/updating technical profile from analysis", e);
            throw new RuntimeException("Failed to create/update technical profile: " + e.getMessage(), e);
        }
    }
    
    private JsonNode convertToJsonNode(Map<String, Object> map) {
        try {
            return objectMapper.valueToTree(map);
        } catch (Exception e) {
            log.error("Error converting Map to JsonNode", e);
            return objectMapper.createObjectNode();
        }
    }
}
