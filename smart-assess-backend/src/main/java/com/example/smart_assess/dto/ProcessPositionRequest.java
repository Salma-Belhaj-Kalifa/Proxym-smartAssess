package com.example.smart_assess.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessPositionRequest {
    private Long position_id;
    private String title;
    private String description;
    private String requirements;
    
    @JsonProperty("required_skills")
    private List<String> requiredSkills;
}
