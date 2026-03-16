package com.example.smart_assess.config;

import com.example.smart_assess.security.JwtAuthenticationFilter;
import com.example.smart_assess.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/debug/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/candidates/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/positions/public").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/positions/**").permitAll()
                .requestMatchers("/api/files/upload-cv/**").permitAll()
                .requestMatchers("/api/ai-analysis/analyze-cv/**").permitAll()
                .requestMatchers("/api/test/**").permitAll()
                // Manager endpoints (require MANAGER role)
                .requestMatchers("/api/managers/**").hasRole("MANAGER")
                .requestMatchers("/api/positions/**").permitAll()
                // HR endpoints (require HR or MANAGER role)
                .requestMatchers("/api/hr/**").hasAnyRole("HR", "MANAGER")
                // Candidate endpoints (require CANDIDATE role for write operations)
                .requestMatchers(HttpMethod.POST, "/api/candidates").hasRole("CANDIDATE")
                .requestMatchers(HttpMethod.PUT, "/api/candidates/**").hasRole("CANDIDATE")
                .requestMatchers(HttpMethod.DELETE, "/api/candidates/**").hasRole("CANDIDATE")
                // Technical profile endpoints (require CANDIDATE role for own profile)
                .requestMatchers(HttpMethod.GET, "/api/technical_profiles/candidate/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/technical_profiles/cv/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/technical_profiles/**").hasRole("CANDIDATE")
                .requestMatchers(HttpMethod.DELETE, "/api/technical_profiles/**").hasAnyRole("CANDIDATE", "MANAGER")
                // CV upload endpoints (require CANDIDATE role)
                .requestMatchers("/api/ai-analysis/analyze-cv/**").permitAll()
                .requestMatchers("/api/cvs/upload/**").permitAll()
                .requestMatchers("/api/simple-upload/cv/**").permitAll()
                .requestMatchers("/api/debug/**").permitAll() // Debug endpoint sans auth
                // Read-only endpoints (authenticated users)
                .requestMatchers(HttpMethod.GET, "/api/technical_profiles/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/cvs/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/candidatures/**").authenticated()
                // All other requests need authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);
        configuration.addAllowedOriginPattern("http://localhost:5173");
        configuration.addAllowedOriginPattern("http://localhost:3000");
        configuration.addAllowedOriginPattern("http://127.0.0.1:5173");
        configuration.addAllowedOriginPattern("http://127.0.0.1:3000");
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
