package com.example.smart_assess.controller;

import com.example.smart_assess.dto.auth.AuthResponse;
import com.example.smart_assess.dto.auth.LoginRequest;
import com.example.smart_assess.dto.auth.RegisterRequest;
import com.example.smart_assess.dto.CreateCandidateRequest;
import com.example.smart_assess.dto.CreateManagerRequest;
import com.example.smart_assess.dto.CreateHRRequest;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.service.AuthenticationService;
import com.example.smart_assess.service.CandidateService;
import com.example.smart_assess.service.ManagerService;
import com.example.smart_assess.service.HRService;
import com.example.smart_assess.util.CookieUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationService authenticationService;
    private final CandidateService candidateService;
    private final ManagerService managerService;
    private final HRService hrService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest loginRequest, 
            HttpServletResponse response) {
        log.info("Login attempt for email: {}", loginRequest.getEmail());

        // Laisser le gestionnaire d'exceptions global gérer les erreurs
        AuthResponse authResponse = authenticationService.authenticate(loginRequest);

        // Créer des cookies sécurisés
        CookieUtil.addSecureCookie(response, "auth_token", authResponse.getToken());
        
        // Ajouter les données utilisateur dans un cookie (non HttpOnly pour le frontend)
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            
            // Créer un objet utilisateur avec les données de AuthResponse
            Map<String, Object> userData = Map.of(
                "id", authResponse.getId(),
                "email", authResponse.getEmail(),
                "firstName", authResponse.getFirstName(),
                "lastName", authResponse.getLastName(),
                "role", authResponse.getRole(),
                "active", authResponse.isActive(),
                "token", authResponse.getToken(),
                "type", authResponse.getType()
            );
            
            String userJson = objectMapper.writeValueAsString(userData);
            CookieUtil.addUserCookie(response, "user_data", userJson);
        } catch (Exception e) {
            log.warn("Failed to serialize user data for cookie: {}", e.getMessage());
        }

        log.info("Login successful for email: {}", loginRequest.getEmail());
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest registerRequest,
            HttpServletResponse response) {
        log.info("Registration attempt for email: {} with role: {}", registerRequest.getEmail(), registerRequest.getRole());

        try {
            switch (registerRequest.getRole()) {
                case CANDIDATE -> {
                    CreateCandidateRequest candidateRequest = CreateCandidateRequest.builder()
                            .email(registerRequest.getEmail())
                            .firstName(registerRequest.getFirstName())
                            .lastName(registerRequest.getLastName())
                            .phone(registerRequest.getPhone())
                            .password(registerRequest.getPassword())
                            .role(registerRequest.getRole())
                            .build();
                    candidateService.createCandidate(candidateRequest);
                }
                case MANAGER -> {
                    CreateManagerRequest managerRequest = CreateManagerRequest.builder()
                            .email(registerRequest.getEmail())
                            .firstName(registerRequest.getFirstName())
                            .lastName(registerRequest.getLastName())
                            .password(registerRequest.getPassword())
                            .department("General")
                            .role(registerRequest.getRole())
                            .build();
                    managerService.createManager(managerRequest);
                }
                case HR -> {
                    CreateHRRequest hrRequest = CreateHRRequest.builder()
                            .email(registerRequest.getEmail())
                            .firstName(registerRequest.getFirstName())
                            .lastName(registerRequest.getLastName())
                            .password(registerRequest.getPassword())
                            .role(registerRequest.getRole())
                            .build();
                    hrService.createHR(hrRequest);
                }
                default -> {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Rôle non supporté : " + registerRequest.getRole()));
                }
            }

            // Login automatique après inscription
            LoginRequest loginRequest = LoginRequest.builder()
                    .email(registerRequest.getEmail())
                    .password(registerRequest.getPassword())
                    .build();

            AuthResponse authResponse = authenticationService.authenticate(loginRequest);
            
            // Créer des cookies sécurisés pour le nouvel utilisateur
            CookieUtil.addSecureCookie(response, "auth_token", authResponse.getToken());
            
            // Ajouter les données utilisateur dans un cookie (non HttpOnly pour le frontend)
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                
                // Créer un objet utilisateur avec les données de AuthResponse
                Map<String, Object> userData = Map.of(
                    "id", authResponse.getId(),
                    "email", authResponse.getEmail(),
                    "firstName", authResponse.getFirstName(),
                    "lastName", authResponse.getLastName(),
                    "role", authResponse.getRole(),
                    "active", authResponse.isActive(),
                    "token", authResponse.getToken(),
                    "type", authResponse.getType()
                );
                
                String userJson = objectMapper.writeValueAsString(userData);
                CookieUtil.addUserCookie(response, "user_data", userJson);
            } catch (Exception e) {
                log.warn("Failed to serialize user data for cookie: {}", e.getMessage());
            }
            
            log.info("Registration successful for email: {} with role: {}", registerRequest.getEmail(), registerRequest.getRole());
            return ResponseEntity.ok(authResponse);

        } catch (IllegalArgumentException ex) {
            log.warn("Registration failed for email {}: {}", registerRequest.getEmail(), ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            log.error("Unexpected error during registration for email {}: {}", registerRequest.getEmail(), ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur serveur lors de l'inscription."));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestHeader("Authorization") String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                String token = authorization.substring(7);
                AuthResponse response = authenticationService.refreshToken(token);
                return ResponseEntity.ok(response);
            } catch (Exception ex) {
                log.error("Token refresh failed: {}", ex.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Token invalide ou expiré."));
            }
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Authorization header manquant ou mal formé."));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            HttpServletResponse response) {
        log.info("Logout attempt");

        try {
            if (authorization != null && authorization.startsWith("Bearer ")) {
                String token = authorization.substring(7);
                authenticationService.logout(token);
            }
            
            // Nettoyer tous les cookies d'authentification
            CookieUtil.clearAuthCookies(response);
            
            return ResponseEntity.ok(Map.of("message", "Déconnexion réussie"));
        } catch (Exception ex) {
            log.error("Logout failed: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la déconnexion."));
        }
    }
}