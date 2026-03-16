package com.example.smart_assess.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateInternshipPositionRequest {
    @NotBlank
    private String title;

    private String description;

    private String company;

    private List<String> requiredSkills;

    private List<String> acceptedDomains;

    @Builder.Default
    private Boolean isActive = true;

    // Plus besoin de createdBy, il sera récupéré depuis l'authentification
}
