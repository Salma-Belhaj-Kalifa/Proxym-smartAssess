package com.example.smart_assess.service;

import com.example.smart_assess.dto.auth.AuthResponse;
import com.example.smart_assess.dto.auth.LoginRequest;
import com.example.smart_assess.entity.User;
import com.example.smart_assess.repository.UserRepository;
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

    private boolean isTokenBlacklisted(String token) {
        return tokenBlacklist.containsKey(token);
    }
}
