package com.example.smart_assess.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateCandidateProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
}
