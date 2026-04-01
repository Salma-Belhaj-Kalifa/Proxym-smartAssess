package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateHRRequest;
import com.example.smart_assess.dto.HRDto;
import com.example.smart_assess.entity.HR;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.HRRepository;
import com.example.smart_assess.service.impl.HRServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("HRServiceImpl Tests")
class HRServiceImplTest {

    @Mock private HRRepository hrRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private HRServiceImpl hrService;

    private HR hr;

    @BeforeEach
    void setUp() {
        hr = new HR();
        hr.setId(1L);
        hr.setEmail("ines@proxym.com");
        hr.setPassword("encodedPass");
        hr.setFirstName("Ines");
        hr.setLastName("Mrad");
        hr.setDepartment("RH");
        hr.setRole(Role.HR);
        hr.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("createHR - crée un HR avec succès")
    void createHR_ShouldCreateSuccessfully() {
        CreateHRRequest request = CreateHRRequest.builder()
                .email("ines@proxym.com")
                .password("pass123")
                .firstName("Ines")
                .lastName("Mrad")
                .role(Role.HR)
                .build();

        when(hrRepository.existsByEmail("ines@proxym.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedPass");
        when(hrRepository.save(any(HR.class))).thenReturn(hr);

        HRDto result = hrService.createHR(request);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("ines@proxym.com");
        assertThat(result.getFirstName()).isEqualTo("Ines");
        verify(hrRepository).save(any(HR.class));
    }

    @Test
    @DisplayName("createHR - lève une exception si l'email existe déjà")
    void createHR_WithDuplicateEmail_ShouldThrow() {
        CreateHRRequest request = CreateHRRequest.builder()
                .email("ines@proxym.com")
                .password("pass123")
                .build();

        when(hrRepository.existsByEmail("ines@proxym.com")).thenReturn(true);

        assertThatThrownBy(() -> hrService.createHR(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already exists");
    }

    @Test
    @DisplayName("getHRById - retourne le HR pour un ID valide")
    void getHRById_WithValidId_ShouldReturn() {
        when(hrRepository.findById(1L)).thenReturn(Optional.of(hr));

        HRDto result = hrService.getHRById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("ines@proxym.com");
    }

    @Test
    @DisplayName("getHRById - lève exception pour ID inexistant")
    void getHRById_WithInvalidId_ShouldThrow() {
        when(hrRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hrService.getHRById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("HR not found");
    }

    @Test
    @DisplayName("getHREmail - retourne le HR pour un email valide")
    void getHREmail_WithValidEmail_ShouldReturn() {
        when(hrRepository.findByEmail("ines@proxym.com")).thenReturn(Optional.of(hr));

        HRDto result = hrService.getHREmail("ines@proxym.com");

        assertThat(result.getEmail()).isEqualTo("ines@proxym.com");
    }

    @Test
    @DisplayName("getAllHRs - retourne tous les HRs")
    void getAllHRs_ShouldReturnList() {
        when(hrRepository.findAll()).thenReturn(List.of(hr));

        List<HRDto> result = hrService.getAllHRs();

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("updateHR - met à jour le HR avec succès")
    void updateHR_ShouldUpdateSuccessfully() {
        CreateHRRequest request = CreateHRRequest.builder()
                .firstName("NouveauPrenom")
                .lastName("NouveauNom")
                .department("Formation")
                .build();

        when(hrRepository.findById(1L)).thenReturn(Optional.of(hr));
        when(hrRepository.save(any(HR.class))).thenReturn(hr);

        HRDto result = hrService.updateHR(1L, request);

        assertThat(result).isNotNull();
        verify(hrRepository).save(any(HR.class));
    }

    @Test
    @DisplayName("deleteHR - supprime le HR avec succès")
    void deleteHR_WithValidId_ShouldDelete() {
        when(hrRepository.findById(1L)).thenReturn(Optional.of(hr));
        doNothing().when(hrRepository).delete(hr);

        hrService.deleteHR(1L);

        verify(hrRepository).delete(hr);
    }

    @Test
    @DisplayName("deleteHR - lève exception pour ID inexistant")
    void deleteHR_WithInvalidId_ShouldThrow() {
        when(hrRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hrService.deleteHR(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("HR not found");
    }
}