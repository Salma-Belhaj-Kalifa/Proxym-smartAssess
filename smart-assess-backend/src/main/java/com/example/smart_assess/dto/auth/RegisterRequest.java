package com.example.smart_assess.dto.auth;

import com.example.smart_assess.enums.Role;
import com.example.smart_assess.validation.ValidTunisianPhone;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Pattern(
        regexp = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$",
        message = "Email must contain a valid domain (example: name@gmail.com)"
    )
    private String email;
    //@NotBlank(message = "Password is required")
    //@Pattern(
       // regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
        //message = "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
    //)
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
    
    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;
    
    @NotBlank(message = "Phone number is required")
    @ValidTunisianPhone
    private String phone;
    
    private Role role = Role.CANDIDATE;
}
