package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateCandidatureRequest;
import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.UpdateCandidatureStatusRequest;
import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.enums.CandidatureStatus;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.repository.InternshipPositionRepository;
import com.example.smart_assess.service.CandidatureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidatureServiceImpl implements CandidatureService {

    private final CandidatureRepository candidatureRepository;
    private final CandidateRepository candidateRepository;
    private final InternshipPositionRepository positionRepository;

    @Override
    public CandidatureDto createCandidature(CreateCandidatureRequest request) {
        Candidate candidate = candidateRepository.findById(request.getCandidateId())
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        InternshipPosition position = positionRepository.findById(request.getInternshipPositionId())
                .orElseThrow(() -> new RuntimeException("Position not found"));

        if (candidatureRepository.findByCandidate_IdAndInternshipPosition_Id(request.getCandidateId(), request.getInternshipPositionId()).isPresent()) {
            throw new RuntimeException("Candidature already exists");
        }

        Candidature candidature = Candidature.builder()
                .candidate(candidate)
                .internshipPosition(position)
                .status(CandidatureStatus.PENDING)
                .build();

        candidature = candidatureRepository.save(candidature);
        return toDto(candidature);
    }

    @Override
    public CandidatureDto updateStatus(Long id, UpdateCandidatureStatusRequest request) {
        log.info("=== UPDATE STATUS IN SERVICE ===");
        log.info("Candidature ID: {}", id);
        log.info("Request status: {}", request.getStatus());
        log.info("Request rejection reason: {}", request.getRejectionReason());
        
        try {
            Candidature candidature = candidatureRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Candidature not found"));

            log.info("Found candidature: {}", candidature.getId());
            log.info("Current status: {}", candidature.getStatus());
            log.info("Candidature entity before save: {}", candidature);

            candidature.setStatus(request.getStatus());
            candidature.setRejectionReason(request.getRejectionReason());
            
            log.info("Setting new status: {}", request.getStatus());
            log.info("Setting rejection reason: {}", request.getRejectionReason());
            log.info("Candidature entity after status update: {}", candidature);

            candidature = candidatureRepository.save(candidature);
            
            log.info("Candidature saved successfully");
            log.info("Saved candidature ID: {}", candidature.getId());
            log.info("Saved candidature status: {}", candidature.getStatus());
            log.info("Saved candidature rejection reason: {}", candidature.getRejectionReason());
            
            return toDto(candidature);
        } catch (Exception e) {
            log.error("Error updating candidature status: {}", id, e);
            log.error("Error details: {}", e.getMessage());
            log.error("Error stack trace:", e);
            throw e;
        }
    }

    @Override
    public void deleteCandidature(Long id) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature not found"));
        candidatureRepository.delete(candidature);
    }

    @Override
    public CandidatureDto getCandidatureById(Long id) {
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature not found"));
        return toDto(candidature);
    }

    @Override
    public List<CandidatureDto> getCandidaturesByCandidate(Long candidateId) {
        List<Candidature> candidatures = candidatureRepository.findByCandidate_IdWithRelations(candidateId);
        return candidatures.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CandidatureDto> getCandidaturesByPosition(Long positionId) {
        return candidatureRepository.findByInternshipPosition_Id(positionId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CandidatureDto> getCandidaturesByStatus(CandidatureStatus status) {
        return candidatureRepository.findByStatus(status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<CandidatureDto> getAllCandidatures() {
        return candidatureRepository.findAllWithRelations().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private CandidatureDto toDto(Candidature candidature) {
        return CandidatureDto.builder()
                .id(candidature.getId())
                .candidateId(candidature.getCandidate() != null ? candidature.getCandidate().getId() : null)
                .candidateFirstName(candidature.getCandidate() != null ? candidature.getCandidate().getFirstName() : null)
                .candidateLastName(candidature.getCandidate() != null ? candidature.getCandidate().getLastName() : null)
                .candidateEmail(candidature.getCandidate() != null ? candidature.getCandidate().getEmail() : null)
                .candidatePhone(candidature.getCandidate() != null ? candidature.getCandidate().getPhone() : null)
                .internshipPositionId(candidature.getInternshipPosition() != null ? candidature.getInternshipPosition().getId() : null)
                .positionTitle(candidature.getInternshipPosition() != null ? candidature.getInternshipPosition().getTitle() : null)
                .positionCompany(candidature.getInternshipPosition() != null ? candidature.getInternshipPosition().getCompany() : null)
                .positionDescription(candidature.getInternshipPosition() != null ? candidature.getInternshipPosition().getDescription() : null)
                .status(candidature.getStatus())
                .rejectionReason(candidature.getRejectionReason())
                .appliedAt(candidature.getAppliedAt())
                .updatedAt(candidature.getUpdatedAt())
                .build();
    }
}
