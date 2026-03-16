package com.example.smart_assess.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CreateCandidatureRequest {
    @NotNull
    private Long candidateId;

    @NotNull
    private Long internshipPositionId;
}
