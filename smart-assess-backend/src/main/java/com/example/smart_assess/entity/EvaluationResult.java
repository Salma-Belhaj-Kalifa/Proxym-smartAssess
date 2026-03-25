package com.example.smart_assess.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "evaluation_results")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class EvaluationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private GeneratedTest test;

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
    private java.util.Map<String, SkillScore> skillScores = new java.util.HashMap<>();

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

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
