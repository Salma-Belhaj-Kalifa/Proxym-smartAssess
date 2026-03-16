package com.example.smart_assess.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TechnicalProfileDto {
    private Long id;
    private Long candidateId;
    private Long cvId;
    private JsonNode parsedData;
    private LocalDateTime createdAt;
    
    // Setters pour le controller
    public void setId(Long id) {
        this.id = id;
    }
    
    public void setCandidateId(Long candidateId) {
        this.candidateId = candidateId;
    }
    
    public void setCvId(Long cvId) {
        this.cvId = cvId;
    }
    
    public void setParsedData(JsonNode parsedData) {
        this.parsedData = parsedData;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
