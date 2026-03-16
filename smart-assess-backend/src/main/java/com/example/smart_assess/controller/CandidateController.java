package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateCandidateRequest;
import com.example.smart_assess.dto.CandidateDto;
import com.example.smart_assess.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    @PostMapping
    public ResponseEntity<CandidateDto> createCandidate(@Valid @RequestBody CreateCandidateRequest request) {
        return ResponseEntity.ok(candidateService.createCandidate(request));
    }

    @GetMapping
    public ResponseEntity<List<CandidateDto>> getAllCandidates() {
        return ResponseEntity.ok(candidateService.getAllCandidates());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CandidateDto> getCandidateById(@PathVariable Long id) {
        return ResponseEntity.ok(candidateService.getCandidateById(id));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<CandidateDto> getCandidateByEmail(@PathVariable String email) {
        return ResponseEntity.ok(candidateService.getCandidateByEmail(email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CandidateDto> updateCandidate(@PathVariable Long id, @Valid @RequestBody CreateCandidateRequest request) {
        return ResponseEntity.ok(candidateService.updateCandidate(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCandidate(@PathVariable Long id) {
        candidateService.deleteCandidate(id);
        return ResponseEntity.noContent().build();
    }
}
