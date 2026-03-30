package com.example.smart_assess.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;  // ✅ Ajouté

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateCandidatureRequest {
    @NotNull
    private Long candidateId;

    // Ancienne propriété pour compatibilité (optionnelle si positionIds est fourni)
    private Long internshipPositionId;
    
    // Nouvelle propriété pour plusieurs postes
    private List<Long> positionIds;  // ✅ Ajouté
}
