package com.example.smart_assess.dto;

import com.example.smart_assess.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class UserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String department;
    private String phone;
    private Role role;
    private LocalDateTime createdAt;
}
