package com.example.smart_assess.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    // Durée de vie des cookies en secondes (7 jours)
    private static final int COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

    /**
     * Crée un cookie sécurisé pour le token JWT
     */
    public static Cookie createSecureCookie(String name, String value) {
        Cookie cookie = new Cookie(name, value);
        
        // Configuration de sécurité
        cookie.setHttpOnly(true);          // Non accessible via JavaScript
        cookie.setSecure(true);             // Uniquement envoyé sur HTTPS
        cookie.setPath("/");                // Disponible sur tout le site
        cookie.setMaxAge(COOKIE_MAX_AGE);    // Expire après 7 jours
        // Note: SameSite sera ajouté via ResponseHeader
        
        return cookie;
    }

    /**
     * Crée un cookie pour les données utilisateur (non HttpOnly pour le frontend)
     */
    public static Cookie createUserCookie(String name, String value) {
        Cookie cookie = new Cookie(name, value);
        
        // Configuration moins stricte pour les données utilisateur
        cookie.setHttpOnly(false);          // Accessible via JavaScript
        cookie.setSecure(true);             // Uniquement envoyé sur HTTPS
        cookie.setPath("/");                // Disponible sur tout le site
        cookie.setMaxAge(COOKIE_MAX_AGE);    // Expire après 7 jours
        // Note: SameSite sera ajouté via ResponseHeader
        
        return cookie;
    }

    /**
     * Ajoute un cookie sécurisé à la réponse avec SameSite
     */
    public static void addSecureCookie(HttpServletResponse response, String name, String value) {
        Cookie cookie = createSecureCookie(name, value);
        
        // Ajouter SameSite via ResponseHeader (méthode compatible)
        String cookieHeader = String.format("%s=%s; Path=/; Max-Age=%d; HttpOnly; Secure; SameSite=Strict",
            cookie.getName(), cookie.getValue(), cookie.getMaxAge());
        
        response.addHeader("Set-Cookie", cookieHeader);
    }

    /**
     * Ajoute un cookie utilisateur à la réponse avec SameSite
     */
    public static void addUserCookie(HttpServletResponse response, String name, String value) {
        Cookie cookie = createUserCookie(name, value);
        
        // Ajouter SameSite via ResponseHeader (méthode compatible)
        String cookieHeader = String.format("%s=%s; Path=/; Max-Age=%d; Secure; SameSite=Strict",
            cookie.getName(), cookie.getValue(), cookie.getMaxAge());
        
        response.addHeader("Set-Cookie", cookieHeader);
    }

    /**
     * Crée un cookie pour la déconnexion (suppression immédiate)
     */
    public static Cookie createDeletionCookie(String name) {
        Cookie cookie = new Cookie(name, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);                // Supprime immédiatement le cookie
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        // Note: SameSite sera ajouté via ResponseHeader
        
        return cookie;
    }

    /**
     * Supprime un cookie avec SameSite
     */
    public static void deleteCookie(HttpServletResponse response, String name) {
        // Ajouter SameSite via ResponseHeader pour la suppression
        String cookieHeader = String.format("%s=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict", name);
        response.addHeader("Set-Cookie", cookieHeader);
    }

    /**
     * Nettoie tous les cookies d'authentification
     */
    public static void clearAuthCookies(HttpServletResponse response) {
        deleteCookie(response, "auth_token");
        deleteCookie(response, "user_data");
        deleteCookie(response, "user_role");
    }
}
