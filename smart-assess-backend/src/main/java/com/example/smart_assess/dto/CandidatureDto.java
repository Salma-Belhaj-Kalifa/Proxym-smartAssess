package com.example.smart_assess.dto;

import com.example.smart_assess.enums.CandidatureStatus;
import lombok.*;

import java.time.LocalDateTime;

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
}
