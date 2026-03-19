package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateCandidateRequest;
import com.example.smart_assess.dto.CandidateDto;
import com.example.smart_assess.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@Slf4j
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping
    public ResponseEntity<CandidateDto> createCandidate(@Valid @RequestBody CreateCandidateRequest request) {
        return ResponseEntity.ok(candidateService.createCandidate(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<List<CandidateDto>> getAllCandidates() {
        return ResponseEntity.ok(candidateService.getAllCandidates());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR') or @candidateService.isOwner(#id, authentication.name)")
    public ResponseEntity<CandidateDto> getCandidateById(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getCandidateById(id));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR') or authentication.name == #email")
    public ResponseEntity<CandidateDto> getCandidateByEmail(@PathVariable String email) {
        return ResponseEntity.ok(candidateService.getCandidateByEmail(email));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR') or @candidateService.isOwner(#id, authentication.name)")
    public ResponseEntity<CandidateDto> updateCandidate(@PathVariable Long id, @Valid @RequestBody CreateCandidateRequest request) {
        return ResponseEntity.ok(candidateService.updateCandidate(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('HR')")
    public ResponseEntity<Map<String, Object>> deleteCandidate(@PathVariable Long id) {
        try {
            log.info("Admin deletion request for candidate ID: {}", id);
            candidateService.deleteCandidate(id);
            log.info("Candidate {} deleted successfully by admin", id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Candidat supprimé avec succès"
            ));
        } catch (Exception e) {
            log.error("Error deleting candidate {}: {}", id, e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<Map<String, Object>> deleteMyProfile() {
        try {
            // Récupérer l'ID du candidat depuis le token JWT
            // Cette méthode sera implémentée dans le service
            log.info("Self-deletion request from candidate");
            candidateService.deleteMyProfile();
            log.info("Candidate self-deleted successfully");
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Votre profil a été supprimé avec succès"
            ));
        } catch (Exception e) {
            log.error("Error in candidate self-deletion: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}
