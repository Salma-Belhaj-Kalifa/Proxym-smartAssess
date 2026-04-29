package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateInternshipPositionRequest;
import com.example.smart_assess.dto.InternshipPositionDto;
import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.entity.EvaluationReportEntity;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.EvaluationReportRepository;
import com.example.smart_assess.repository.InternshipPositionRepository;
import com.example.smart_assess.repository.ManagerRepository;
import com.example.smart_assess.service.InternshipPositionService;
import com.example.smart_assess.service.ElasticsearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternshipPositionServiceImpl implements InternshipPositionService {

    private final InternshipPositionRepository positionRepository;
    private final ManagerRepository managerRepository;
    private final CandidatureRepository candidatureRepository;
    private final EvaluationReportRepository evaluationReportRepository;
    private final ElasticsearchService elasticsearchService;

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
        
        // Indexer automatiquement dans Elasticsearch
        try {
            log.info("Indexing new position {} in Elasticsearch", position.getId());
            final Long positionId = position.getId();
            final String positionTitle = position.getTitle();
            final String positionDescription = position.getDescription();
            
            // Diagnostiquer requiredSkills
            java.util.List<String> requiredSkills = position.getRequiredSkills();
            log.info("RequiredSkills from position {}: {}", positionId, requiredSkills);
            log.info("RequiredSkills type: {}", requiredSkills != null ? requiredSkills.getClass().getSimpleName() : "null");
            if (requiredSkills == null) {
                requiredSkills = new java.util.ArrayList<>();
                log.warn("RequiredSkills was null, using empty list");
            }
            
            elasticsearchService.indexPosition(
                positionId,
                positionTitle,
                positionDescription,
                "", // requirements (non utilisé dans notre modèle)
                requiredSkills
            ).subscribe(
                response -> log.info("Position {} indexed successfully: {}", positionId, response),
                error -> log.error("Failed to index position {}: {}", positionId, error.getMessage())
            );
        } catch (Exception e) {
            log.error("Error indexing position {} in Elasticsearch: {}", position.getId(), e.getMessage());
            // Ne pas bloquer la création du poste si l'indexation échoue
        }
        
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
        log.info("=== TOGGLE POSITION STATUS ===");
        log.info("Position ID: {}", id);
        log.info("New isActive: {}", isActive);
        
        try {
            InternshipPosition position = positionRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Position not found with ID: " + id));

            log.info("Current position status: {}", position.getIsActive());
            log.info("Position title: {}", position.getTitle());
            log.info("Position ID from entity: {}", position.getId());

            // Forcer la mise à jour du statut
            position.setIsActive(isActive);
            
            // Log avant sauvegarde
            log.info("About to save position with isActive: {}", position.getIsActive());
            
            position = positionRepository.save(position);
            
            // Log après sauvegarde
            log.info("Position saved successfully");
            log.info("Position ID after save: {}", position.getId());
            log.info("Status after save: {}", position.getIsActive());
            
            // Vérification du DTO
            InternshipPositionDto dto = toDto(position);
            log.info("DTO isActive: {}", dto.getIsActive());
            
            return dto;
            
        } catch (RuntimeException e) {
            log.error("Error toggling position status: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error toggling position status", e);
            throw new RuntimeException("Failed to toggle position status: " + e.getMessage(), e);
        }
    }

    @Override
    public void deletePosition(Long id) {
        log.info("=== DELETE POSITION ===");
        log.info("Deleting position ID: {}", id);
        
        InternshipPosition position = positionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Position not found"));
        
        // Récupérer toutes les candidatures associées
        List<Candidature> candidatures = candidatureRepository.findByInternshipPosition_IdWithRelations(id);
        log.info("Found {} candidatures associated with position {}", candidatures.size(), id);
        
        if (!candidatures.isEmpty()) {
            // 1. D'abord supprimer les evaluation_reports qui référencent ces candidatures
            for (Candidature candidature : candidatures) {
                List<EvaluationReportEntity> reports = evaluationReportRepository.findByCandidatureIdOrderByGeneratedAtDesc(candidature.getId());
                if (!reports.isEmpty()) {
                    evaluationReportRepository.deleteAll(reports);
                    log.info("Deleted {} evaluation reports for candidature {}", reports.size(), candidature.getId());
                }
            }
            
            // 2. Ensuite supprimer les candidatures
            candidatureRepository.deleteAll(candidatures);
            log.info("Deleted {} associated candidatures", candidatures.size());
        }
        
        // Supprimer la position
        positionRepository.delete(position);
        log.info("Successfully deleted position ID: {}", id);
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
            System.out.println("Position ID: " + dto.getId() + ", isActive: " + dto.getIsActive());
        });
        
        return dtos;
    }

    @Override
    public List<InternshipPositionDto> getActivePositions() {
        log.info("=== GET ACTIVE POSITIONS ===");
        List<InternshipPosition> activePositions = positionRepository.findByIsActiveTrue();
        log.info("Found {} active positions in database", activePositions.size());
        
        // Log détaillé de chaque position active
        activePositions.forEach(position -> {
            log.info("Active position - ID: {}, Title: {}, IsActive: {}", 
                position.getId(), position.getTitle(), position.getIsActive());
        });
        
        List<InternshipPositionDto> dtos = activePositions.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        
        // Log des DTOs créés
        log.info("Created {} DTOs from active positions", dtos.size());
        dtos.forEach(dto -> {
            log.info("DTO - ID: {}, Title: {}, IsActive: {}", 
                dto.getId(), dto.getTitle(), dto.getIsActive());
        });
        
        log.info("Returning {} active position DTOs", dtos.size());
        return dtos;
    }

    @Override
    public List<InternshipPositionDto> getPositionsByManager(Long managerId) {
        return positionRepository.findByCreatedBy_Id(managerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private InternshipPositionDto toDto(InternshipPosition position) {
        log.debug("Converting position to DTO - ID: {}, Title: {}, IsActive: {}", 
            position.getId(), position.getTitle(), position.getIsActive());
        
        Boolean isActiveValue = position.getIsActive();
        // S'assurer que isActive n'est jamais null dans le DTO
        if (isActiveValue == null) {
            log.warn("Position {} has null isActive, setting to false", position.getId());
            isActiveValue = false;
        }
        
        InternshipPositionDto dto = InternshipPositionDto.builder()
                .id(position.getId())
                .title(position.getTitle())
                .description(position.getDescription())
                .company(position.getCompany())
                .requiredSkills(position.getRequiredSkills())
                .acceptedDomains(position.getAcceptedDomains())
                .isActive(isActiveValue)
                .createdBy(position.getCreatedBy() != null ? position.getCreatedBy().getId() : null)
                .createdByEmail(position.getCreatedBy() != null ? position.getCreatedBy().getEmail() : null)
                .createdAt(position.getCreatedAt())
                .build();
        
        log.debug("DTO created - ID: {}, IsActive: {}", dto.getId(), dto.getIsActive());
        return dto;
    }
}
