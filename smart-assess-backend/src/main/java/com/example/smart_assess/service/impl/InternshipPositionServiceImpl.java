package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateInternshipPositionRequest;
import com.example.smart_assess.dto.InternshipPositionDto;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.repository.InternshipPositionRepository;
import com.example.smart_assess.repository.ManagerRepository;
import com.example.smart_assess.service.InternshipPositionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InternshipPositionServiceImpl implements InternshipPositionService {

    private final InternshipPositionRepository positionRepository;
    private final ManagerRepository managerRepository;

    @Override
    public InternshipPositionDto createPosition(CreateInternshipPositionRequest request, String managerEmail) {
        System.out.println("=== DEBUG CREATE POSITION ===");
        System.out.println("Request received: " + request);
        System.out.println("Manager Email: " + managerEmail);
        System.out.println("Title: " + request.getTitle());
        System.out.println("Company: " + request.getCompany());
        System.out.println("Description: " + request.getDescription());
        System.out.println("RequiredSkills: " + request.getRequiredSkills());
        System.out.println("AcceptedDomains: " + request.getAcceptedDomains());
        System.out.println("IsActive: " + request.getIsActive());
        
        Manager manager = managerRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found with email: " + managerEmail));

        InternshipPosition position = InternshipPosition.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .company(request.getCompany())
                .requiredSkills(request.getRequiredSkills())
                .acceptedDomains(request.getAcceptedDomains())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .createdBy(manager)
                .build();

        position = positionRepository.save(position);
        System.out.println("Position saved successfully with ID: " + position.getId());
        return toDto(position);
    }

    @Override
    public InternshipPositionDto updatePosition(Long id, CreateInternshipPositionRequest request) {
        System.out.println("=== DEBUG UPDATE POSITION ===");
        System.out.println("Request received: " + request);
        System.out.println("ID: " + id);
        
        InternshipPosition position = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found"));

        position.setTitle(request.getTitle());
        position.setDescription(request.getDescription());
        if (request.getCompany() != null) {
            position.setCompany(request.getCompany());
        }
        position.setRequiredSkills(request.getRequiredSkills());
        position.setAcceptedDomains(request.getAcceptedDomains());
        if (request.getIsActive() != null) {
            position.setIsActive(request.getIsActive());
        }

        position = positionRepository.save(position);
        System.out.println("Position updated successfully with ID: " + position.getId());
        return toDto(position);
    }

    @Override
    public InternshipPositionDto togglePositionStatus(Long id, Boolean isActive) {
        System.out.println("=== DEBUG TOGGLE POSITION STATUS ===");
        System.out.println("ID: " + id);
        System.out.println("New isActive: " + isActive);
        
        InternshipPosition position = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found"));

        position.setIsActive(isActive);
        position = positionRepository.save(position);
        
        System.out.println("Position status updated successfully with ID: " + position.getId());
        System.out.println("New status: " + position.getIsActive());
        
        return toDto(position);
    }

    @Override
    public void deletePosition(Long id) {
        InternshipPosition position = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found"));
        positionRepository.delete(position);
    }

    @Override
    public InternshipPositionDto getPositionById(Long id) {
        InternshipPosition position = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found"));
        return toDto(position);
    }

    @Override
    public List<InternshipPositionDto> getAllPositions() {
        System.out.println("=== GET ALL POSITIONS ===");
        List<InternshipPosition> positions = positionRepository.findAll();
        System.out.println("Found " + positions.size() + " positions in database");
        
        List<InternshipPositionDto> dtos = positions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        
        System.out.println("Converted to DTOs:");
        dtos.forEach(dto -> {
            System.out.println("Position ID: " + dto.getId() + ", isActive: " + dto.isActive());
        });
        
        return dtos;
    }

    @Override
    public List<InternshipPositionDto> getActivePositions() {
        return positionRepository.findByIsActiveTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<InternshipPositionDto> getPositionsByManager(Long managerId) {
        return positionRepository.findByCreatedBy_Id(managerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private InternshipPositionDto toDto(InternshipPosition position) {
        return InternshipPositionDto.builder()
                .id(position.getId())
                .title(position.getTitle())
                .description(position.getDescription())
                .company(position.getCompany())
                .requiredSkills(position.getRequiredSkills())
                .acceptedDomains(position.getAcceptedDomains())
                .isActive(position.getIsActive() != null ? position.getIsActive() : false)
                .createdBy(position.getCreatedBy() != null ? position.getCreatedBy().getId() : null)
                .createdByEmail(position.getCreatedBy() != null ? position.getCreatedBy().getEmail() : null)
                .createdAt(position.getCreatedAt())
                .build();
    }
}
