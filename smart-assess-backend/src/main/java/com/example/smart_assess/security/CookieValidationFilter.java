package com.example.smart_assess.security;

import com.example.smart_assess.util.CookieUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
@Slf4j
public class CookieValidationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, 
            HttpServletResponse response, 
            FilterChain filterChain) throws ServletException, IOException {
        
        // Valider les cookies pour les requêtes API
        if (request.getRequestURI().startsWith("/api/")) {
            validateCookies(request, response);
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Valide les cookies d'authentification
     */
    private void validateCookies(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        
        if (cookies == null || cookies.length == 0) {
            log.debug("No cookies found in request");
            return;
        }
        
        // Vérifier les cookies d'authentification
        boolean hasAuthToken = false;
        boolean hasUserData = false;
        
        for (Cookie cookie : cookies) {
            switch (cookie.getName()) {
                case "auth_token":
                    hasAuthToken = validateAuthTokenCookie(cookie, request);
                    break;
                case "user_data":
                    hasUserData = validateUserDataCookie(cookie, request);
                    break;
            }
        }
        
        // Log des validations
        if (hasAuthToken && hasUserData) {
            log.debug("Valid authentication cookies found");
        } else if (hasAuthToken) {
            log.debug("Auth token found but user data missing");
        } else if (hasUserData) {
            log.debug("User data found but auth token missing");
        }
    }
    
    /**
     * Valide le cookie du token d'authentification
     */
    private boolean validateAuthTokenCookie(Cookie cookie, HttpServletRequest request) {
        // Vérifier si le cookie est HttpOnly (ne devrait pas être accessible via JavaScript)
        if (!cookie.isHttpOnly()) {
            log.warn("Security warning: auth_token cookie is not HttpOnly");
            return false;
        }
        
        // Vérifier si le cookie est sécurisé (HTTPS uniquement)
        if (!cookie.getSecure()) {
            log.warn("Security warning: auth_token cookie is not secure");
            return false;
        }
        
        // Vérifier si le cookie utilise SameSite=Strict
        String cookieHeader = request.getHeader("Cookie");
        if (cookieHeader != null && !cookieHeader.contains("SameSite=")) {
            log.warn("Security warning: auth_token cookie missing SameSite attribute");
        }
        
        // Vérifier si le token n'est pas vide
        if (cookie.getValue() == null || cookie.getValue().trim().isEmpty()) {
            log.warn("Security warning: auth_token cookie is empty");
            return false;
        }
        
        // Vérifier la longueur du token (JWT typiquement long)
        if (cookie.getValue().length() < 50) {
            log.warn("Security warning: auth_token appears too short");
            return false;
        }
        
        return true;
    }
    
    /**
     * Valide le cookie des données utilisateur
     */
    private boolean validateUserDataCookie(Cookie cookie, HttpServletRequest request) {
        // Vérifier si le cookie n'est pas HttpOnly (doit être accessible via JavaScript)
        if (cookie.isHttpOnly()) {
            log.warn("Warning: user_data cookie should not be HttpOnly for frontend access");
        }
        
        // Vérifier si le cookie est sécurisé (HTTPS uniquement)
        if (!cookie.getSecure()) {
            log.warn("Security warning: user_data cookie is not secure");
            return false;
        }
        
        // Vérifier si le cookie utilise SameSite=Strict
        String cookieHeader = request.getHeader("Cookie");
        if (cookieHeader != null && !cookieHeader.contains("SameSite=")) {
            log.warn("Security warning: user_data cookie missing SameSite attribute");
        }
        
        // Vérifier si les données ne sont pas vides
        if (cookie.getValue() == null || cookie.getValue().trim().isEmpty()) {
            log.warn("Security warning: user_data cookie is empty");
            return false;
        }
        
        // Tenter de parser les données JSON
        try {
            // Vérifier si ça ressemble à du JSON (commence par { et se termine par })
            String value = cookie.getValue().trim();
            if (!value.startsWith("{") || !value.endsWith("}")) {
                log.warn("Security warning: user_data cookie does not contain valid JSON");
                return false;
            }
        } catch (Exception e) {
            log.warn("Security warning: user_data cookie validation failed: {}", e.getMessage());
            return false;
        }
        
        return true;
    }
}
