package com.example.smart_assess.service;

import com.example.smart_assess.dto.CandidatureDto;
import com.example.smart_assess.dto.CreateCandidatureRequest;
import com.example.smart_assess.dto.UpdateCandidatureStatusRequest;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.entity.Candidature;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.enums.CandidatureStatus;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.InternshipPositionRepository;
import com.example.smart_assess.service.impl.CandidatureServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CandidatureServiceImpl Tests")
class CandidatureServiceImplTest {

    @Mock private CandidatureRepository candidatureRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private InternshipPositionRepository positionRepository;

    @InjectMocks
    private CandidatureServiceImpl candidatureService;

    private Candidate candidate;
    private InternshipPosition position;
    private Candidature candidature;

    @BeforeEach
    void setUp() {
        candidate = new Candidate();
        candidate.setId(1L);
        candidate.setEmail("candidate@proxym.com");
        candidate.setFirstName("Ali");
        candidate.setLastName("Ben");
        candidate.setRole(Role.CANDIDATE);
        candidate.setCreatedAt(LocalDateTime.now());

        position = InternshipPosition.builder()
                .id(10L)
                .title("Stage Java")
                .company("Proxym")
                .description("Stage Spring Boot")
                .requiredSkills(List.of("Java", "Spring"))
                .acceptedDomains(List.of("Informatique"))
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .build();

        candidature = Candidature.builder()
                .id(100L)
                .candidate(candidate)
                .internshipPositions(new HashSet<>(Set.of(position)))
                .status(CandidatureStatus.PENDING)
                .appliedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ============ createCandidature ============

    @Test
    @DisplayName("createCandidature - crée une candidature avec succès")
    void createCandidature_ShouldCreateSuccessfully() {
        CreateCandidatureRequest request = new CreateCandidatureRequest();
        request.setCandidateId(1L);
        request.setPositionIds(List.of(10L));

        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(candidatureRepository.findByCandidate_Id(1L)).thenReturn(Collections.emptyList());
        when(positionRepository.findAllById(List.of(10L))).thenReturn(List.of(position));
        when(candidatureRepository.save(any(Candidature.class))).thenReturn(candidature);

        CandidatureDto result = candidatureService.createCandidature(request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getStatus()).isEqualTo(CandidatureStatus.PENDING);
        verify(candidatureRepository).save(any(Candidature.class));
    }

    @Test
    @DisplayName("createCandidature - lève une exception si le candidat n'existe pas")
    void createCandidature_WithInvalidCandidate_ShouldThrow() {
        CreateCandidatureRequest request = new CreateCandidatureRequest();
        request.setCandidateId(99L);
        request.setPositionIds(List.of(10L));

        when(candidateRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidatureService.createCandidature(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidate not found");
    }

    @Test
    @DisplayName("createCandidature - lève une exception si le candidat a déjà une candidature")
    void createCandidature_WhenAlreadyExists_ShouldThrow() {
        CreateCandidatureRequest request = new CreateCandidatureRequest();
        request.setCandidateId(1L);
        request.setPositionIds(List.of(10L));

        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(candidatureRepository.findByCandidate_Id(1L)).thenReturn(List.of(candidature));

        assertThatThrownBy(() -> candidatureService.createCandidature(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("déjà une candidature");
    }

    @Test
    @DisplayName("createCandidature - lève une exception si plus de 3 postes")
    void createCandidature_WithMoreThan3Positions_ShouldThrow() {
        CreateCandidatureRequest request = new CreateCandidatureRequest();
        request.setCandidateId(1L);
        request.setPositionIds(List.of(1L, 2L, 3L, 4L));

        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(candidatureRepository.findByCandidate_Id(1L)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> candidatureService.createCandidature(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("maximum 3 postes");
    }

    @Test
    @DisplayName("createCandidature - lève une exception si aucun poste fourni")
    void createCandidature_WithNoPositions_ShouldThrow() {
        CreateCandidatureRequest request = new CreateCandidatureRequest();
        request.setCandidateId(1L);
        // Pas de positionIds, pas de internshipPositionId

        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(candidatureRepository.findByCandidate_Id(1L)).thenReturn(Collections.emptyList());

        assertThatThrownBy(() -> candidatureService.createCandidature(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Aucun poste fourni");
    }

    // ============ updateStatus ============

    @Test
    @DisplayName("updateStatus - met à jour le statut avec succès vers ACCEPTED")
    void updateStatus_ShouldUpdateToAccepted() {
        UpdateCandidatureStatusRequest request = new UpdateCandidatureStatusRequest();
        request.setStatus(CandidatureStatus.ACCEPTED);

        when(candidatureRepository.findById(100L)).thenReturn(Optional.of(candidature));
        when(candidatureRepository.save(any(Candidature.class))).thenReturn(candidature);

        CandidatureDto result = candidatureService.updateStatus(100L, request);

        assertThat(result).isNotNull();
        verify(candidatureRepository).save(candidature);
    }

    @Test
    @DisplayName("updateStatus - met à jour le statut vers REJECTED avec raison")
    void updateStatus_ShouldUpdateToRejectedWithReason() {
        UpdateCandidatureStatusRequest request = new UpdateCandidatureStatusRequest();
        request.setStatus(CandidatureStatus.REJECTED);
        request.setRejectionReason("Profil insuffisant");

        when(candidatureRepository.findById(100L)).thenReturn(Optional.of(candidature));
        when(candidatureRepository.save(any(Candidature.class))).thenReturn(candidature);

        candidatureService.updateStatus(100L, request);

        verify(candidatureRepository).save(candidature);
        assertThat(candidature.getRejectionReason()).isEqualTo("Profil insuffisant");
    }

    @Test
    @DisplayName("updateStatus - lève une exception si la candidature n'existe pas")
    void updateStatus_WithInvalidId_ShouldThrow() {
        UpdateCandidatureStatusRequest request = new UpdateCandidatureStatusRequest();
        request.setStatus(CandidatureStatus.ACCEPTED);

        when(candidatureRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidatureService.updateStatus(999L, request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidature not found");
    }

    // ============ getCandidatureById ============

    @Test
    @DisplayName("getCandidatureById - retourne la candidature avec relations")
    void getCandidatureById_ShouldReturnWithRelations() {
        when(candidatureRepository.findByIdWithRelations(100L)).thenReturn(Optional.of(candidature));

        CandidatureDto result = candidatureService.getCandidatureById(100L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(100L);
        assertThat(result.getCandidateId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getCandidatureById - lève exception pour ID inexistant")
    void getCandidatureById_WithInvalidId_ShouldThrow() {
        when(candidatureRepository.findByIdWithRelations(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidatureService.getCandidatureById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidature not found");
    }

    // ============ getCandidaturesByCandidate ============

    @Test
    @DisplayName("getCandidaturesByCandidate - retourne les candidatures du candidat")
    void getCandidaturesByCandidate_ShouldReturnList() {
        when(candidatureRepository.findByCandidate_IdWithRelations(1L)).thenReturn(List.of(candidature));

        List<CandidatureDto> result = candidatureService.getCandidaturesByCandidate(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCandidateId()).isEqualTo(1L);
    }

    // ============ getAllCandidatures ============

    @Test
    @DisplayName("getAllCandidatures - retourne toutes les candidatures")
    void getAllCandidatures_ShouldReturnAll() {
        when(candidatureRepository.findAllWithRelations()).thenReturn(List.of(candidature));

        List<CandidatureDto> result = candidatureService.getAllCandidatures();

        assertThat(result).hasSize(1);
    }

    // ============ deleteCandidature ============

    @Test
    @DisplayName("deleteCandidature - supprime avec succès")
    void deleteCandidature_WithValidId_ShouldDelete() {
        when(candidatureRepository.findById(100L)).thenReturn(Optional.of(candidature));
        doNothing().when(candidatureRepository).delete(candidature);

        candidatureService.deleteCandidature(100L);

        verify(candidatureRepository).delete(candidature);
    }

    @Test
    @DisplayName("deleteCandidature - lève exception pour ID inexistant")
    void deleteCandidature_WithInvalidId_ShouldThrow() {
        when(candidatureRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidatureService.deleteCandidature(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidature not found");
    }

    // ============ getCandidaturesByStatus ============

    @Test
    @DisplayName("getCandidaturesByStatus - retourne les candidatures PENDING")
    void getCandidaturesByStatus_ShouldReturnFiltered() {
        when(candidatureRepository.findByStatus(CandidatureStatus.PENDING))
                .thenReturn(List.of(candidature));

        List<CandidatureDto> result = candidatureService.getCandidaturesByStatus(CandidatureStatus.PENDING);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStatus()).isEqualTo(CandidatureStatus.PENDING);
    }
}