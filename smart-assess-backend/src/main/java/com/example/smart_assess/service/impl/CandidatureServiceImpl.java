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
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
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
        Candidature candidature = candidatureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidature not found"));

        candidature.setStatus(request.getStatus());
        candidature.setRejectionReason(request.getRejectionReason());

        candidature = candidatureRepository.save(candidature);
        return toDto(candidature);
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
        return candidatureRepository.findByCandidate_Id(candidateId).stream()
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
        return candidatureRepository.findAll().stream()
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
