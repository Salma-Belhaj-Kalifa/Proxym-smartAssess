package com.example.smart_assess.dto;

import lombok.*;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String department;
}
