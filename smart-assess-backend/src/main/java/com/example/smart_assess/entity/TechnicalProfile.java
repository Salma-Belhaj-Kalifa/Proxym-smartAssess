package com.example.smart_assess.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "technical_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class TechnicalProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cv_id", nullable = false)
    private CandidateCV cv;

    @Type(JsonType.class)
    @Column(name = "parsed_data", columnDefinition = "jsonb")
    private JsonNode parsedData;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
