package com.example.smart_assess.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_reports")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class EvaluationReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"evaluationReports", "internshipPositions", "candidate"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidature_id", nullable = false)
    private Candidature candidature;

    @JsonIgnoreProperties({"evaluationReports", "questions", "answers", "evaluationResult"})
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.REMOVE)
    @JoinColumn(name = "test_id", nullable = true)
    private GeneratedTest test;

    @Type(JsonType.class)
    @Column(name = "full_report", columnDefinition = "jsonb", nullable = false)
    private JsonNode fullReport;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
