package com.example.smart_assess.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "evaluation_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class EvaluationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.REMOVE)
    @JoinColumn(name = "test_id", nullable = false)
    private GeneratedTest test;

    // CHAMPS TECHNIQUES EXISTANTS
    @Column(name = "total_score")
    @Builder.Default
    private Integer totalScore = 0;

    @Column(name = "max_score")
    @Builder.Default
    private Integer maxScore = 0;

    @Column(name = "final_score")
    @Builder.Default
    private Double finalScore = 0.0;

    @Column(name = "total_questions")
    @Builder.Default
    private Integer totalQuestions = 0;

    @Column(name = "correct_answers")
    @Builder.Default
    private Integer correctAnswers = 0;

    @ElementCollection
    @CollectionTable(name = "skill_scores", joinColumns = @JoinColumn(name = "evaluation_result_id"))
    @MapKeyColumn(name = "skill_tag")
    @Builder.Default
    private Map<String, SkillScore> skillScores = new HashMap<>();

    // NOUVEAUX CHAMPS POUR MATCHING CIBLÉ
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    @JsonIgnoreProperties({"evaluationReports", "internshipPositions"})
    private Candidate candidate;

    @ElementCollection
    @CollectionTable(name = "matching_scores", joinColumns = @JoinColumn(name = "evaluation_result_id"))
    @MapKeyColumn(name = "position_id")
    @Builder.Default
    private Map<Long, MatchingScore> matchingScores = new HashMap<>();

    @Column(name = "best_match_position_id")
    private Long bestMatchPositionId;

    @Column(name = "best_match_score")
    private Double bestMatchScore;

    @Column(name = "best_match_title", length = 255)
    private String bestMatchTitle;

    @Column(name = "average_matching_score")
    private Double averageMatchingScore;


    @Type(JsonType.class)
    @Column(name = "matching_details", columnDefinition = "jsonb")
    private JsonNode matchingDetails;

    @Column(name = "matching_calculated_at")
    private LocalDateTime matchingCalculatedAt;

    // SCORE COMPOSITE GLOBAL (40% test + 30% fit + 30% CV)
    @Column(name = "composite_score")
    private Double compositeScore;

    @Column(name = "composite_calculated_at")
    private LocalDateTime compositeCalculatedAt;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // EMBEDDED CLASS POUR MATCHING SCORE
    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class MatchingScore {
        @Column(name = "position_id", insertable = false, updatable = false)
        private Long positionId;

        @Column(name = "position_title")
        private String positionTitle;

        @Column(name = "profile_similarity")
        private Double profileSimilarity;

        @Column(name = "skills_similarity")
        private Double skillsSimilarity;

        @Column(name = "technical_score")
        private Double technicalScore;

        @Column(name = "composite_score")
        private Double compositeScore;

        @Column(name = "recommendation")
        private String recommendation;
    }

    // EMBEDDED CLASS POUR SKILL SCORE (EXISTANTE)
    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class SkillScore {
        @Column(name = "correct")
        @Builder.Default
        private Integer correct = 0;

        @Column(name = "total")
        @Builder.Default
        private Integer total = 0;
    }
}
