package com.example.smart_assess.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class EvaluationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidature_id", nullable = false)
    private Candidature candidature;

    // Données principales du rapport IA
    @Column(name = "candidate_name")
    private String candidateName;

    @Column(name = "candidate_email")
    private String candidateEmail;

    @Column(name = "experience_level")
    private String experienceLevel;

    @Column(name = "years_of_experience")
    private Integer yearsOfExperience;

    @Column(name = "primary_domain")
    private String primaryDomain;

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "applied_position_match")
    private Double appliedPositionMatch;

    @Column(name = "recommendation")
    private String recommendation;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "composite_score")
    private Double compositeScore;

    @Column(name = "collaboration_score")
    private Double collaborationScore;

    @Column(name = "leadership_potential")
    private String leadershipPotential;

    @Column(name = "adaptability_score")
    private Double adaptabilityScore;

    // Stockage du rapport complet en JSON
    @Type(JsonType.class)
    @Column(name = "full_report", columnDefinition = "jsonb")
    private JsonNode fullReport;

    @Column(name = "generated_at", updatable = false)
    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();
}
