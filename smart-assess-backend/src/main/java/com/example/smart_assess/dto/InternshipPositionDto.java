package com.example.smart_assess.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class InternshipPositionDto {
    private Long id;
    private String title;
    private String description;
    private String company;
    private List<String> requiredSkills;
    private List<String> acceptedDomains;
    private boolean isActive;
    private Long createdBy;
    private String createdByEmail;
    private LocalDateTime createdAt;
}
