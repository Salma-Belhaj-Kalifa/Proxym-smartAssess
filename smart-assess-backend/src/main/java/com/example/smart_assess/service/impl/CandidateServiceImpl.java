package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateCandidateRequest;
import com.example.smart_assess.dto.CandidateDto;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.service.CandidateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateServiceImpl implements CandidateService {

    private final CandidateRepository candidateRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public CandidateDto createCandidate(CreateCandidateRequest request) {
        if (candidateRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Candidate candidate = new Candidate();
        candidate.setEmail(request.getEmail());
        candidate.setPassword(passwordEncoder.encode(request.getPassword()));
        candidate.setFirstName(request.getFirstName());
        candidate.setLastName(request.getLastName());
        candidate.setPhone(request.getPhone());
        candidate.setRole(Role.CANDIDATE);

        candidate = candidateRepository.save(candidate);
        return toDto(candidate);
    }

    @Override
    public CandidateDto updateCandidate(Long id, CreateCandidateRequest request) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        candidate.setFirstName(request.getFirstName());
        candidate.setLastName(request.getLastName());
        candidate.setPhone(request.getPhone());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            candidate.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        candidate = candidateRepository.save(candidate);
        return toDto(candidate);
    }

    @Override
    public void deleteCandidate(Long id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        candidateRepository.delete(candidate);
    }

    @Override
    public CandidateDto getCandidateById(Long id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        return toDto(candidate);
    }

    @Override
    public CandidateDto getCandidateByEmail(String email) {
        Candidate candidate = candidateRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
        return toDto(candidate);
    }

    @Override
    public List<CandidateDto> getAllCandidates() {
        log.info("Getting all candidates from database");
        try {
            List<Candidate> candidates = candidateRepository.findAll();
            log.info("Found {} candidates in database", candidates.size());
            
            List<CandidateDto> candidateDtos = candidates.stream()
                    .map(this::toDto)
                    .collect(Collectors.toList());
            
            log.info("Converted {} candidates to DTOs", candidateDtos.size());
            return candidateDtos;
        } catch (Exception e) {
            log.error("Error getting all candidates", e);
            throw e;
        }
    }

    private CandidateDto toDto(Candidate candidate) {
        return CandidateDto.builder()
                .id(candidate.getId())
                .email(candidate.getEmail())
                .firstName(candidate.getFirstName())
                .lastName(candidate.getLastName())
                .phone(candidate.getPhone())
                .createdAt(candidate.getCreatedAt())
                .build();
    }
}
