package com.example.smart_assess.dto;

import lombok.Data;
import java.util.List;

@Data
public class PositionRequirementsDto {
    private String title;
    private List<String> requiredSkills;
    private String experienceLevel;
    private String domain;
    private List<String> keyRequirements;
    private String description;
}
