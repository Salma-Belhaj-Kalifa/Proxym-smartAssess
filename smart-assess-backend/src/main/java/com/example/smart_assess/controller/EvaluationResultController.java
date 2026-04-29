package com.example.smart_assess.controller;

import com.example.smart_assess.service.EvaluationResultService;
import com.example.smart_assess.service.EvaluationResultService.BestMatchDto;
import com.example.smart_assess.service.EvaluationResultService.MatchingScoreDto;
import com.example.smart_assess.entity.EvaluationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluation-results")
@RequiredArgsConstructor
@Slf4j
public class EvaluationResultController {

    private final EvaluationResultService evaluationResultService;

    @PostMapping("/candidate/{candidateId}/test/{testId}/matching")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<EvaluationResult> calculateMatching(
            @PathVariable Long candidateId,
            @PathVariable Long testId) {
        try {
            log.info("Calculating targeted matching for candidate: {} and test: {}", candidateId, testId);
            EvaluationResult result = evaluationResultService.calculateAndSaveMatching(candidateId, testId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error calculating matching for candidate: {} and test: {}", candidateId, testId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/candidate/{candidateId}/best-match")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN') or hasRole('CANDIDATE')")
    public ResponseEntity<BestMatchDto> getBestMatch(@PathVariable Long candidateId) {
        try {
            log.info("Retrieving best match for candidate: {}", candidateId);
            BestMatchDto bestMatch = evaluationResultService.getBestMatchForCandidate(candidateId)
                .orElse(null);
            
            if (bestMatch != null) {
                return ResponseEntity.ok(bestMatch);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error retrieving best match for candidate: {}", candidateId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/candidate/{candidateId}/all-matching")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN') or hasRole('CANDIDATE')")
    public ResponseEntity<List<MatchingScoreDto>> getAllMatchingScores(@PathVariable Long candidateId) {
        try {
            log.info("Retrieving all matching scores for candidate: {}", candidateId);
            List<MatchingScoreDto> scores = evaluationResultService.getAllMatchingScoresForCandidate(candidateId);
            return ResponseEntity.ok(scores);
        } catch (Exception e) {
            log.error("Error retrieving matching scores for candidate: {}", candidateId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/best-match")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<String> updateBestMatch(@RequestBody UpdateBestMatchRequest request) {
        try {
            log.info("Updating best match for candidate: {} with position: {}", 
                request.getCandidateId(), request.getBestMatchTitle());
            
            evaluationResultService.updateBestMatch(
                request.getCandidateId(),
                request.getBestMatchPositionId(),
                request.getBestMatchScore(),
                request.getBestMatchTitle(),
                request.getBestMatchDetails()
            );
            
            return ResponseEntity.ok("Best match updated successfully");
        } catch (Exception e) {
            log.error("Error updating best match for candidate: {}", request.getCandidateId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error updating best match: " + e.getMessage());
        }
    }

    @GetMapping("/test/{testId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN') or hasRole('CANDIDATE')")
    public ResponseEntity<EvaluationResult> getEvaluationResultByTestId(@PathVariable Long testId) {
        try {
            log.info("Retrieving evaluation result for test: {}", testId);
            return evaluationResultService.findByTestId(testId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error retrieving evaluation result for test: {}", testId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/candidate/{candidateId}/results")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN') or hasRole('CANDIDATE')")
    public ResponseEntity<List<EvaluationResult>> getEvaluationResultsByCandidateId(@PathVariable Long candidateId) {
        try {
            log.info("Retrieving evaluation results for candidate: {}", candidateId);
            List<EvaluationResult> results = evaluationResultService.findByCandidateIdOrderByMatchingCalculatedAtDesc(candidateId);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Error retrieving evaluation results for candidate: {}", candidateId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // DTO pour la mise à jour du best match
    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class UpdateBestMatchRequest {
        private Long candidateId;
        private Long bestMatchPositionId;
        private Double bestMatchScore;
        private String bestMatchTitle;
        private Map<String, Object> bestMatchDetails;
    }
}
