package com.example.smart_assess.dto;

import com.example.smart_assess.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateManagerRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    private String department;
    
    private Role role;
}
