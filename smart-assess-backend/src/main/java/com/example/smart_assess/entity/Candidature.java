package com.example.smart_assess.entity;

import com.example.smart_assess.enums.CandidatureStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "candidatures")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Candidature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    @JsonIgnore
    private Candidate candidate;

    // MODIFIÉ: Plusieurs postes par candidature
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "candidature_positions",
        joinColumns = @JoinColumn(name = "candidature_id"),
        inverseJoinColumns = @JoinColumn(name = "position_id")
    )
    @JsonIgnore
    private Set<InternshipPosition> internshipPositions = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CandidatureStatus status = CandidatureStatus.PENDING;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "applied_at", updatable = false)
    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Méthodes utilitaires pour la compatibilité
    public Long getCandidateId() {
        return candidate != null ? candidate.getId() : null;
    }
    
    public String getPositionTitle() {
        return internshipPositions != null && !internshipPositions.isEmpty() 
            ? internshipPositions.iterator().next().getTitle()
            : "Poste non spécifié";
    }
    
    public String getPositionCompany() {
        return internshipPositions != null && !internshipPositions.isEmpty() 
            ? internshipPositions.iterator().next().getCompany()
            : "Entreprise";
    }
    
    public Long getInternshipPositionId() {
        return internshipPositions != null && !internshipPositions.isEmpty() 
            ? internshipPositions.iterator().next().getId()
            : null;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
