package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateInternshipPositionRequest;
import com.example.smart_assess.dto.InternshipPositionDto;
import com.example.smart_assess.entity.InternshipPosition;

import java.util.List;

public interface InternshipPositionService {
    InternshipPositionDto createPosition(CreateInternshipPositionRequest request, String managerEmail);
    InternshipPositionDto updatePosition(Long id, CreateInternshipPositionRequest request);
    InternshipPositionDto togglePositionStatus(Long id, Boolean isActive);
    void deletePosition(Long id);
    InternshipPositionDto getPositionById(Long id);
    List<InternshipPositionDto> getAllPositions();
    List<InternshipPositionDto> getActivePositions();
    List<InternshipPositionDto> getPositionsByManager(Long managerId);
}
