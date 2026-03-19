package com.example.smart_assess.service.impl;

import com.example.smart_assess.dto.CreateManagerRequest;
import com.example.smart_assess.dto.ManagerDto;
import com.example.smart_assess.entity.*;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.*;
import com.example.smart_assess.service.ManagerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManagerServiceImpl implements ManagerService {

    private final ManagerRepository managerRepository;
    private final PasswordEncoder passwordEncoder;
    private final InternshipPositionRepository internshipPositionRepository;
    private final CandidatureRepository candidatureRepository;

    @Override
    public ManagerDto createManager(CreateManagerRequest request) {
        if (managerRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Manager manager = new Manager();
        manager.setEmail(request.getEmail());
        manager.setPassword(passwordEncoder.encode(request.getPassword()));
        manager.setFirstName(request.getFirstName());
        manager.setLastName(request.getLastName());
        manager.setDepartment(request.getDepartment());
        manager.setRole(Role.MANAGER);

        manager = managerRepository.save(manager);
        return toDto(manager);
    }

    @Override
    public ManagerDto updateManager(Long id, CreateManagerRequest request) {
        Manager manager = managerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        manager.setFirstName(request.getFirstName());
        manager.setLastName(request.getLastName());
        manager.setDepartment(request.getDepartment());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            manager.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        manager = managerRepository.save(manager);
        return toDto(manager);
    }

    @Override
    public void deleteManager(Long id) {
        Manager manager = managerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        
        log.info("=== DÉBUT SUPPRESSION MANAGER {} ===", id);
        log.info("Email: {}", manager.getEmail());
        
        try {
            // Compter les données qui seront supprimées par cascade
            List<InternshipPosition> positions = internshipPositionRepository.findByCreatedBy_Id(id);
            int positionCount = positions.size();
            int candidatureCount = 0;
            
            for (InternshipPosition position : positions) {
                candidatureCount += candidatureRepository.findByInternshipPosition_Id(position.getId()).size();
            }
            
            log.info("Données qui seront supprimées : {} position(s), {} candidature(s) et leurs données associées", 
                positionCount, candidatureCount);
            
            // La suppression du manager déclenchera les cascades automatiquement grâce à CascadeType.ALL
            managerRepository.delete(manager);
            
            log.info("=== MANAGER {} SUPPRIMÉ AVEC SUCCÈS ===", id);
            log.info("Suppression en cascade effectuée via JPA CascadeType.ALL");
            
        } catch (Exception e) {
            log.error("Erreur lors de la suppression du manager {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Impossible de supprimer ce manager. Erreur lors de la suppression des données associées.", e);
        }
    }

    @Override
    public void deleteMyProfile() {
        // Récupérer l'email de l'utilisateur authentifié
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Utilisateur non authentifié");
        }
        
        Manager manager = managerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Manager non trouvé"));
        
        log.info("=== DÉBUT AUTO-SUPPRESSION MANAGER {} ===", manager.getId());
        log.info("Email: {}", email);
        
        try {
            // Compter les données qui seront supprimées par cascade
            List<InternshipPosition> positions = internshipPositionRepository.findByCreatedBy_Id(manager.getId());
            int positionCount = positions.size();
            int candidatureCount = 0;
            
            for (InternshipPosition position : positions) {
                candidatureCount += candidatureRepository.findByInternshipPosition_Id(position.getId()).size();
            }
            
            log.info("Données qui seront supprimées : {} position(s), {} candidature(s) et leurs données associées", 
                positionCount, candidatureCount);
            
            // La suppression du manager déclenchera les cascades automatiquement grâce à CascadeType.ALL
            managerRepository.delete(manager);
            
            log.info("=== AUTO-SUPPRESSION MANAGER {} TERMINÉE AVEC SUCCÈS ===", manager.getId());
            log.info("Suppression en cascade effectuée via JPA CascadeType.ALL");
            
        } catch (Exception e) {
            log.error("Erreur lors de l'auto-suppression du manager {}: {}", manager.getId(), e.getMessage(), e);
            throw new RuntimeException("Impossible de supprimer votre profil. Erreur lors de la suppression des données associées.", e);
        }
    }

    @Override
    public boolean isOwner(Long managerId, String email) {
        try {
            Manager manager = managerRepository.findById(managerId)
                    .orElse(null);
            return manager != null && manager.getEmail().equals(email);
        } catch (Exception e) {
            log.error("Error checking ownership for manager {}: {}", managerId, e.getMessage());
            return false;
        }
    }

    @Override
    public ManagerDto getManagerById(Long id) {
        Manager manager = managerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        return toDto(manager);
    }

    @Override
    public ManagerDto getManagerByEmail(String email) {
        Manager manager = managerRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        return toDto(manager);
    }

    @Override
    public List<ManagerDto> getAllManagers() {
        return managerRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private ManagerDto toDto(Manager manager) {
        return ManagerDto.builder()
                .id(manager.getId())
                .email(manager.getEmail())
                .firstName(manager.getFirstName())
                .lastName(manager.getLastName())
                .department(manager.getDepartment())
                .createdAt(manager.getCreatedAt())
                .build();
    }
}
