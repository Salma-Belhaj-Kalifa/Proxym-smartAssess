package com.example.smart_assess.dto;

import com.example.smart_assess.enums.Role;
import com.example.smart_assess.validation.ValidTunisianPhone;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateCandidateRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @NotBlank(message = "Le numéro de téléphone est requis")
    @ValidTunisianPhone
    private String phone;
    
    private Role role = Role.CANDIDATE;
}
