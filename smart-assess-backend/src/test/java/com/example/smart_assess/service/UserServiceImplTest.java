package com.example.smart_assess.service;

import com.example.smart_assess.dto.ChangePasswordRequest;
import com.example.smart_assess.dto.CreateUserRequest;
import com.example.smart_assess.dto.UserDto;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.entity.HR;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.repository.HRRepository;
import com.example.smart_assess.repository.ManagerRepository;
import com.example.smart_assess.repository.UserRepository;
import com.example.smart_assess.service.impl.UserServiceImpl;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl Tests")
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private ManagerRepository managerRepository;
    @Mock private HRRepository hrRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private Candidate candidateEntity;
    private Manager managerEntity;
    private HR hrEntity;

    @BeforeEach
    void setUp() {
        candidateEntity = new Candidate();
        candidateEntity.setId(1L);
        candidateEntity.setEmail("candidate@proxym.com");
        candidateEntity.setPassword("encodedPass");
        candidateEntity.setFirstName("Ali");
        candidateEntity.setLastName("Ben");
        candidateEntity.setRole(Role.CANDIDATE);
        candidateEntity.setCreatedAt(LocalDateTime.now());

        managerEntity = new Manager();
        managerEntity.setId(2L);
        managerEntity.setEmail("manager@proxym.com");
        managerEntity.setPassword("encodedPass");
        managerEntity.setFirstName("Sana");
        managerEntity.setLastName("Karim");
        managerEntity.setRole(Role.MANAGER);
        managerEntity.setDepartment("IT");
        managerEntity.setCreatedAt(LocalDateTime.now());

        hrEntity = new HR();
        hrEntity.setId(3L);
        hrEntity.setEmail("hr@proxym.com");
        hrEntity.setPassword("encodedPass");
        hrEntity.setFirstName("Ines");
        hrEntity.setLastName("Mrad");
        hrEntity.setRole(Role.HR);
        hrEntity.setCreatedAt(LocalDateTime.now());
    }

    // ============ createUser ============

    @Test
    @DisplayName("createUser - crée un candidat avec succès")
    void createUser_AsCandidate_ShouldCreateSuccessfully() {
        CreateUserRequest request = new CreateUserRequest();
        request.setEmail("candidate@proxym.com");
        request.setPassword("pass123");
        request.setFirstName("Ali");
        request.setLastName("Ben");
        request.setRole(Role.CANDIDATE);

        when(userRepository.existsByEmail("candidate@proxym.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedPass");
        when(candidateRepository.save(any(Candidate.class))).thenReturn(candidateEntity);

        UserDto result = userService.createUser(request);

        assertThat(result.getEmail()).isEqualTo("candidate@proxym.com");
        assertThat(result.getRole()).isEqualTo(Role.CANDIDATE);
        verify(candidateRepository).save(any(Candidate.class));
    }

    @Test
    @DisplayName("createUser - crée un manager avec succès")
    void createUser_AsManager_ShouldCreateSuccessfully() {
        CreateUserRequest request = new CreateUserRequest();
        request.setEmail("manager@proxym.com");
        request.setPassword("pass123");
        request.setFirstName("Sana");
        request.setLastName("Karim");
        request.setRole(Role.MANAGER);

        when(userRepository.existsByEmail("manager@proxym.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedPass");
        when(managerRepository.save(any(Manager.class))).thenReturn(managerEntity);

        UserDto result = userService.createUser(request);

        assertThat(result).isNotNull();
        assertThat(result.getRole()).isEqualTo(Role.MANAGER);
        verify(managerRepository).save(any(Manager.class));
    }

    @Test
    @DisplayName("createUser - lève une exception si l'email existe déjà")
    void createUser_WithExistingEmail_ShouldThrowException() {
        CreateUserRequest request = new CreateUserRequest();
        request.setEmail("candidate@proxym.com");
        request.setPassword("pass123");
        request.setRole(Role.CANDIDATE);

        when(userRepository.existsByEmail("candidate@proxym.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Email already exists");
    }

    // ============ getUserById ============

    @Test
    @DisplayName("getUserById - retourne le DTO pour un ID existant")
    void getUserById_WithValidId_ShouldReturnUserDto() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(candidateEntity));

        UserDto result = userService.getUserById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("candidate@proxym.com");
    }

    @Test
    @DisplayName("getUserById - lève une exception si l'utilisateur n'existe pas")
    void getUserById_WithInvalidId_ShouldThrowException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    // ============ getUserByEmail ============

    @Test
    @DisplayName("getUserByEmail - retourne le DTO pour un email valide")
    void getUserByEmail_WithValidEmail_ShouldReturnUserDto() {
        when(userRepository.findByEmail("candidate@proxym.com")).thenReturn(Optional.of(candidateEntity));

        UserDto result = userService.getUserByEmail("candidate@proxym.com");

        assertThat(result.getEmail()).isEqualTo("candidate@proxym.com");
    }

    @Test
    @DisplayName("getUserByEmail - lève une exception si l'email n'existe pas")
    void getUserByEmail_WithInvalidEmail_ShouldThrowException() {
        when(userRepository.findByEmail("unknown@proxym.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserByEmail("unknown@proxym.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    // ============ getAllUsers ============

    @Test
    @DisplayName("getAllUsers - retourne tous les utilisateurs combinés")
    void getAllUsers_ShouldReturnAllUsers() {
        when(candidateRepository.findAll()).thenReturn(List.of(candidateEntity));
        when(managerRepository.findAll()).thenReturn(List.of(managerEntity));
        when(hrRepository.findAll()).thenReturn(List.of(hrEntity));
        when(candidateRepository.count()).thenReturn(1L);
        when(managerRepository.count()).thenReturn(1L);
        when(hrRepository.count()).thenReturn(1L);

        List<UserDto> result = userService.getAllUsers();

        assertThat(result).hasSize(3);
    }

    // ============ deleteUser ============

    @Test
    @DisplayName("deleteUser - supprime l'utilisateur avec succès")
    void deleteUser_WithValidId_ShouldDelete() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(candidateEntity));
        doNothing().when(userRepository).delete(candidateEntity);

        userService.deleteUser(1L);

        verify(userRepository).delete(candidateEntity);
    }

    @Test
    @DisplayName("deleteUser - lève une exception si l'utilisateur n'existe pas")
    void deleteUser_WithInvalidId_ShouldThrowException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }
}