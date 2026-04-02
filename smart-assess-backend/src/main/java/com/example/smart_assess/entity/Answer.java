package com.example.smart_assess.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "answers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private TestQuestion question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private GeneratedTest test; // Gardé pour référence mais plus obligatoire

    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "selected_option")
    private String selectedOption;

    @Column(name = "is_correct")
    @Builder.Default
    private Boolean isCorrect = null;

    @Column(name = "score_obtained")
    @Builder.Default
    private Double scoreObtained = 0.0;

    @Column(name = "max_score")
    @Builder.Default
    private Double maxScore = 1.0;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
