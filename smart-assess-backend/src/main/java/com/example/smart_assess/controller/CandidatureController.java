package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateCandidatureRequest;
import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.UpdateCandidatureStatusRequest;
import com.example.smart_assess.enums.CandidatureStatus;
import com.example.smart_assess.service.CandidatureService;
import com.example.smart_assess.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidatures")
@RequiredArgsConstructor
@Slf4j
public class CandidatureController {

    private final CandidatureService candidatureService;
    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<CandidatureDto> createCandidature(@Valid @RequestBody CreateCandidatureRequest request) {
        CandidatureDto candidature = candidatureService.createCandidature(request);
        
        return ResponseEntity.ok(candidature);
    }

    @GetMapping
    public ResponseEntity<List<CandidatureDto>> getAllCandidatures() {
        return ResponseEntity.ok(candidatureService.getAllCandidatures());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidatureDto> getCandidatureById(@PathVariable Long id) {
        log.info("=== GET CANDIDATURE BY ID CALLED ===");
        log.info("Requested candidature ID: {}", id);
        
        try {
            CandidatureDto candidature = candidatureService.getCandidatureById(id);
            log.info("Candidature found: {}", candidature != null ? "YES" : "NO");
            if (candidature != null) {
                log.info("Candidature details - ID: {}, Candidate: {} {}, Status: {}", 
                    candidature.getId(), 
                    candidature.getCandidateFirstName(),
                    candidature.getCandidateLastName(),
                    candidature.getStatus());
            }
            return ResponseEntity.ok(candidature);
        } catch (Exception e) {
            log.error("Error getting candidature by ID: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<CandidatureDto>> getCandidaturesByCandidate(@PathVariable Long candidateId) {
        log.info("=== GET CANDIDATURES BY CANDIDATE CALLED ===");
        log.info("Candidate ID: {}", candidateId);
        try {
            List<CandidatureDto> candidatures = candidatureService.getCandidaturesByCandidate(candidateId);
            log.info("Successfully retrieved {} candidatures for candidate {}", candidatures.size(), candidateId);
            return ResponseEntity.ok(candidatures);
        } catch (Exception e) {
            log.error("Error getting candidatures for candidate {}", candidateId, e);
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/position/{positionId}")
    public ResponseEntity<List<CandidatureDto>> getCandidaturesByPosition(@PathVariable Long positionId) {
        return ResponseEntity.ok(candidatureService.getCandidaturesByPosition(positionId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<CandidatureDto>> getCandidaturesByStatus(@PathVariable CandidatureStatus status) {
        return ResponseEntity.ok(candidatureService.getCandidaturesByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<CandidatureDto> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateCandidatureStatusRequest request) {
        log.info("=== UPDATE CANDIDATURE STATUS CALLED ===");
        log.info("Candidature ID: {}", id);
        log.info("New status: {}", request.getStatus());
        log.info("Rejection reason: {}", request.getRejectionReason());
        
        try {
            CandidatureDto updatedCandidature = candidatureService.updateStatus(id, request);
            log.info("Candidature status updated successfully: {}", updatedCandidature.getStatus());
            return ResponseEntity.ok(updatedCandidature);
        } catch (Exception e) {
            log.error("Error updating candidature status: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidature(@PathVariable Long id) {
        candidatureService.deleteCandidature(id);
        return ResponseEntity.noContent().build();
    }
}
