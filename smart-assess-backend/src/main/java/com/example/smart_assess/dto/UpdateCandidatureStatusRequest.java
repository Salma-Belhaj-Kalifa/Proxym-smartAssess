package com.example.smart_assess.dto;

import com.example.smart_assess.enums.CandidatureStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UpdateCandidatureStatusRequest {
    @NotNull
    private CandidatureStatus status;

    private String rejectionReason;
}
