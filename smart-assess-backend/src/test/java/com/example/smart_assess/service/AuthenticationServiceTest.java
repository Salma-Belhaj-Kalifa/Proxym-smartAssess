package com.example.smart_assess.service;

import com.example.smart_assess.dto.auth.AuthResponse;
import com.example.smart_assess.dto.auth.LoginRequest;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.entity.HR;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.repository.HRRepository;
import com.example.smart_assess.repository.ManagerRepository;
import com.example.smart_assess.repository.UserRepository;
import com.example.smart_assess.security.JwtTokenUtil;
import com.example.smart_assess.security.UserDetailsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthenticationService Tests")
class AuthenticationServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserDetailsServiceImpl userDetailsService;
    @Mock private JwtTokenUtil jwtTokenUtil;
    @Mock private UserRepository userRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private ManagerRepository managerRepository;
    @Mock private HRRepository hrRepository;

    @InjectMocks
    private AuthenticationService authenticationService;

    private UserDetails userDetails;
    private Candidate candidate;
    private Manager manager;
    private HR hr;

    @BeforeEach
    void setUp() {
        userDetails = User.withUsername("candidate@proxym.com")
                .password("encodedPass")
                .authorities(Collections.emptyList())
                .build();

        candidate = new Candidate();
        candidate.setId(1L);
        candidate.setEmail("candidate@proxym.com");
        candidate.setPassword("encodedPass");
        candidate.setFirstName("Ali");
        candidate.setLastName("Ben");
        candidate.setRole(Role.CANDIDATE);
        candidate.setCreatedAt(LocalDateTime.now());

        manager = new Manager();
        manager.setId(2L);
        manager.setEmail("manager@proxym.com");
        manager.setPassword("encodedPass");
        manager.setFirstName("Sana");
        manager.setLastName("Karim");
        manager.setDepartment("IT");
        manager.setRole(Role.MANAGER);
        manager.setCreatedAt(LocalDateTime.now());

        hr = new HR();
        hr.setId(3L);
        hr.setEmail("hr@proxym.com");
        hr.setPassword("encodedPass");
        hr.setFirstName("Ines");
        hr.setLastName("Mrad");
        hr.setRole(Role.HR);
        hr.setCreatedAt(LocalDateTime.now());
    }

    // ============ authenticate ============

    @Test
    @DisplayName("authenticate - retourne AuthResponse pour un candidat valide")
    void authenticate_WithValidCandidateCredentials_ShouldReturnResponse() {
        LoginRequest request = LoginRequest.builder()
                .email("candidate@proxym.com")
                .password("pass123")
                .build();

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("candidate@proxym.com")).thenReturn(Optional.of(candidate));
        when(jwtTokenUtil.generateToken(userDetails)).thenReturn("mocked.jwt.token");

        AuthResponse result = authenticationService.authenticate(request);

        assertThat(result).isNotNull();
        assertThat(result.getToken()).isEqualTo("mocked.jwt.token");
        assertThat(result.getEmail()).isEqualTo("candidate@proxym.com");
        assertThat(result.getRole()).isEqualTo(Role.CANDIDATE);
        assertThat(result.getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("authenticate - lève BadCredentialsException pour mot de passe incorrect")
    void authenticate_WithWrongPassword_ShouldThrow() {
        LoginRequest request = LoginRequest.builder()
                .email("candidate@proxym.com")
                .password("wrongpass")
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authenticationService.authenticate(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("authenticate - retourne AuthResponse pour un manager valide")
    void authenticate_WithValidManagerCredentials_ShouldReturnResponse() {
        LoginRequest request = LoginRequest.builder()
                .email("manager@proxym.com")
                .password("pass123")
                .build();

        UserDetails managerDetails = User.withUsername("manager@proxym.com")
                .password("encodedPass")
                .authorities(Collections.emptyList())
                .build();

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(managerDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(userRepository.findByEmail("manager@proxym.com")).thenReturn(Optional.of(manager));
        when(jwtTokenUtil.generateToken(managerDetails)).thenReturn("manager.jwt.token");

        AuthResponse result = authenticationService.authenticate(request);

        assertThat(result.getRole()).isEqualTo(Role.MANAGER);
        assertThat(result.getToken()).isEqualTo("manager.jwt.token");
    }

    // ============ refreshToken ============

    @Test
    @DisplayName("refreshToken - retourne AuthResponse pour un token valide")
    void refreshToken_WithValidToken_ShouldReturnResponse() {
        when(jwtTokenUtil.extractUsername("valid.token")).thenReturn("candidate@proxym.com");
        when(userDetailsService.loadUserByUsername("candidate@proxym.com")).thenReturn(userDetails);
        when(jwtTokenUtil.validateToken("valid.token", userDetails)).thenReturn(true);
        when(userRepository.findByEmail("candidate@proxym.com")).thenReturn(Optional.of(candidate));

        AuthResponse result = authenticationService.refreshToken("valid.token");

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("candidate@proxym.com");
        assertThat(result.getToken()).isEqualTo("valid.token");
    }

    @Test
    @DisplayName("refreshToken - lève une exception pour un token blacklisté")
    void refreshToken_WithBlacklistedToken_ShouldThrow() {
        // D'abord, blacklister le token
        authenticationService.logout("blacklisted.token");

        when(jwtTokenUtil.extractUsername("blacklisted.token")).thenReturn("candidate@proxym.com");
        when(userDetailsService.loadUserByUsername("candidate@proxym.com")).thenReturn(userDetails);
        when(jwtTokenUtil.validateToken("blacklisted.token", userDetails)).thenReturn(true);

        assertThatThrownBy(() -> authenticationService.refreshToken("blacklisted.token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid token");
    }

    @Test
    @DisplayName("refreshToken - lève une exception pour un token invalide")
    void refreshToken_WithInvalidToken_ShouldThrow() {
        when(jwtTokenUtil.extractUsername("invalid.token")).thenThrow(new RuntimeException("Invalid JWT"));

        assertThatThrownBy(() -> authenticationService.refreshToken("invalid.token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid token");
    }

    // ============ logout ============

    @Test
    @DisplayName("logout - ajoute le token à la blacklist")
    void logout_ShouldBlacklistToken() {
        // Après logout, refreshToken doit échouer
        authenticationService.logout("token.to.blacklist");

        when(jwtTokenUtil.extractUsername("token.to.blacklist")).thenReturn("candidate@proxym.com");
        when(userDetailsService.loadUserByUsername("candidate@proxym.com")).thenReturn(userDetails);
        when(jwtTokenUtil.validateToken("token.to.blacklist", userDetails)).thenReturn(true);

        assertThatThrownBy(() -> authenticationService.refreshToken("token.to.blacklist"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid token");
    }

    // ============ getCurrentUser ============

    @Test
    @DisplayName("getCurrentUser - retourne CandidateDto pour un token candidat valide")
    void getCurrentUser_WithCandidateToken_ShouldReturnCandidateDto() {
        when(jwtTokenUtil.extractUsername("candidate.token")).thenReturn("candidate@proxym.com");
        when(userDetailsService.loadUserByUsername("candidate@proxym.com")).thenReturn(userDetails);
        when(jwtTokenUtil.validateToken("candidate.token", userDetails)).thenReturn(true);
        when(candidateRepository.findByEmail("candidate@proxym.com")).thenReturn(Optional.of(candidate));

        Object result = authenticationService.getCurrentUser("candidate.token");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getCurrentUser - retourne ManagerDto pour un token manager valide")
    void getCurrentUser_WithManagerToken_ShouldReturnManagerDto() {
        UserDetails managerDetails = User.withUsername("manager@proxym.com")
                .password("encodedPass")
                .authorities(Collections.emptyList())
                .build();

        when(jwtTokenUtil.extractUsername("manager.token")).thenReturn("manager@proxym.com");
        when(userDetailsService.loadUserByUsername("manager@proxym.com")).thenReturn(managerDetails);
        when(jwtTokenUtil.validateToken("manager.token", managerDetails)).thenReturn(true);
        when(candidateRepository.findByEmail("manager@proxym.com")).thenReturn(Optional.empty());
        when(managerRepository.findByEmail("manager@proxym.com")).thenReturn(Optional.of(manager));

        Object result = authenticationService.getCurrentUser("manager.token");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getCurrentUser - retourne HRDto pour un token HR valide")
    void getCurrentUser_WithHRToken_ShouldReturnHRDto() {
        UserDetails hrDetails = User.withUsername("hr@proxym.com")
                .password("encodedPass")
                .authorities(Collections.emptyList())
                .build();

        when(jwtTokenUtil.extractUsername("hr.token")).thenReturn("hr@proxym.com");
        when(userDetailsService.loadUserByUsername("hr@proxym.com")).thenReturn(hrDetails);
        when(jwtTokenUtil.validateToken("hr.token", hrDetails)).thenReturn(true);
        when(candidateRepository.findByEmail("hr@proxym.com")).thenReturn(Optional.empty());
        when(managerRepository.findByEmail("hr@proxym.com")).thenReturn(Optional.empty());
        when(hrRepository.findByEmail("hr@proxym.com")).thenReturn(Optional.of(hr));

        Object result = authenticationService.getCurrentUser("hr.token");

        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("getCurrentUser - retourne null pour un token invalide")
    void getCurrentUser_WithInvalidToken_ShouldReturnNull() {
        when(jwtTokenUtil.extractUsername("bad.token")).thenThrow(new RuntimeException("Invalid JWT"));

        Object result = authenticationService.getCurrentUser("bad.token");

        assertThat(result).isNull();
    }

    @Test
    @DisplayName("getCurrentUser - retourne null pour un token blacklisté")
    void getCurrentUser_WithBlacklistedToken_ShouldReturnNull() {
        authenticationService.logout("blacklisted.token");

        when(jwtTokenUtil.extractUsername("blacklisted.token")).thenReturn("candidate@proxym.com");
        when(userDetailsService.loadUserByUsername("candidate@proxym.com")).thenReturn(userDetails);
        when(jwtTokenUtil.validateToken("blacklisted.token", userDetails)).thenReturn(true);

        Object result = authenticationService.getCurrentUser("blacklisted.token");

        assertThat(result).isNull();
    }
}