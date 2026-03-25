package com.example.smart_assess.entity;

import com.example.smart_assess.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "managers")
@PrimaryKeyJoinColumn(name = "user_id")
@Getter @Setter @AllArgsConstructor @NoArgsConstructor
public class Manager extends User {

    private String department = "";

    @OneToMany(mappedBy = "createdBy", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InternshipPosition> internshipPositions = new ArrayList<>();
    
    // Builder personnalisé
    public static class ManagerBuilder {
        private String email;
        private String password;
        private String firstName;
        private String lastName;
        private Role role;
        private String department = "";
        
        public ManagerBuilder email(String email) {
            this.email = email;
            return this;
        }
        
        public ManagerBuilder password(String password) {
            this.password = password;
            return this;
        }
        
        public ManagerBuilder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }
        
        public ManagerBuilder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }
        
        public ManagerBuilder role(Role role) {
            this.role = role;
            return this;
        }
        
        public ManagerBuilder department(String department) {
            this.department = department;
            return this;
        }
        
        public Manager build() {
            Manager manager = new Manager();
            // Hériter de la classe User avec les bonnes méthodes
            manager.setEmail(email);
            manager.setPassword(password);
            manager.setFirstName(firstName);
            manager.setLastName(lastName);
            manager.setRole(role);
            manager.setCreatedAt(LocalDateTime.now());
            manager.department = this.department;
            manager.internshipPositions = new ArrayList<>();
            return manager;
        }
    }
    
    public static ManagerBuilder builder() {
        return new ManagerBuilder();
    }
}
