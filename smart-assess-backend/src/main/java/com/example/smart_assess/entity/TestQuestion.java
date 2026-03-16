package com.example.smart_assess.entity;

import com.example.smart_assess.enums.QuestionType;
import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class TestQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private GeneratedTest test;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type")
    private QuestionType questionType;

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode options;

    @Column(name = "correct_answer")
    private String correctAnswer;

    @Column(name = "skill_tag")
    private String skillTag;

    @Column(name = "max_score")
    @Builder.Default
    private Double maxScore = 1.0;

    @Column(name = "order_index")
    private Integer orderIndex;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Answer> answers = new ArrayList<>();
}
