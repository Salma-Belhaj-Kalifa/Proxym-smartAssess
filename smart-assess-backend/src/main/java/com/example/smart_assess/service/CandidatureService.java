package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateCandidatureRequest;
import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.UpdateCandidatureStatusRequest;
import com.example.smart_assess.enums.CandidatureStatus;

import java.util.List;

public interface CandidatureService {
    CandidatureDto createCandidature(CreateCandidatureRequest request);
    CandidatureDto updateStatus(Long id, UpdateCandidatureStatusRequest request);
    void deleteCandidature(Long id);
    CandidatureDto getCandidatureById(Long id);
    List<CandidatureDto> getCandidaturesByCandidate(Long candidateId);
    List<CandidatureDto> getCandidaturesByPosition(Long positionId);
    List<CandidatureDto> getCandidaturesByStatus(CandidatureStatus status);
    List<CandidatureDto> getAllCandidatures();
}
