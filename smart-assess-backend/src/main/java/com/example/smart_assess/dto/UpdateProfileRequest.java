package com.example.smart_assess.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String department;
}
