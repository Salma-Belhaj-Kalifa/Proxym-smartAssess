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
public class EvaluationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_session_id", nullable = false)
    private TestSession testSession;

    @Column(name = "test_score")
    private Double testScore;

    @Column(name = "cv_matching_score")
    private Double cvMatchingScore;

    @Column(name = "final_score")
    private Double finalScore;

    @Type(JsonType.class)
    @Column(name = "skill_scores", columnDefinition = "jsonb")
    private JsonNode skillScores;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String weaknesses;

    @Column(name = "ai_feedback", columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "evaluated_at")
    private LocalDateTime evaluatedAt;
}
