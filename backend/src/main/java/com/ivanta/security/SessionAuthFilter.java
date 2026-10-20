package com.ivanta.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Resolves the HTTP-only session cookie into a Spring Security context on every request.
 * Admins receive one granted authority per permission string, so @PreAuthorize
 * ("hasAuthority('PAYMENT_PROCESS')") enforces RBAC server-side (§13).
 */
@Component
@RequiredArgsConstructor
public class SessionAuthFilter extends OncePerRequestFilter {

    private final SessionCookieService sessions;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            sessions.resolveAdmin(req).ifPresentOrElse(admin -> {
                List<SimpleGrantedAuthority> auths = new ArrayList<>();
                auths.add(new SimpleGrantedAuthority("ADMIN"));
                auths.add(new SimpleGrantedAuthority(admin.role()));   // e.g. SUPER_ADMIN
                admin.permissions().forEach(p -> auths.add(new SimpleGrantedAuthority(p)));
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(admin, null, auths));
            }, () -> sessions.resolveCustomer(req).ifPresent(customer ->
                    SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(customer, null,
                                    List.of(new SimpleGrantedAuthority("CUSTOMER"))))));
        }
        chain.doFilter(req, res);
    }
}
