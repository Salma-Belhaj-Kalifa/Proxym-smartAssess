package com.example.smart_assess.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtTokenUtil Tests")
class JwtTokenUtilTest {

    private JwtTokenUtil jwtTokenUtil;

    private static final String SECRET = "myTestSecretKeyThatIsLongEnoughForHS256Algorithm";
    private static final Long EXPIRATION = 86400L;

    @BeforeEach
    void setUp() {
        jwtTokenUtil = new JwtTokenUtil();
        ReflectionTestUtils.setField(jwtTokenUtil, "secret", SECRET);
        ReflectionTestUtils.setField(jwtTokenUtil, "expiration", EXPIRATION);
    }

    private UserDetails buildUser(String email) {
        return User.withUsername(email)
                .password("password")
                .authorities(Collections.emptyList())
                .build();
    }

    @Test
    @DisplayName("generateToken - retourne un token non nul pour un utilisateur valide")
    void generateToken_ShouldReturnNonNullToken() {
        UserDetails user = buildUser("test@example.com");
        String token = jwtTokenUtil.generateToken(user);
        assertThat(token).isNotNull().isNotBlank();
    }

    @Test
    @DisplayName("extractUsername - retourne le bon email depuis le token")
    void extractUsername_ShouldReturnCorrectEmail() {
        UserDetails user = buildUser("salma@proxym.com");
        String token = jwtTokenUtil.generateToken(user);
        String extractedEmail = jwtTokenUtil.extractUsername(token);
        assertThat(extractedEmail).isEqualTo("salma@proxym.com");
    }

    @Test
    @DisplayName("validateToken - retourne true pour un token valide")
    void validateToken_WithValidToken_ShouldReturnTrue() {
        UserDetails user = buildUser("hr@proxym.com");
        String token = jwtTokenUtil.generateToken(user);
        assertThat(jwtTokenUtil.validateToken(token, user)).isTrue();
    }

    @Test
    @DisplayName("validateToken - retourne false pour un mauvais utilisateur")
    void validateToken_WithWrongUser_ShouldReturnFalse() {
        UserDetails user1 = buildUser("user1@proxym.com");
        UserDetails user2 = buildUser("user2@proxym.com");
        String token = jwtTokenUtil.generateToken(user1);
        assertThat(jwtTokenUtil.validateToken(token, user2)).isFalse();
    }

    @Test
    @DisplayName("validateToken - retourne false pour un token expiré")
    void validateToken_WithExpiredToken_ShouldReturnFalse() {
        // Crée un token avec expiration très négative pour garantir l'échec
        ReflectionTestUtils.setField(jwtTokenUtil, "expiration", -86400000L); // -24 heures
        UserDetails user = buildUser("expired@proxym.com");
        String token = jwtTokenUtil.generateToken(user);

        // Le token est déjà expiré à la création, donc une exception est lancée
        assertThatThrownBy(() -> jwtTokenUtil.validateToken(token, user))
                .isInstanceOf(io.jsonwebtoken.ExpiredJwtException.class);
    }

    @Test
    @DisplayName("extractExpiration - la date d'expiration est dans le futur")
    void extractExpiration_ShouldBeInFuture() {
        UserDetails user = buildUser("test@proxym.com");
        String token = jwtTokenUtil.generateToken(user);
        assertThat(jwtTokenUtil.extractExpiration(token)).isAfter(new java.util.Date());
    }

    @Test
    @DisplayName("extractUsername - lève une exception pour un token invalide")
    void extractUsername_WithInvalidToken_ShouldThrowException() {
        assertThatThrownBy(() -> jwtTokenUtil.extractUsername("invalid.token.value"))
                .isInstanceOf(Exception.class);
    }
}