package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateInternshipPositionRequest;
import com.example.smart_assess.dto.InternshipPositionDto;
import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.InternshipPositionRepository;
import com.example.smart_assess.repository.ManagerRepository;
import com.example.smart_assess.service.impl.InternshipPositionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InternshipPositionServiceImpl Tests")
class InternshipPositionServiceImplTest {

    @Mock private InternshipPositionRepository positionRepository;
    @Mock private ManagerRepository managerRepository;
    @Mock private CandidatureRepository candidatureRepository;

    @InjectMocks
    private InternshipPositionServiceImpl positionService;

    private Manager manager;
    private InternshipPosition position;
    private CreateInternshipPositionRequest request;

    @BeforeEach
    void setUp() {
        manager = new Manager();
        manager.setId(1L);
        manager.setEmail("manager@proxym.com");
        manager.setFirstName("Sana");
        manager.setLastName("Karim");
        manager.setRole(Role.MANAGER);
        manager.setDepartment("IT");
        manager.setCreatedAt(LocalDateTime.now());

        position = InternshipPosition.builder()
                .id(10L)
                .title("Stage Backend Java")
                .company("Proxym IT")
                .description("Développement Spring Boot")
                .requiredSkills(List.of("Java", "Spring Boot", "PostgreSQL"))
                .acceptedDomains(List.of("Informatique", "GL"))
                .isActive(true)
                .createdBy(manager)
                .createdAt(LocalDateTime.now())
                .build();

        request = new CreateInternshipPositionRequest();
        request.setTitle("Stage Backend Java");
        request.setCompany("Proxym IT");
        request.setDescription("Développement Spring Boot");
        request.setRequiredSkills(List.of("Java", "Spring Boot"));
        request.setAcceptedDomains(List.of("Informatique"));
        request.setIsActive(true);
    }

    // ============ createPosition ============

    @Test
    @DisplayName("createPosition - crée une position avec succès")
    void createPosition_ShouldCreateSuccessfully() {
        when(managerRepository.findByEmail("manager@proxym.com")).thenReturn(Optional.of(manager));
        when(positionRepository.save(any(InternshipPosition.class))).thenReturn(position);

        InternshipPositionDto result = positionService.createPosition(request, "manager@proxym.com");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getTitle()).isEqualTo("Stage Backend Java");
        assertThat(result.getIsActive()).isTrue();
        verify(positionRepository).save(any(InternshipPosition.class));
    }

    @Test
    @DisplayName("createPosition - lève une exception si le manager n'existe pas")
    void createPosition_WithInvalidManager_ShouldThrow() {
        when(managerRepository.findByEmail("unknown@proxym.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.createPosition(request, "unknown@proxym.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Manager not found");
    }

    @Test
    @DisplayName("createPosition - isActive par défaut à true si null")
    void createPosition_WithNullIsActive_ShouldDefaultToTrue() {
        request.setIsActive(null);
        when(managerRepository.findByEmail("manager@proxym.com")).thenReturn(Optional.of(manager));
        when(positionRepository.save(any(InternshipPosition.class))).thenReturn(position);

        InternshipPositionDto result = positionService.createPosition(request, "manager@proxym.com");

        assertThat(result.getIsActive()).isTrue();
    }

    // ============ updatePosition ============

    @Test
    @DisplayName("updatePosition - met à jour avec succès")
    void updatePosition_ShouldUpdateSuccessfully() {
        request.setTitle("Stage Fullstack");

        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(positionRepository.save(any(InternshipPosition.class))).thenReturn(position);

        InternshipPositionDto result = positionService.updatePosition(10L, request);

        assertThat(result).isNotNull();
        verify(positionRepository).save(any(InternshipPosition.class));
    }

    @Test
    @DisplayName("updatePosition - lève une exception si la position n'existe pas")
    void updatePosition_WithInvalidId_ShouldThrow() {
        when(positionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.updatePosition(99L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Position not found");
    }

    // ============ togglePositionStatus ============

    @Test
    @DisplayName("togglePositionStatus - désactive une position active")
    void togglePositionStatus_ShouldDeactivate() {
        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(positionRepository.save(any(InternshipPosition.class))).thenReturn(position);

        InternshipPositionDto result = positionService.togglePositionStatus(10L, false);

        assertThat(result).isNotNull();
        verify(positionRepository).save(position);
    }

    @Test
    @DisplayName("togglePositionStatus - active une position inactive")
    void togglePositionStatus_ShouldActivate() {
        position.setIsActive(false);
        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(positionRepository.save(any(InternshipPosition.class))).thenReturn(position);

        positionService.togglePositionStatus(10L, true);

        verify(positionRepository).save(position);
        assertThat(position.getIsActive()).isTrue();
    }

    @Test
    @DisplayName("togglePositionStatus - lève une exception si la position n'existe pas")
    void togglePositionStatus_WithInvalidId_ShouldThrow() {
        when(positionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.togglePositionStatus(999L, false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Position not found");
    }

    // ============ getPositionById ============

    @Test
    @DisplayName("getPositionById - retourne la position pour un ID valide")
    void getPositionById_WithValidId_ShouldReturn() {
        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));

        InternshipPositionDto result = positionService.getPositionById(10L);

        assertThat(result.getId()).isEqualTo(10L);
        assertThat(result.getTitle()).isEqualTo("Stage Backend Java");
    }

    @Test
    @DisplayName("getPositionById - lève exception pour ID inexistant")
    void getPositionById_WithInvalidId_ShouldThrow() {
        when(positionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.getPositionById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Position not found");
    }

    // ============ getAllPositions ============

    @Test
    @DisplayName("getAllPositions - retourne toutes les positions")
    void getAllPositions_ShouldReturnAll() {
        when(positionRepository.findAll()).thenReturn(List.of(position));

        List<InternshipPositionDto> result = positionService.getAllPositions();

        assertThat(result).hasSize(1);
    }

    // ============ getActivePositions ============

    @Test
    @DisplayName("getActivePositions - retourne seulement les positions actives")
    void getActivePositions_ShouldReturnOnlyActive() {
        when(positionRepository.findByIsActiveTrue()).thenReturn(List.of(position));

        List<InternshipPositionDto> result = positionService.getActivePositions();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getIsActive()).isTrue();
    }

    @Test
    @DisplayName("getActivePositions - retourne liste vide si aucune position active")
    void getActivePositions_WhenNoneActive_ShouldReturnEmpty() {
        when(positionRepository.findByIsActiveTrue()).thenReturn(Collections.emptyList());

        List<InternshipPositionDto> result = positionService.getActivePositions();

        assertThat(result).isEmpty();
    }

    // ============ deletePosition ============

    @Test
    @DisplayName("deletePosition - supprime la position et ses candidatures associées")
    void deletePosition_ShouldDeleteWithAssociatedCandidatures() {
        Candidature candidature = mock(Candidature.class);
        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(candidatureRepository.findByInternshipPosition_IdWithRelations(10L))
                .thenReturn(List.of(candidature));
        doNothing().when(candidatureRepository).deleteAll(anyList());
        doNothing().when(positionRepository).delete(position);

        positionService.deletePosition(10L);

        verify(candidatureRepository).deleteAll(anyList());
        verify(positionRepository).delete(position);
    }

    @Test
    @DisplayName("deletePosition - supprime la position sans candidatures associées")
    void deletePosition_WithNoCandidatures_ShouldDeleteDirectly() {
        when(positionRepository.findById(10L)).thenReturn(Optional.of(position));
        when(candidatureRepository.findByInternshipPosition_IdWithRelations(10L))
                .thenReturn(Collections.emptyList());
        doNothing().when(positionRepository).delete(position);

        positionService.deletePosition(10L);

        verify(candidatureRepository, never()).deleteAll(anyList());
        verify(positionRepository).delete(position);
    }

    @Test
    @DisplayName("deletePosition - lève exception pour ID inexistant")
    void deletePosition_WithInvalidId_ShouldThrow() {
        when(positionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> positionService.deletePosition(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Position not found");
    }

    // ============ getPositionsByManager ============

    @Test
    @DisplayName("getPositionsByManager - retourne les positions du manager")
    void getPositionsByManager_ShouldReturnManagerPositions() {
        when(positionRepository.findByCreatedBy_Id(1L)).thenReturn(List.of(position));

        List<InternshipPositionDto> result = positionService.getPositionsByManager(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCreatedBy()).isEqualTo(1L);
    }
}