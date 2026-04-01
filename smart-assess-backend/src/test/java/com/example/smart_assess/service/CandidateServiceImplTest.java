package com.example.smart_assess.service;

import com.example.smart_assess.dto.CandidateDto;
import com.example.smart_assess.dto.CreateCandidateRequest;
import com.example.smart_assess.dto.UpdateCandidateProfileRequest;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.GeneratedTestRepository;
import com.example.smart_assess.service.impl.CandidateServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CandidateServiceImpl Tests")
class CandidateServiceImplTest {

    @Mock private CandidateRepository candidateRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private CandidatureRepository candidatureRepository;
    @Mock private GeneratedTestRepository generatedTestRepository;

    @InjectMocks
    private CandidateServiceImpl candidateService;

    private Candidate candidate;

    @BeforeEach
    void setUp() {
        candidate = new Candidate();
        candidate.setId(1L);
        candidate.setEmail("ali@proxym.com");
        candidate.setPassword("encodedPass");
        candidate.setFirstName("Ali");
        candidate.setLastName("Ben Ali");
        candidate.setPhone("+21698765432");
        candidate.setRole(Role.CANDIDATE);
        candidate.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("createCandidate - crée un candidat avec succès")
    void createCandidate_ShouldCreateSuccessfully() {
        CreateCandidateRequest request = CreateCandidateRequest.builder()
                .email("ali@proxym.com")
                .password("pass123")
                .firstName("Ali")
                .lastName("Ben Ali")
                .phone("+21698765432")
                .build();

        when(candidateRepository.existsByEmail("ali@proxym.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedPass");
        when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

        CandidateDto result = candidateService.createCandidate(request);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("ali@proxym.com");
        assertThat(result.getFirstName()).isEqualTo("Ali");
        assertThat(result.getPhone()).isEqualTo("+21698765432");
        verify(candidateRepository).save(any(Candidate.class));
    }

    @Test
    @DisplayName("createCandidate - lève une exception si l'email existe déjà")
    void createCandidate_WithDuplicateEmail_ShouldThrow() {
        CreateCandidateRequest request = CreateCandidateRequest.builder()
                .email("ali@proxym.com")
                .password("pass123")
                .build();

        when(candidateRepository.existsByEmail("ali@proxym.com")).thenReturn(true);

        assertThatThrownBy(() -> candidateService.createCandidate(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already exists");
    }

    @Test
    @DisplayName("getCandidateById - retourne le candidat pour un ID valide")
    void getCandidateById_WithValidId_ShouldReturn() {
        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));

        CandidateDto result = candidateService.getCandidateById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("ali@proxym.com");
    }

    @Test
    @DisplayName("getCandidateById - lève exception pour ID inexistant")
    void getCandidateById_WithInvalidId_ShouldThrow() {
        when(candidateRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidateService.getCandidateById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidate not found");
    }

    @Test
    @DisplayName("getCandidateByEmail - retourne le candidat pour un email valide")
    void getCandidateByEmail_WithValidEmail_ShouldReturn() {
        when(candidateRepository.findByEmail("ali@proxym.com")).thenReturn(Optional.of(candidate));

        CandidateDto result = candidateService.getCandidateByEmail("ali@proxym.com");

        assertThat(result.getEmail()).isEqualTo("ali@proxym.com");
    }

    @Test
    @DisplayName("getAllCandidates - retourne la liste de tous les candidats")
    void getAllCandidates_ShouldReturnList() {
        when(candidateRepository.findAll()).thenReturn(List.of(candidate));

        List<CandidateDto> result = candidateService.getAllCandidates();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("ali@proxym.com");
    }

    @Test
    @DisplayName("getAllCandidates - retourne liste vide si aucun candidat")
    void getAllCandidates_WhenEmpty_ShouldReturnEmptyList() {
        when(candidateRepository.findAll()).thenReturn(Collections.emptyList());

        List<CandidateDto> result = candidateService.getAllCandidates();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("updateCandidate - met à jour le candidat avec succès")
    void updateCandidate_ShouldUpdateSuccessfully() {
        CreateCandidateRequest request = CreateCandidateRequest.builder()
                .firstName("UpdatedName")
                .lastName("UpdatedLast")
                .phone("+21611111111")
                .build();

        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

        CandidateDto result = candidateService.updateCandidate(1L, request);

        assertThat(result).isNotNull();
        verify(candidateRepository).save(any(Candidate.class));
    }

    @Test
    @DisplayName("updateProfile - met à jour le profil du candidat")
    void updateProfile_ShouldUpdateSuccessfully() {
        UpdateCandidateProfileRequest request = new UpdateCandidateProfileRequest();
        request.setFirstName("Nouveau");
        request.setLastName("Nom");
        request.setPhone("+21622222222");

        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);

        CandidateDto result = candidateService.updateProfile(1L, request);

        assertThat(result).isNotNull();
        verify(candidateRepository).save(candidate);
    }

    @Test
    @DisplayName("deleteCandidate - supprime le candidat avec succès")
    void deleteCandidate_WithValidId_ShouldDelete() {
        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(candidatureRepository.findByCandidate_Id(1L)).thenReturn(Collections.emptyList());
        doNothing().when(candidateRepository).delete(candidate);

        candidateService.deleteCandidate(1L);

        verify(candidateRepository).delete(candidate);
    }

    @Test
    @DisplayName("deleteCandidate - lève une exception si le candidat n'existe pas")
    void deleteCandidate_WithInvalidId_ShouldThrow() {
        when(candidateRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> candidateService.deleteCandidate(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Candidate not found");
    }

    @Test
    @DisplayName("isOwner - retourne true si l'email correspond au candidat")
    void isOwner_WithMatchingEmail_ShouldReturnTrue() {
        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));

        boolean result = candidateService.isOwner(1L, "ali@proxym.com");

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("isOwner - retourne false si l'email ne correspond pas")
    void isOwner_WithDifferentEmail_ShouldReturnFalse() {
        when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));

        boolean result = candidateService.isOwner(1L, "other@proxym.com");

        assertThat(result).isFalse();
    }
}