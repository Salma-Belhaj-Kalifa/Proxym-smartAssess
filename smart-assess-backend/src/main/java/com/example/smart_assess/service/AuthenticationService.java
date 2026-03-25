package com.example.smart_assess.service;

import com.example.smart_assess.dto.auth.AuthResponse;
import com.example.smart_assess.dto.auth.LoginRequest;
import com.example.smart_assess.dto.CandidateDto;
import com.example.smart_assess.dto.ManagerDto;
import com.example.smart_assess.dto.HRDto;
import com.example.smart_assess.entity.User;
import com.example.smart_assess.entity.Candidate;
import com.example.smart_assess.entity.Manager;
import com.example.smart_assess.entity.HR;
import com.example.smart_assess.enums.Role;
import com.example.smart_assess.repository.UserRepository;
import com.example.smart_assess.repository.CandidateRepository;
import com.example.smart_assess.repository.ManagerRepository;
import com.example.smart_assess.repository.HRRepository;
import com.example.smart_assess.security.JwtTokenUtil;
import com.example.smart_assess.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtTokenUtil jwtTokenUtil;
    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final ManagerRepository managerRepository;
    private final HRRepository hrRepository;

    private final Map<String, String> tokenBlacklist = new HashMap<>();

    public AuthResponse authenticate(LoginRequest request) {
        try {
            // Authenticate user - cela lèvera BadCredentialsException si mauvais mot de passe
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            
            // Get user from database
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate JWT token
            String token = jwtTokenUtil.generateToken(userDetails);

            return AuthResponse.builder()
                    .token(token)
                    .id(user.getId())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .role(user.getRole())
                    .build();
                    
        } catch (Exception e) {
            // Laisser le gestionnaire d'exceptions global gérer
            log.error("Authentication failed for email: {}", request.getEmail(), e);
            throw e;
        }
    }

    public AuthResponse refreshToken(String token) {
        try {
            String email = jwtTokenUtil.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            
            if (jwtTokenUtil.validateToken(token, userDetails) && !isTokenBlacklisted(token)) {
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));

                return AuthResponse.builder()
                        .token(token)
                        .id(user.getId())
                        .email(user.getEmail())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .role(user.getRole())
                        .build();
            }
        } catch (Exception e) {
            log.error("Token refresh failed", e);
        }
        
        throw new RuntimeException("Invalid token");
    }

    public void logout(String token) {
        // Add token to blacklist
        tokenBlacklist.put(token, "blacklisted");
        log.info("Token added to blacklist: {}", token.substring(0, Math.min(token.length(), 10)) + "...");
    }

    public Object getCurrentUser(String token) {
        try {
            String email = jwtTokenUtil.extractUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            
            if (jwtTokenUtil.validateToken(token, userDetails) && !isTokenBlacklisted(token)) {
                log.info("Getting current user for email: {}", email);
                
                // Try to get candidate first
                try {
                    Candidate candidate = candidateRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("Candidate not found"));
                    log.info("Candidate found: {} with phone: '{}'", candidate.getEmail(), candidate.getPhone());
                    CandidateDto candidateDto = CandidateDto.builder()
                            .id(candidate.getId())
                            .email(candidate.getEmail())
                            .firstName(candidate.getFirstName())
                            .lastName(candidate.getLastName())
                            .phone(candidate.getPhone())
                            .createdAt(candidate.getCreatedAt())
                            .build();
                    log.info("Returning CandidateDto with phone: '{}'", candidateDto.getPhone());
                    return candidateDto;
                } catch (Exception candidateEx) {
                    log.debug("Not a candidate: {}", candidateEx.getMessage());
                }
                
                // Try to get manager
                try {
                    Manager manager = managerRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("Manager not found"));
                    log.info("Manager found: {}", manager.getEmail());
                    return ManagerDto.builder()
                            .id(manager.getId())
                            .email(manager.getEmail())
                            .firstName(manager.getFirstName())
                            .lastName(manager.getLastName())
                            .department(manager.getDepartment())
                            .createdAt(manager.getCreatedAt())
                            .build();
                } catch (Exception managerEx) {
                    log.debug("Not a manager: {}", managerEx.getMessage());
                }
                
                // Try to get HR
                try {
                    HR hr = hrRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("HR not found"));
                    log.info("HR found: {}", hr.getEmail());
                    return HRDto.builder()
                            .id(hr.getId())
                            .email(hr.getEmail())
                            .firstName(hr.getFirstName())
                            .lastName(hr.getLastName())
                            .createdAt(hr.getCreatedAt())
                            .build();
                } catch (Exception hrEx) {
                    log.debug("Not an HR: {}", hrEx.getMessage());
                }
                
                // Fallback to base user
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                log.warn("Returning base User for: {} with role: {}", email, user.getRole());
                return user;
            }
        } catch (Exception e) {
            log.error("Error getting current user: {}", e.getMessage(), e);
            return null;
        }
        
        return null;
    }

    private boolean isTokenBlacklisted(String token) {
        return tokenBlacklist.containsKey(token);
    }
}
