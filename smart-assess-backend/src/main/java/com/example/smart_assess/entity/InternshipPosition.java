package com.example.smart_assess.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "internship_positions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class InternshipPosition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "company")
    private String company;

    @Type(JsonType.class)
    @Column(name = "required_skills", columnDefinition = "jsonb")
    private List<String> requiredSkills;

    @Type(JsonType.class)
    @Column(name = "accepted_domains", columnDefinition = "jsonb")
    private List<String> acceptedDomains;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Manager createdBy;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "internshipPosition", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Candidature> candidatures = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters et setters manuels pour isActive
    public Boolean getActive() {
        return isActive;
    }
    
    public void setActive(Boolean active) {
        isActive = active;
    }
}
