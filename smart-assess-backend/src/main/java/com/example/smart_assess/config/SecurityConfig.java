package com.example.smart_assess.config;

import com.example.smart_assess.security.JwtAuthenticationFilter;
import com.example.smart_assess.security.UserDetailsServiceImpl;
import com.example.smart_assess.security.CookieValidationFilter;
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
    private final CookieValidationFilter cookieValidationFilter;

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
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/debug/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(
                    "/v3/api-docs/**",
                    "/v3/api-docs.yaml",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/swagger-resources/**",
                    "/webjars/**"
                ).permitAll()
                .requestMatchers(HttpMethod.GET, "/api/positions").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/positions/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/positions").hasRole("MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/positions/**").hasRole("MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/api/positions/**").hasRole("MANAGER")
                .requestMatchers(HttpMethod.PATCH, "/api/positions/**").hasRole("MANAGER")
                
                .requestMatchers(HttpMethod.GET, "/api/candidates").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/candidates/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/candidates").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/candidates/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/candidates/**").authenticated()
                
                .requestMatchers("/api/files/upload-cv/**").permitAll()
                .requestMatchers("/api/ai-analysis/analyze-cv/**").permitAll()
                .requestMatchers("/api/cvs/upload/**").permitAll()
                .requestMatchers("/api/simple-upload/cv/**").permitAll()
                
                .requestMatchers("/api/test/**").permitAll()
                .requestMatchers("/api/tests/public/**").permitAll()

                .requestMatchers(HttpMethod.POST, "/api/tests/*/submit").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/tests/*/start").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tests/check-existing/**").hasRole("MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/tests/**").hasRole("MANAGER")
                .requestMatchers(HttpMethod.PUT, "/api/tests/**").hasRole("MANAGER")
                
                .requestMatchers("/api/managers/**").hasRole("MANAGER")
                
                .requestMatchers("/api/hr/**").hasAnyRole("HR", "MANAGER")
                
                .requestMatchers(HttpMethod.GET, "/api/technical_profiles/candidate/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/technical_profiles/cv/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/technical_profiles/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/technical_profiles/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/technical_profiles/**").authenticated()
                
                .requestMatchers(HttpMethod.GET, "/api/candidatures/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/candidatures").permitAll()
                .requestMatchers(HttpMethod.PUT, "/api/candidatures/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/candidatures/**").authenticated()
                
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(cookieValidationFilter, UsernamePasswordAuthenticationFilter.class)
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
