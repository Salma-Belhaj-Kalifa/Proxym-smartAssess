package com.example.smart_assess.controller;

import com.example.smart_assess.dto.EvaluationReportDto;
import com.example.smart_assess.entity.EvaluationReportEntity;
import com.example.smart_assess.service.EvaluationReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluation-reports")
@RequiredArgsConstructor
@Slf4j
public class EvaluationReportController {

    private final EvaluationReportService evaluationReportService;

    @GetMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<List<EvaluationReportDto>> getAllReports() {
        try {
            log.info("Getting all evaluation reports");
            List<EvaluationReportDto> reports = evaluationReportService.getAllReports();
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            log.error("Error retrieving all evaluation reports", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<EvaluationReportEntity> getReportById(@PathVariable Long id) {
        try {
            log.info("Getting evaluation report by id: {}", id);
            return evaluationReportService.getReportById(id)
                    .map(report -> {
                        // Debug logs pour voir les données récupérées
                        log.info("=== DEBUG BACKEND RÉCUPÉRATION RAPPORT ===");
                        log.info("Report ID: {}", report.getId());
                        log.info("fullReport: {}", report.getFullReport());
                        log.info("fullReport is null: {}", report.getFullReport() == null);
                        log.info("fullReport as text: {}", report.getFullReport() != null ? report.getFullReport().asText() : "null");
                        log.info("=== FIN DEBUG BACKEND ===");
                        return ResponseEntity.ok(report);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error retrieving evaluation report by id: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/candidature/{candidatureId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<List<EvaluationReportEntity>> getReportsByCandidature(@PathVariable Long candidatureId) {
        try {
            log.info("Getting reports for candidature: {}", candidatureId);
            List<EvaluationReportEntity> reports = evaluationReportService.getAllReportsByCandidatureId(candidatureId);
            return ResponseEntity.ok(reports);
        } catch (Exception e) {
            log.error("Error retrieving reports for candidature: {}", candidatureId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/candidature/{candidatureId}/latest")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<EvaluationReportEntity> getLatestReportByCandidature(@PathVariable Long candidatureId) {
        try {
            log.info("Getting latest report for candidature: {}", candidatureId);
            return evaluationReportService.getLatestReportByCandidatureId(candidatureId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error retrieving latest report for candidature: {}", candidatureId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        try {
            log.info("Deleting evaluation report: {}", id);
            evaluationReportService.deleteReport(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                log.warn("Evaluation report not found: {}", id);
                return ResponseEntity.notFound().build();
            }
            log.error("Error deleting evaluation report: {}", id, e);
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            log.error("Unexpected error deleting evaluation report: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
