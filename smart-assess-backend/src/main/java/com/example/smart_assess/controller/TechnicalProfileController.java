package com.example.smart_assess.controller;

import com.example.smart_assess.dto.TechnicalProfileDto;
import com.example.smart_assess.service.TechnicalProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/technical_profiles")
@RequiredArgsConstructor
@Slf4j
public class TechnicalProfileController {

    private final TechnicalProfileService technicalProfileService;

    @GetMapping
    public ResponseEntity<List<TechnicalProfileDto>> getAllTechnicalProfiles() {
        log.info("Getting all technical profiles");
        List<TechnicalProfileDto> profiles = technicalProfileService.getAllTechnicalProfiles();
        return ResponseEntity.ok(profiles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechnicalProfileDto> getTechnicalProfileById(@PathVariable Long id) {
        log.info("Getting technical profile by ID: {}", id);
        return technicalProfileService.getTechnicalProfileById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/cv/{cvId}")
    public ResponseEntity<TechnicalProfileDto> getTechnicalProfileByCvId(@PathVariable Long cvId) {
        log.info("Getting technical profile by CV ID: {}", cvId);
        return technicalProfileService.findByCvId(cvId)
                .map(profile -> ResponseEntity.ok(technicalProfileService.convertToDto(profile)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<TechnicalProfileDto> getTechnicalProfileByCandidateId(@PathVariable Long candidateId) {
        log.info("Getting technical profile by candidate ID: {}", candidateId);
        return technicalProfileService.findByCandidateId(candidateId)
                .map(profile -> ResponseEntity.ok(technicalProfileService.convertToDto(profile)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/cv/{cvId}")
    public ResponseEntity<TechnicalProfileDto> createTechnicalProfile(
            @PathVariable Long cvId, 
            @RequestBody TechnicalProfileDto profileDto) {
        log.info("Creating technical profile for CV ID: {}", cvId);
        try {
            TechnicalProfileDto createdProfile = technicalProfileService.createTechnicalProfile(cvId, profileDto);
            return ResponseEntity.ok(createdProfile);
        } catch (Exception e) {
            log.error("Error creating technical profile for CV ID: {}", cvId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTechnicalProfile(@PathVariable Long id) {
        log.info("Deleting technical profile with ID: {}", id);
        technicalProfileService.deleteTechnicalProfile(id);
        return ResponseEntity.noContent().build();
    }
}
