package com.example.smart_assess.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class HRDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String department;
    private LocalDateTime createdAt;
    private boolean isActive;
}
