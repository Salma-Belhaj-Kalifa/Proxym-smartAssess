package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateCandidatureRequest;
import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.UpdateCandidatureStatusRequest;
import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.enums.CandidatureStatus;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.repository.InternshipPositionRepository;
import com.example.smart_assess.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidatureServiceImpl implements CandidatureService {

    private final CandidatureRepository candidatureRepository;
    private final CandidateRepository candidateRepository;
    private final InternshipPositionRepository positionRepository;

    @Override
    public CandidatureDto createCandidature(CreateCandidatureRequest request) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        InternshipPosition position = positionRepository.findById(request.getInternshipPositionId())
                .orElseThrow(() -> new RuntimeException("Position not found"));

        if (candidatureRepository.findByCandidate_IdAndInternshipPosition_Id(request.getCandidateId(), request.getInternshipPositionId()).isPresent()) {
            throw new RuntimeException("Candidature already exists");
        }

        Candidature candidature = Candidature.builder()
                .candidate(candidate)
                .internshipPosition(position)
                .status(CandidatureStatus.PENDING)
                .build();

        candidature = candidatureRepository.save(candidature);
        return toDto(candidature);
    }

    @Override
    public CandidatureDto updateStatus(Long id, UpdateCandidatureStatusRequest request) {
        log.info("=== UPDATE STATUS IN SERVICE ===");
        log.info("Candidature ID: {}", id);
        log.info("Request status: {}", request.getStatus());
        log.info("Request rejection reason: {}", request.getRejectionReason());
        
        try {
            Candidature candidature = candidatureRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Candidature not found"));

            log.info("Found candidature: {}", candidature.getId());
            log.info("Current status: {}", candidature.getStatus());
            log.info("Candidature entity before save: {}", candidature);

            candidature.setStatus(request.getStatus());
            candidature.setRejectionReason(request.getRejectionReason());
            
            log.info("Setting new status: {}", request.getStatus());
            log.info("Setting rejection reason: {}", request.getRejectionReason());
            log.info("Candidature entity after status update: {}", candidature);

            candidature = candidatureRepository.save(candidature);
            
            log.info("Candidature saved successfully");
            log.info("Saved candidature ID: {}", candidature.getId());
            log.info("Saved candidature status: {}", candidature.getStatus());
            log.info("Saved candidature rejection reason: {}", candidature.getRejectionReason());
            
            return toDto(candidature);
        } catch (Exception e) {
            log.error("Error updating candidature status: {}", id, e);
            log.error("Error details: {}", e.getMessage());
            log.error("Error stack trace:", e);
            throw e;
        }
    }

    @Override
    public void deleteCandidature(Long id) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature not found"));
        candidatureRepository.delete(candidature);
    }

    @Override
    public CandidatureDto getCandidatureById(Long id) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature not found"));
        return toDto(candidature);
    }

    @Override
    public List<CandidatureDto> getCandidaturesByCandidate(Long candidateId) {
        log.info("=== GET CANDIDATURES BY CANDIDATE WITH IA DATA ===");
        log.info("Candidate ID: {}", candidateId);
        
        List<Candidature> candidatures = candidatureRepository.findByCandidate_IdWithRelations(candidateId);
        List<CandidatureDto> result = candidatures.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        
        log.info("Returning {} candidatures with IA data for candidate {}", result.size(), candidateId);
        return result;
    }

    @Override
    public List<CandidatureDto> getCandidaturesByPosition(Long positionId) {
        return candidatureRepository.findByInternshipPosition_Id(positionId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CandidatureDto> getCandidaturesByStatus(CandidatureStatus status) {
        return candidatureRepository.findByStatus(status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CandidatureDto> getAllCandidatures() {
        return candidatureRepository.findAllWithRelations().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private CandidatureDto toDto(Candidature candidature) {
        log.info("=== CONVERTING CANDIDATURE TO DTO WITH IA DATA ===");
        log.info("Candidature ID: {}", candidature.getId());
        log.info("Candidate ID: {}", candidature.getCandidate() != null ? candidature.getCandidate().getId() : null);
        
        CandidatureDto.CandidatureDtoBuilder dtoBuilder = CandidatureDto.builder()
                .id(candidature.getId())
                .candidateId(candidature.getCandidate() != null ? candidature.getCandidate().getId() : null)
                .candidateFirstName(candidature.getCandidate() != null ? candidature.getCandidate().getFirstName() : null)
                .candidateLastName(candidature.getCandidate() != null ? candidature.getCandidate().getLastName() : null)
                .candidateEmail(candidature.getCandidate() != null ? candidature.getCandidate().getEmail() : null)
                .candidatePhone(candidature.getCandidate() != null ? candidature.getCandidate().getPhone() : null)
                .internshipPositionId(candidature.getInternshipPosition() != null ? candidature.getInternshipPosition().getId() : null)
                .positionTitle(candidature.getInternshipPosition() != null ? candidature.getInternshipPosition().getTitle() : null)
                .positionCompany(candidature.getInternshipPosition() != null ? candidature.getInternshipPosition().getCompany() : null)
                .positionDescription(candidature.getInternshipPosition() != null ? candidature.getInternshipPosition().getDescription() : null)
                .status(candidature.getStatus())
                .rejectionReason(candidature.getRejectionReason())
                .appliedAt(candidature.getAppliedAt())
                .updatedAt(candidature.getUpdatedAt());

        // Récupérer les données IA depuis les tables candidate_cvs et technical_profiles
        try {
            Long candidateId = candidature.getCandidate() != null ? candidature.getCandidate().getId() : null;
            if (candidateId != null) {
                log.info("Loading IA data for candidate {}", candidateId);
                
                // Charger les données CV avec file_data (IA analysées)
                List<CandidatureDto.CandidateCVDto> candidateCVs = loadCandidateCVs(candidateId);
                dtoBuilder.candidateCVs(candidateCVs);
                
                // Charger les technical profiles avec parsed_data (IA analysées)  
                List<CandidatureDto.TechnicalProfileDto> technicalProfiles = loadTechnicalProfiles(candidateId);
                dtoBuilder.technicalProfiles(technicalProfiles);
                
                log.info("Loaded {} CVs and {} technical profiles for candidate {}", 
                    candidateCVs.size(), technicalProfiles.size(), candidateId);
            }
        } catch (Exception e) {
            log.error("Error loading IA data for candidature {}: {}", candidature.getId(), e.getMessage());
            // Ne pas échouer la conversion si les données IA ne peuvent pas être chargées
        }
        
        CandidatureDto result = dtoBuilder.build();
        log.info("=== CANDIDATURE DTO CREATED WITH IA DATA ===");
        log.info("DTO has {} CVs and {} technical profiles", 
            result.getCandidateCVs() != null ? result.getCandidateCVs().size() : 0,
            result.getTechnicalProfiles() != null ? result.getTechnicalProfiles().size() : 0);
        
        return result;
    }
    
    // Méthode pour charger les CVs avec données IA
    private List<CandidatureDto.CandidateCVDto> loadCandidateCVs(Long candidateId) {
        try {
            // Utiliser une requête native pour récupérer les CVs avec file_data
            List<Object[]> cvData = candidatureRepository.findCandidateCVsWithData(candidateId);
            
            return cvData.stream()
                .map(row -> CandidatureDto.CandidateCVDto.builder()
                    .id(row[0] != null ? ((Number) row[0]).longValue() : null)
                    .candidateId(candidateId)
                    .fileName((String) row[1])
                    .fileSizeBytes(row[2] != null ? ((Number) row[2]).longValue() : null)
                    .parsingStatus((String) row[3])
                    .uploadDate(parseDatabaseDateTime(row[4])) // Utiliser le parsing correct
                    .fileData(parseJsonToMap(convertByteArrayToString(row[5]))) // Convertir les bytes en String
                    .build())
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error loading candidate CVs for candidate {}: {}", candidateId, e.getMessage());
            return List.of();
        }
    }
    
    // Méthode pour charger les technical profiles avec données IA
    private List<CandidatureDto.TechnicalProfileDto> loadTechnicalProfiles(Long candidateId) {
        try {
            // Utiliser une requête native pour récupérer les technical profiles avec parsed_data
            List<Object[]> profileData = candidatureRepository.findTechnicalProfilesWithData(candidateId);
            
            return profileData.stream()
                .map(row -> CandidatureDto.TechnicalProfileDto.builder()
                    .id(row[0] != null ? ((Number) row[0]).longValue() : null)
                    .cvId(row[1] != null ? ((Number) row[1]).longValue() : null)
                    .createdAt(parseDatabaseDateTime(row[2])) // Utiliser le parsing correct
                    .parsedData(parseJsonToMap(convertByteArrayToString(row[3]))) // Convertir les bytes en String
                    .build())
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error loading technical profiles for candidate {}: {}", candidateId, e.getMessage());
            return List.of();
        }
    }
    
    // Méthode utilitaire pour convertir les bytes en String
    private String convertByteArrayToString(Object data) {
        if (data == null) {
            return null;
        }
        
        try {
            if (data instanceof byte[]) {
                byte[] bytes = (byte[]) data;
                
                // Détecter si c'est du binaire (PDF, ZIP, etc.) ou du texte
                if (isBinaryData(bytes)) {
                    log.warn("Binary data detected ({} bytes), skipping JSON parsing", bytes.length);
                    return null; // Ignorer les données binaires
                }
                
                // Convertir les bytes en String (UTF-8)
                return new String(bytes, "UTF-8");
            } else if (data instanceof String) {
                return (String) data;
            } else {
                // Convertir n'importe quel autre type en String
                return data.toString();
            }
        } catch (Exception e) {
            log.error("Error converting byte array to string: {}", data, e);
            return null; // Retourner null en cas d'erreur
        }
    }
    
    // Méthode pour détecter si les données sont binaires
    private boolean isBinaryData(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return false;
        }
        
        // Vérifier les premiers octets pour détecter les signatures binaires communes
        if (bytes.length >= 4) {
            // PDF: %PDF
            if (bytes[0] == '%' && bytes[1] == 'P' && bytes[2] == 'D' && bytes[3] == 'F') {
                return true;
            }
            // ZIP: PK
            if (bytes[0] == 'P' && bytes[1] == 'K') {
                return true;
            }
        }
        
        // Compter les caractères non-imprimables dans les premiers 100 octets
        int nonPrintableCount = 0;
        int checkLength = Math.min(bytes.length, 100);
        
        for (int i = 0; i < checkLength; i++) {
            byte b = bytes[i];
            // Caractères imprimables ASCII: 32-126
            if (b < 32 || b > 126) {
                nonPrintableCount++;
            }
        }
        
        // Si plus de 30% sont non-imprimables, c'est probablement du binaire
        return (nonPrintableCount * 100 / checkLength) > 30;
    }
    
    // Méthode utilitaire pour parser les dates de la base de données
    private java.time.LocalDateTime parseDatabaseDateTime(Object dateTimeObj) {
        if (dateTimeObj == null) {
            return null;
        }
        
        try {
            String dateTimeStr = dateTimeObj.toString();
            
            // Format de la base de données: 2026-03-24 17:29:00.466006 ou 2026-03-24 17:29:00
            if (dateTimeStr.length() > 19) {
                // Enlever les microsecondes pour le parsing
                dateTimeStr = dateTimeStr.substring(0, 19);
            }
            
            // Parser avec le format ISO standard: YYYY-MM-DD HH:mm:ss
            return java.time.LocalDateTime.parse(dateTimeStr.replace(' ', 'T'));
        } catch (Exception e) {
            log.error("Error parsing database date time: {}", dateTimeObj, e);
            return java.time.LocalDateTime.now(); // Fallback à maintenant
        }
    }
    
    // Méthode utilitaire pour parser JSON en Map
    private java.util.Map<String, Object> parseJsonToMap(String json) {
        if (json == null || json.trim().isEmpty()) {
            return new java.util.HashMap<>();
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(json, java.util.Map.class);
        } catch (Exception e) {
            log.error("Error parsing JSON to Map: {}", e.getMessage());
            // Créer une map vide au lieu de retourner une erreur
            return new java.util.HashMap<>();
        }
    }
}
