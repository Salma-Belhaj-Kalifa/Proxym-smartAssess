package com.example.smart_assess.dto;

import lombok.Data;
import java.util.List;

@Data
public class MatchingResultDto {
    private PositionAnalysisDto positionAnalysis;
    private List<CandidateRankingDto> candidateRankings;
    private MatchingInsightsDto matchingInsights;
    
    @Data
    public static class PositionAnalysisDto {
        private String title;
        private List<String> requiredSkills;
        private String experienceLevel;
        private String domain;
        private List<String> keyRequirements;
    }
    
    @Data
    public static class CandidateRankingDto {
        private Integer rank;
        private String candidateId;
        private String candidateName;
        private Double matchScore;
        private Double technicalMatch;
        private Double experienceMatch;
        private Double domainMatch;
        private Double potentialScore;
        private List<String> strengths;
        private List<String> gaps;
        private List<String> risks;
        private String recommendation;
        private String interviewPriority;
        private String reasoning;
    }
    
    @Data
    public static class MatchingInsightsDto {
        private Integer totalCandidates;
        private Integer strongMatches;
        private Integer moderateMatches;
        private Integer weakMatches;
        private List<String> keyTrends;
        private List<String> recommendations;
    }
}
