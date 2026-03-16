package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CandidateCVDto;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.entity.CandidateCV;
import com.example.smart_assess.enums.ParsingStatus;
import com.example.smart_assess.repository.CandidateCVRepository;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.service.CandidateCVService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateCVServiceImpl implements CandidateCVService {

    private final CandidateCVRepository cvRepository;
    private final CandidateRepository candidateRepository;

    @Override
    public CandidateCVDto uploadCV(Long candidateId, MultipartFile file) {
        log.info("Starting CV upload process for candidateId: {}", candidateId);
        log.info("File details - name: {}, size: {}, contentType: {}", 
                file.getOriginalFilename(), file.getSize(), file.getContentType());
        
        try {
            // Check if CV already exists for this candidate
            log.info("Checking if CV already exists for candidate: {}", candidateId);
            Optional<CandidateCV> existingCV = cvRepository.findByCandidate_Id(candidateId);
            
            CandidateCV cv;
            if (existingCV.isPresent()) {
                // Update existing CV
                log.info("Updating existing CV for candidate: {}", candidateId);
                cv = existingCV.get();
                cv.setFileName(file.getOriginalFilename());
                cv.setFileData(file.getBytes());
                cv.setFileSizeBytes(file.getSize());
                cv.setParsingStatus(ParsingStatus.PENDING);
            } else {
                // Create new CV
                log.info("Creating new CV for candidate: {}", candidateId);
                
                // First, find the candidate
                Candidate candidate = candidateRepository.findById(candidateId)
                        .orElseThrow(() -> {
                            log.error("Candidate not found with ID: {}", candidateId);
                            return new RuntimeException("Candidate not found with ID: " + candidateId);
                        });
                
                log.info("Found candidate: {} {}", candidate.getFirstName(), candidate.getLastName());
                
                cv = CandidateCV.builder()
                        .candidate(candidate)
                        .fileName(file.getOriginalFilename())
                        .fileData(file.getBytes())
                        .fileSizeBytes(file.getSize())
                        .parsingStatus(ParsingStatus.PENDING)
                        .build();
            }

            log.info("Saving CV to database...");
            cv = cvRepository.save(cv);
            log.info("CV saved successfully with ID: {}", cv.getId());
            
            CandidateCVDto result = toDto(cv);
            log.info("CV upload completed successfully. DTO: {}", result);
            
            return result;
        } catch (IOException e) {
            log.error("Failed to read file bytes for candidate: {}", candidateId, e);
            throw new RuntimeException("Failed to read file: " + e.getMessage(), e);
        } catch (RuntimeException e) {
            log.error("Runtime error during CV upload for candidate: {}", candidateId, e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during CV upload for candidate: {}", candidateId, e);
            throw new RuntimeException("Failed to upload CV: " + e.getMessage(), e);
        }
    }

    @Override
    public CandidateCVDto getCVByCandidateId(Long candidateId) {
        CandidateCV cv = cvRepository.findByCandidate_Id(candidateId)
                .orElseThrow(() -> new RuntimeException("CV not found for candidate"));
        return toDto(cv);
    }

    @Override
    public byte[] downloadCV(Long cvId) {
        CandidateCV cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new RuntimeException("CV not found"));
        return cv.getFileData();
    }

    @Override
    public void deleteCV(Long cvId) {
        CandidateCV cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new RuntimeException("CV not found"));
        cvRepository.delete(cv);
    }

    @Override
    public List<CandidateCVDto> getAllCVs() {
        return cvRepository.findAll().stream()
                .map(this::toDto)
                .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public void updateParsingStatus(Long cvId, ParsingStatus status) {
        CandidateCV cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new RuntimeException("CV not found"));
        cv.setParsingStatus(status);
        cvRepository.save(cv);
    }

    private CandidateCVDto toDto(CandidateCV cv) {
        return CandidateCVDto.builder()
                .id(cv.getId())
                .candidateId(cv.getCandidate() != null ? cv.getCandidate().getId() : null)
                .fileName(cv.getFileName())
                .fileSizeBytes(cv.getFileSizeBytes())
                .parsingStatus(cv.getParsingStatus())
                .uploadDate(cv.getUploadDate())
                .build();
    }
    
    @Override
    public boolean candidateExists(Long candidateId) {
        log.info("Checking if candidate exists with ID: {}", candidateId);
        boolean exists = candidateRepository.existsById(candidateId);
        log.info("Candidate {} exists: {}", candidateId, exists);
        return exists;
    }
}
