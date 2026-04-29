package com.example.smart_assess.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessCandidateRequest {
    private Long candidate_id;
    private List<String> skills;
    
    @JsonProperty("summary")
    private String summary;
    
    private Integer yearsOfExperience;
}
