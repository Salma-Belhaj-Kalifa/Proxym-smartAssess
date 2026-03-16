package com.example.smart_assess.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TogglePositionStatusRequest {
    @NotNull
    private Boolean isActive;
}
