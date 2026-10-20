package com.ivanta.config;

import com.ivanta.security.RestAuthHandlers;
import com.ivanta.security.SessionAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
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

import java.util.List;

/**
 * Security configuration (§10/§11/§13/§38):
 * - Cookie-session auth via SessionAuthFilter (no basic/token headers)
 * - CSRF disabled for the stateless JSON API; cookies are SameSite=Lax and all
 *   mutating endpoints require the session cookie which cross-site forms cannot forge
 *   (JSON content type + CORS restricted to exact origins).
 * - CORS: explicit origins only — never "*".
 * - BCrypt(12) for admin passwords.
 * - Method-level @PreAuthorize enforces per-permission RBAC (403), filter chain
 *   enforces authentication (401).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final IvantaProperties props;
    private final SessionAuthFilter sessionAuthFilter;
    private final RestAuthHandlers authHandlers;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(eh -> eh
                    .authenticationEntryPoint(authHandlers)
                    .accessDeniedHandler(authHandlers))
            .authorizeHttpRequests(auth -> auth
                    // public: auth entry, catalog, location, reviews (read)
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                    .requestMatchers("/api/v1/auth/register", "/api/v1/auth/login",
                            "/api/v1/auth/request-otp", "/api/v1/auth/verify-otp").permitAll()
                    .requestMatchers("/api/v1/auth/me", "/api/v1/auth/logout").hasAuthority("CUSTOMER")
                    .requestMatchers("/api/v1/admin/auth/login", "/api/v1/admin/auth/login/2fa").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/products/**", "/api/v1/categories/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/media/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/delivery/shipping-methods").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/reviews/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/location/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/v1/location/reverse-geocode").permitAll()
                    .requestMatchers("/api/v1/payments/webhook/**", "/api/v1/webhooks/**").permitAll()
                    // admin console: must hold an admin session; fine-grained perms via @PreAuthorize
                    .requestMatchers("/api/v1/admin/**").hasAuthority("ADMIN")
                    // customer area (authenticated)
                    .requestMatchers("/api/v1/users/**", "/api/v1/cart/**", "/api/v1/wishlist/**",
                            "/api/v1/checkout/**", "/api/v1/orders/**", "/api/v1/payments/**",
                            "/api/v1/delivery/**", "/api/v1/returns/**", "/api/v1/refunds/**",
                            "/api/v1/coupons/validate", "/api/v1/notifications/**").hasAuthority("CUSTOMER")
                    .requestMatchers(HttpMethod.POST, "/api/v1/reviews").hasAuthority("CUSTOMER")
                    .anyRequest().authenticated())
            .addFilterBefore(sessionAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(props.getCors().getAllowedOrigins());   // exact origins, never "*"
        cfg.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cfg);
        return source;
    }
}
