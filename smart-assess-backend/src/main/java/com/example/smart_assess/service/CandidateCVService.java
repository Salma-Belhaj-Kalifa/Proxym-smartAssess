package com.example.smart_assess.service;

import com.example.smart_assess.dto.CandidateCVDto;
import com.example.smart_assess.enums.ParsingStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CandidateCVService {
    CandidateCVDto uploadCV(Long candidateId, MultipartFile file);
    CandidateCVDto getCVByCandidateId(Long candidateId);
    byte[] downloadCV(Long cvId);
    void deleteCV(Long cvId);
    List<CandidateCVDto> getAllCVs();
    void updateParsingStatus(Long cvId, ParsingStatus status);
    boolean candidateExists(Long candidateId);
}
