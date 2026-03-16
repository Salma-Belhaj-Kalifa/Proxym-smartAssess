package com.example.smart_assess.controller;

import com.example.smart_assess.dto.CreateInternshipPositionRequest;
import com.example.smart_assess.dto.InternshipPositionDto;
import com.example.smart_assess.dto.TogglePositionStatusRequest;
import com.example.smart_assess.service.InternshipPositionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/positions")
@RequiredArgsConstructor
public class InternshipPositionController {

    private final InternshipPositionService positionService;

    @PostMapping
    public ResponseEntity<InternshipPositionDto> createPosition(@Valid @RequestBody CreateInternshipPositionRequest request) {
        // Récupérer l'ID du manager authentifié
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName(); // L'email est le username dans Spring Security
        
        // Créer une nouvelle request avec le createdBy correct
        CreateInternshipPositionRequest requestWithCreator = CreateInternshipPositionRequest.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .company(request.getCompany())
                .requiredSkills(request.getRequiredSkills())
                .acceptedDomains(request.getAcceptedDomains())
                .isActive(request.getIsActive())
                .build();
        
        return ResponseEntity.ok(positionService.createPosition(requestWithCreator, email));
    }

    @GetMapping
    public ResponseEntity<List<InternshipPositionDto>> getAllPositions() {
        return ResponseEntity.ok(positionService.getAllPositions());
    }

    @GetMapping("/public")
    public ResponseEntity<List<InternshipPositionDto>> getPublicPositions() {
        return ResponseEntity.ok(positionService.getActivePositions());
    }

    @GetMapping("/active")
    public ResponseEntity<List<InternshipPositionDto>> getActivePositions() {
        return ResponseEntity.ok(positionService.getActivePositions());
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<InternshipPositionDto>> getPositionsByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(positionService.getPositionsByManager(managerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InternshipPositionDto> getPositionById(@PathVariable Long id) {
        return ResponseEntity.ok(positionService.getPositionById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InternshipPositionDto> updatePosition(@PathVariable Long id, @Valid @RequestBody CreateInternshipPositionRequest request) {
        return ResponseEntity.ok(positionService.updatePosition(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InternshipPositionDto> togglePositionStatus(@PathVariable Long id, @Valid @RequestBody TogglePositionStatusRequest request) {
        return ResponseEntity.ok(positionService.togglePositionStatus(id, request.getIsActive()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePosition(@PathVariable Long id) {
        positionService.deletePosition(id);
        return ResponseEntity.noContent().build();
    }
}
