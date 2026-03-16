package com.example.smart_assess.entity;

import com.example.smart_assess.enums.CandidatureStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "candidatures")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class Candidature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internship_position_id", nullable = false)
    private InternshipPosition internshipPosition;

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

    @OneToOne(mappedBy = "candidature", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private GeneratedTest generatedTest;

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
