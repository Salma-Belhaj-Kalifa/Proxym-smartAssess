package com.example.smart_assess.dto;

import com.example.smart_assess.enums.CandidatureStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class CandidatureDto {
    private Long id;
    private Long candidateId;
    private String candidateFirstName;
    private String candidateLastName;
    private String candidateEmail;
    private String candidatePhone;
    private Long internshipPositionId;
    private String positionTitle;
    private String positionCompany;
    private String positionDescription;
    private CandidatureStatus status;
    private String rejectionReason;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
    
    // Ajouter les champs pour les données IA analysées
    private List<CandidateCVDto> candidateCVs;
    private List<TechnicalProfileDto> technicalProfiles;
    
    // DTOs imbriqués pour les données IA
    @Data
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class CandidateCVDto {
        private Long id;
        private Long candidateId;
        private String fileName;
        private Long fileSizeBytes;
        private String parsingStatus;
        private LocalDateTime uploadDate;
        private Map<String, Object> fileData; // Données IA analysées
    }
    
    @Data
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class TechnicalProfileDto {
        private Long id;
        private Long cvId;
        private LocalDateTime createdAt;
        private Map<String, Object> parsedData; // Données IA analysées
    }
}
