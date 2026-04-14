package com.example.smart_assess.entity;

import com.example.smart_assess.enums.TestStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "generated_tests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Data
@Builder
public class GeneratedTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;

    @Column(unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private TestStatus status = TestStatus.DRAFT;

    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    private LocalDateTime deadline;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Champs de l'ancienne table test_sessions fusionnés ici
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "time_spent_minutes")
    @Builder.Default
    private Integer timeSpentMinutes = 0;

    @Column(name = "tab_switch_count")
    @Builder.Default
    private Integer tabSwitchCount = 0;

    @Column(name = "is_auto_submitted")
    @Builder.Default
    private boolean isAutoSubmitted = false;

    @JsonIgnoreProperties({"test"})
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TestQuestion> questions = new ArrayList<>();

    // Relation avec answers maintenue pour compatibilité mais plus utilisée principalement
    @JsonIgnoreProperties({"test"})
    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Answer> answers = new ArrayList<>();

    @JsonIgnoreProperties({"test"})
    @OneToOne(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EvaluationResult evaluationResult;
}
