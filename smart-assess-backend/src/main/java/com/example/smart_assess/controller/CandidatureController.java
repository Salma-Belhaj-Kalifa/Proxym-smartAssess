package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateCandidatureRequest;
import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.UpdateCandidatureStatusRequest;
import com.example.smart_assess.enums.CandidatureStatus;
import com.example.smart_assess.service.CandidatureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidatures")
@RequiredArgsConstructor
public class CandidatureController {

    private final CandidatureService candidatureService;

    @PostMapping
    public ResponseEntity<CandidatureDto> createCandidature(@Valid @RequestBody CreateCandidatureRequest request) {
        return ResponseEntity.ok(candidatureService.createCandidature(request));
    }

    @GetMapping
    public ResponseEntity<List<CandidatureDto>> getAllCandidatures() {
        return ResponseEntity.ok(candidatureService.getAllCandidatures());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidatureDto> getCandidatureById(@PathVariable Long id) {
        return ResponseEntity.ok(candidatureService.getCandidatureById(id));
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<CandidatureDto>> getCandidaturesByCandidate(@PathVariable Long candidateId) {
        return ResponseEntity.ok(candidatureService.getCandidaturesByCandidate(candidateId));
    }

    @GetMapping("/position/{positionId}")
    public ResponseEntity<List<CandidatureDto>> getCandidaturesByPosition(@PathVariable Long positionId) {
        return ResponseEntity.ok(candidatureService.getCandidaturesByPosition(positionId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<CandidatureDto>> getCandidaturesByStatus(@PathVariable CandidatureStatus status) {
        return ResponseEntity.ok(candidatureService.getCandidaturesByStatus(status));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<CandidatureDto> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateCandidatureStatusRequest request) {
        return ResponseEntity.ok(candidatureService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidature(@PathVariable Long id) {
        candidatureService.deleteCandidature(id);
        return ResponseEntity.noContent().build();
    }
}
