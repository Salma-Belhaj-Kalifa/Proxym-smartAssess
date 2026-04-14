package com.example.smart_assess.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EvaluationReportDto {
    
    private Long id;
    
    private Long candidatureId;
    
    private Long testId;
    
    private String candidateFirstName;
    
    private String candidateLastName;
    
    private String candidateEmail;
    
    private String positionTitle;
    
    private String positionCompany;
    
    private String candidatureStatus;
    
    private JsonNode fullReport;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime generatedAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // AI Score extrait du full_report
    private Double aiScore;
    
    // Statut du test lié
    private String testStatus;
}
