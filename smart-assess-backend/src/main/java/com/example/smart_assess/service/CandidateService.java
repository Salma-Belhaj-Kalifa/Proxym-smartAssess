package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateCandidateRequest;
import com.example.smart_assess.dto.CandidateDto;
import com.example.smart_assess.dto.UpdateCandidateProfileRequest;

import java.util.List;

public interface CandidateService {
    CandidateDto createCandidate(CreateCandidateRequest request);
    CandidateDto updateCandidate(Long id, CreateCandidateRequest request);
    CandidateDto updateProfile(Long id, UpdateCandidateProfileRequest request);
    void deleteCandidate(Long id);
    void deleteMyProfile();
    CandidateDto getCandidateById(Long id);
    CandidateDto getCandidateByEmail(String email);
    List<CandidateDto> getAllCandidates();
    
    // Vérifier si l'utilisateur est le propriétaire du profil
    boolean isOwner(Long candidateId, String email);
}
