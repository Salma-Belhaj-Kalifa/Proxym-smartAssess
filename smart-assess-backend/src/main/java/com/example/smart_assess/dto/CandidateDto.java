package com.example.smart_assess.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class CandidateDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private LocalDateTime createdAt;
}
