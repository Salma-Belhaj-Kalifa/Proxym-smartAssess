package com.example.smart_assess.service;

import com.example.smart_assess.dto.CreateManagerRequest;
import com.example.smart_assess.dto.ManagerDto;
import com.example.smart_assess.dto.UpdateProfileRequest;
import com.example.smart_assess.entity.InternshipPosition;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.CandidatureRepository;
import com.example.smart_assess.repository.InternshipPositionRepository;
import com.example.smart_assess.repository.ManagerRepository;
import com.example.smart_assess.service.impl.ManagerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
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
@DisplayName("ManagerServiceImpl Tests")
class ManagerServiceImplTest {

    @Mock private ManagerRepository managerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private InternshipPositionRepository internshipPositionRepository;
    @Mock private CandidatureRepository candidatureRepository;

    @InjectMocks
    private ManagerServiceImpl managerService;

    private Manager manager;

    @BeforeEach
    void setUp() {
        manager = new Manager();
        manager.setId(1L);
        manager.setEmail("sana@proxym.com");
        manager.setPassword("encodedPass");
        manager.setFirstName("Sana");
        manager.setLastName("Karim");
        manager.setPhone("+21697000000");
        manager.setDepartment("IT");
        manager.setRole(Role.MANAGER);
        manager.setCreatedAt(LocalDateTime.now());
    }

    // ============ createManager ============

    @Test
    @DisplayName("createManager - crée un manager avec succès")
    void createManager_ShouldCreateSuccessfully() {
        CreateManagerRequest request = CreateManagerRequest.builder()
                .email("sana@proxym.com")
                .password("pass123")
                .firstName("Sana")
                .lastName("Karim")
                .phone("+21697000000")
                .department("IT")
                .build();

        when(managerRepository.existsByEmail("sana@proxym.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedPass");
        when(managerRepository.save(any(Manager.class))).thenReturn(manager);

        ManagerDto result = managerService.createManager(request);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("sana@proxym.com");
        assertThat(result.getDepartment()).isEqualTo("IT");
        verify(managerRepository).save(any(Manager.class));
    }

    @Test
    @DisplayName("createManager - lève une exception si l'email existe déjà")
    void createManager_WithDuplicateEmail_ShouldThrow() {
        CreateManagerRequest request = CreateManagerRequest.builder()
                .email("sana@proxym.com")
                .password("pass123")
                .firstName("Sana")
                .lastName("Karim")
                .phone("+21697000000")
                .build();

        when(managerRepository.existsByEmail("sana@proxym.com")).thenReturn(true);

        assertThatThrownBy(() -> managerService.createManager(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already exists");
    }

    // ============ getManagerById ============

    @Test
    @DisplayName("getManagerById - retourne le DTO pour un ID valide")
    void getManagerById_WithValidId_ShouldReturn() {
        when(managerRepository.findById(1L)).thenReturn(Optional.of(manager));

        ManagerDto result = managerService.getManagerById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("sana@proxym.com");
    }

    @Test
    @DisplayName("getManagerById - lève exception pour ID inexistant")
    void getManagerById_WithInvalidId_ShouldThrow() {
        when(managerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> managerService.getManagerById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Manager not found");
    }

    // ============ getManagerByEmail ============

    @Test
    @DisplayName("getManagerByEmail - retourne le DTO pour un email valide")
    void getManagerByEmail_WithValidEmail_ShouldReturn() {
        when(managerRepository.findByEmail("sana@proxym.com")).thenReturn(Optional.of(manager));

        ManagerDto result = managerService.getManagerByEmail("sana@proxym.com");

        assertThat(result.getEmail()).isEqualTo("sana@proxym.com");
    }

    @Test
    @DisplayName("getManagerByEmail - lève exception pour email inexistant")
    void getManagerByEmail_WithInvalidEmail_ShouldThrow() {
        when(managerRepository.findByEmail("unknown@proxym.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> managerService.getManagerByEmail("unknown@proxym.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Manager not found");
    }

    // ============ getAllManagers ============

    @Test
    @DisplayName("getAllManagers - retourne la liste de tous les managers")
    void getAllManagers_ShouldReturnList() {
        when(managerRepository.findAll()).thenReturn(List.of(manager));

        List<ManagerDto> result = managerService.getAllManagers();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("sana@proxym.com");
    }

    @Test
    @DisplayName("getAllManagers - retourne liste vide si aucun manager")
    void getAllManagers_WhenEmpty_ShouldReturnEmptyList() {
        when(managerRepository.findAll()).thenReturn(Collections.emptyList());

        List<ManagerDto> result = managerService.getAllManagers();

        assertThat(result).isEmpty();
    }

    // ============ updateManager ============

    @Test
    @DisplayName("updateManager - met à jour le manager avec succès")
    void updateManager_ShouldUpdateSuccessfully() {
        CreateManagerRequest request = CreateManagerRequest.builder()
                .firstName("UpdatedName")
                .lastName("UpdatedLast")
                .phone("+21611000000")
                .department("Finance")
                .build();

        when(managerRepository.findById(1L)).thenReturn(Optional.of(manager));
        when(managerRepository.save(any(Manager.class))).thenReturn(manager);

        ManagerDto result = managerService.updateManager(1L, request);

        assertThat(result).isNotNull();
        verify(managerRepository).save(any(Manager.class));
    }

    @Test
    @DisplayName("updateManager - met à jour le mot de passe si fourni")
    void updateManager_WithNewPassword_ShouldEncodeAndSave() {
        CreateManagerRequest request = CreateManagerRequest.builder()
                .firstName("Sana")
                .lastName("Karim")
                .phone("+21697000000")
                .department("IT")
                .password("newPass456")
                .build();

        when(managerRepository.findById(1L)).thenReturn(Optional.of(manager));
        when(passwordEncoder.encode("newPass456")).thenReturn("newEncodedPass");
        when(managerRepository.save(any(Manager.class))).thenReturn(manager);

        managerService.updateManager(1L, request);

        verify(passwordEncoder).encode("newPass456");
        verify(managerRepository).save(any(Manager.class));
    }

    // ============ updateProfile ============

    @Test
    @DisplayName("updateProfile - met à jour le profil avec succès")
    void updateProfile_ShouldUpdateSuccessfully() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("Nouveau");
        request.setLastName("Nom");
        request.setPhone("+21699000000");
        request.setDepartment("RH");

        when(managerRepository.findById(1L)).thenReturn(Optional.of(manager));
        when(managerRepository.save(any(Manager.class))).thenReturn(manager);

        ManagerDto result = managerService.updateProfile(1L, request);

        assertThat(result).isNotNull();
        verify(managerRepository).save(manager);
    }

    // ============ deleteManager ============

    @Test
    @DisplayName("deleteManager - supprime le manager et ses données en cascade")
    void deleteManager_ShouldDeleteWithCascade() {
        InternshipPosition pos = InternshipPosition.builder().id(10L).title("Stage").build();

        when(managerRepository.findById(1L)).thenReturn(Optional.of(manager));
        when(internshipPositionRepository.findByCreatedBy_Id(1L)).thenReturn(List.of(pos));
        when(candidatureRepository.findByInternshipPosition_IdWithRelations(10L))
                .thenReturn(Collections.emptyList());
        doNothing().when(managerRepository).delete(manager);

        managerService.deleteManager(1L);

        verify(managerRepository).delete(manager);
    }

    @Test
    @DisplayName("deleteManager - lève exception pour ID inexistant")
    void deleteManager_WithInvalidId_ShouldThrow() {
        when(managerRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> managerService.deleteManager(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Manager not found");
    }

    // ============ isOwner ============

    @Test
    @DisplayName("isOwner - retourne true si l'email correspond au manager")
    void isOwner_WithMatchingEmail_ShouldReturnTrue() {
        when(managerRepository.findById(1L)).thenReturn(Optional.of(manager));

        boolean result = managerService.isOwner(1L, "sana@proxym.com");

        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("isOwner - retourne false si l'email ne correspond pas")
    void isOwner_WithDifferentEmail_ShouldReturnFalse() {
        when(managerRepository.findById(1L)).thenReturn(Optional.of(manager));

        boolean result = managerService.isOwner(1L, "other@proxym.com");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("isOwner - retourne false si le manager n'existe pas")
    void isOwner_WithInvalidId_ShouldReturnFalse() {
        when(managerRepository.findById(99L)).thenReturn(Optional.empty());

        boolean result = managerService.isOwner(99L, "sana@proxym.com");

        assertThat(result).isFalse();
    }

    // ============ deleteMyProfile ============

    @Test
    @DisplayName("deleteMyProfile - supprime le profil de l'utilisateur authentifié")
    void deleteMyProfile_ShouldDeleteAuthenticatedManager() {
        Authentication auth = new UsernamePasswordAuthenticationToken("sana@proxym.com", null);
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);

        InternshipPosition pos = InternshipPosition.builder().id(10L).title("Stage").build();
        when(managerRepository.findByEmail("sana@proxym.com")).thenReturn(Optional.of(manager));
        when(internshipPositionRepository.findByCreatedBy_Id(1L)).thenReturn(List.of(pos));
        when(candidatureRepository.findByInternshipPosition_IdWithRelations(10L))
                .thenReturn(Collections.emptyList());
        doNothing().when(managerRepository).delete(manager);

        managerService.deleteMyProfile();

        verify(managerRepository).delete(manager);
        SecurityContextHolder.clearContext();
    }
}