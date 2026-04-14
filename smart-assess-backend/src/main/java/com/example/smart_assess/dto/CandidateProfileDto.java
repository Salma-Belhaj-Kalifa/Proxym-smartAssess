package com.example.smart_assess.dto;

import lombok.Data;
import java.util.Map;

@Data
public class CandidateProfileDto {
    private String id;
    private String name;
    private String email;
    private Map<String, Object> technicalInformation;
    private Map<String, Object> summary;
    private Map<String, Object> basicInformation;
}
