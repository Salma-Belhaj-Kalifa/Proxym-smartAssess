package com.example.smart_assess.controller;

import com.example.smart_assess.dto.auth.AuthResponse;
import com.example.smart_assess.dto.auth.LoginRequest;
import com.example.smart_assess.dto.auth.RegisterRequest;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.service.AuthenticationService;
import com.example.smart_assess.service.CandidateService;
import com.example.smart_assess.service.HRService;
import com.example.smart_assess.service.ManagerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AuthController Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TestRestTemplate restTemplate;

    @MockBean private AuthenticationService authenticationService;
    @MockBean private CandidateService candidateService;
    @MockBean private ManagerService managerService;
    @MockBean private HRService hrService;

    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        authResponse = AuthResponse.builder()
                .token("aaa.bbb.ccc")
                .id(1L)
                .email("candidate@proxym.com")
                .firstName("Ali")
                .lastName("Ben")
                .role(Role.CANDIDATE)
                .active(true)
                .type("Bearer")
                .build();
    }

    // ============ POST /api/auth/login ============

    @Test
    @DisplayName("POST /login - retourne 200 avec token pour credentials valides")
    void login_WithValidCredentials_ShouldReturn200() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("candidate@proxym.com")
                .password("pass123")
                .build();

        when(authenticationService.authenticate(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("aaa.bbb.ccc"))
                .andExpect(jsonPath("$.email").value("candidate@proxym.com"))
                .andExpect(jsonPath("$.role").value("CANDIDATE"));
    }

    @Test
    @DisplayName("POST /login - retourne 400 si email manquant")
    void login_WithMissingEmail_ShouldReturn400() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .password("pass123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /login - retourne 401 pour credentials invalides")
    void login_WithInvalidCredentials_ShouldReturn401() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("candidate@proxym.com")
                .password("wrongpass")
                .build();

        when(authenticationService.authenticate(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    // ============ POST /api/auth/register ============

    @Test
    @DisplayName("POST /register - enregistre un candidat avec succès")
    void register_AsCandidate_ShouldReturn200() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newcandidate@proxym.com");
        request.setPassword("pass123");
        request.setFirstName("Nouveau");
        request.setLastName("Candidat");
        request.setPhone("+21698000000");
        request.setRole(Role.CANDIDATE);

        // Les méthodes createCandidate et createHR retournent des DTOs
        when(candidateService.createCandidate(any())).thenReturn(new com.example.smart_assess.dto.CandidateDto());
        when(authenticationService.authenticate(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("POST /register - enregistre un HR avec succès")
    void register_AsHR_ShouldReturn200() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newhr@proxym.com");
        request.setPassword("pass123");
        request.setFirstName("Nouveau");
        request.setLastName("HR");
        request.setRole(Role.HR);

        // Les méthodes createCandidate et createHR retournent des DTOs
        when(hrService.createHR(any())).thenReturn(new com.example.smart_assess.dto.HRDto());
        when(authenticationService.authenticate(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /register - retourne 400 si email déjà existant")
    void register_WithExistingEmail_ShouldReturn400() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@proxym.com");
        request.setPassword("pass123");
        request.setFirstName("Test");
        request.setLastName("User");
        request.setRole(Role.CANDIDATE);

        doThrow(new IllegalArgumentException("Email already exists"))
                .when(candidateService).createCandidate(any());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already exists"));
    }

    // ============ POST /api/auth/refresh ============

    @Test
    @DisplayName("POST /refresh - retourne 200 pour un token valide")
    void refresh_WithValidToken_ShouldReturn200() throws Exception {
        when(authenticationService.refreshToken("valid.jwt.token")).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Authorization", "Bearer valid.jwt.token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("POST /refresh - retourne 401 pour un token invalide")
    void refresh_WithInvalidToken_ShouldReturn401() throws Exception {
        when(authenticationService.refreshToken("invalid.token"))
                .thenThrow(new RuntimeException("Invalid token"));

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Authorization", "Bearer invalid.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /refresh - retourne 400 si header Authorization manquant")
    void refresh_WithMissingHeader_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                        .header("Authorization", ""))
                .andExpect(status().isBadRequest());
    }

    // ============ POST /api/auth/logout ============

    @Test
    @DisplayName("POST /logout - retourne 200 avec message de succès")
    void logout_ShouldReturn200() throws Exception {
        doNothing().when(authenticationService).logout("valid.jwt.token");

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer valid.jwt.token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Déconnexion réussie"));
    }

    @Test
    @DisplayName("POST /logout - retourne 200 même sans Authorization header")
    void logout_WithoutToken_ShouldReturn200() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk());
    }


    @Test
    @DisplayName("GET /me - retourne 401 si utilisateur non authentifié")
    void getCurrentUser_WithoutToken_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
