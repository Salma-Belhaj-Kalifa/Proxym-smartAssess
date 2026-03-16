package com.example.smart_assess.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hrs")
@PrimaryKeyJoinColumn(name = "user_id")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HR extends User {

    private String department;
}
