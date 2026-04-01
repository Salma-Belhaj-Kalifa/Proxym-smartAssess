package com.example.smart_assess.dto;

import com.example.smart_assess.validation.ValidTunisianPhone;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    
    @NotBlank(message = "Le numéro de téléphone est requis")
    @ValidTunisianPhone
    private String phone;
    
    private String department;
}
