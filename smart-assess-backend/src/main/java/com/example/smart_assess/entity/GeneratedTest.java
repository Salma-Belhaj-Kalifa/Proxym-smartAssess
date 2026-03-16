package com.example.smart_assess.entity;

import com.example.smart_assess.enums.TestStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "generated_tests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class GeneratedTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidature_id", nullable = false)
    private Candidature candidature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internship_position_id", nullable = false)
    private InternshipPosition internshipPosition;

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

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TestQuestion> questions = new ArrayList<>();

    @OneToOne(mappedBy = "test", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private TestSession testSession;
}
