package com.ivanta.security;

import com.ivanta.admin.AdminSession;
import com.ivanta.admin.AdminSessionRepository;
import com.ivanta.admin.AdminUser;
import com.ivanta.admin.AdminUserRepository;
import com.ivanta.auth.User;
import com.ivanta.auth.UserRepository;
import com.ivanta.auth.UserSession;
import com.ivanta.auth.UserSessionRepository;
import com.ivanta.common.util.Hashing;
import com.ivanta.config.IvantaProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * DB-backed sessions in HTTP-only cookies (§10/§11).
 * Raw tokens are returned once for Set-Cookie; only SHA-256 hashes are stored.
 */
@Service
@RequiredArgsConstructor
public class SessionCookieService {

    public static final String USER_COOKIE = "ivanta_usr";
    public static final String ADMIN_COOKIE = "ivanta_admin";

    private final IvantaProperties props;
    private final UserSessionRepository userSessions;
    private final AdminSessionRepository adminSessions;
    private final UserRepository users;
    private final AdminUserRepository adminUsers;
    private final PermissionResolver permissionResolver;

    /* ---------- issue ---------- */

    @Transactional
    public void issueUserSession(String userId, HttpServletRequest req, HttpServletResponse res) {
        String token = Hashing.newToken();
        UserSession s = new UserSession();
        s.setTokenHash(Hashing.sha256(token));
        s.setUserId(userId);
        s.setCreatedAt(Instant.now());
        s.setExpiresAt(Instant.now().plus(Duration.ofHours(props.getSecurity().getUserSessionTtlHours())));
        s.setIpAddress(clientIp(req));
        s.setUserAgent(userAgent(req));
        userSessions.save(s);
        setCookie(res, USER_COOKIE, token, (int) Duration.ofHours(props.getSecurity().getUserSessionTtlHours()).toSeconds());
    }

    @Transactional
    public void issueAdminSession(AdminUser admin, HttpServletRequest req, HttpServletResponse res) {
        String token = Hashing.newToken();
        AdminSession s = new AdminSession();
        s.setTokenHash(Hashing.sha256(token));
        s.setAdminId(admin.getId());
        s.setRole(admin.getRole());
        s.setCreatedAt(Instant.now());
        s.setLastActive(Instant.now());
        s.setExpiresAt(Instant.now().plus(Duration.ofMinutes(props.getSecurity().getAdminSessionTtlMinutes())));
        s.setIpAddress(clientIp(req));
        s.setUserAgent(userAgent(req));
        adminSessions.save(s);
        setCookie(res, ADMIN_COOKIE, token, (int) Duration.ofMinutes(props.getSecurity().getAdminSessionTtlMinutes()).toSeconds());
    }

    /* ---------- resolve (auth filter) ---------- */

    @Transactional(readOnly = true)
    public Optional<CustomerPrincipal> resolveCustomer(HttpServletRequest req) {
        String token = cookie(req, USER_COOKIE);
        if (token == null) return Optional.empty();
        return userSessions.findById(Hashing.sha256(token))
                .filter(s -> s.getRevokedAt() == null && s.getExpiresAt().isAfter(Instant.now()))
                .flatMap(s -> users.findById(s.getUserId()))
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && u.getDeletedAt() == null)
                .map(u -> new CustomerPrincipal(u.getId(), u.getName(), u.getEmail()));
    }

    @Transactional
    public Optional<AdminPrincipal> resolveAdmin(HttpServletRequest req) {
        String token = cookie(req, ADMIN_COOKIE);
        if (token == null) return Optional.empty();
        Optional<AdminSession> found = adminSessions.findById(Hashing.sha256(token))
                .filter(s -> s.getRevokedAt() == null && s.getExpiresAt().isAfter(Instant.now()));
        if (found.isEmpty()) return Optional.empty();
        AdminSession s = found.get();
        s.setLastActive(Instant.now());
        s.setExpiresAt(Instant.now().plus(Duration.ofMinutes(props.getSecurity().getAdminSessionTtlMinutes()))); // sliding expiry
        adminSessions.save(s);
        return adminUsers.findById(s.getAdminId())
                .filter(a -> Boolean.TRUE.equals(a.getIsActive()))
                .map(a -> new AdminPrincipal(a.getId(), a.getName(), a.getEmail(), a.getRole(),
                        permissionResolver.permissionsFor(a.getRole())));
    }

    /* ---------- revoke ---------- */

    @Transactional
    public void revokeUserSession(HttpServletRequest req, HttpServletResponse res) {
        String token = cookie(req, USER_COOKIE);
        if (token != null) userSessions.findById(Hashing.sha256(token))
                .ifPresent(s -> { s.setRevokedAt(Instant.now()); userSessions.save(s); });
        clearCookie(res, USER_COOKIE);
    }

    @Transactional
    public void revokeAdminSession(HttpServletRequest req, HttpServletResponse res) {
        String token = cookie(req, ADMIN_COOKIE);
        if (token != null) adminSessions.findById(Hashing.sha256(token))
                .ifPresent(s -> { s.setRevokedAt(Instant.now()); adminSessions.save(s); });
        clearCookie(res, ADMIN_COOKIE);
    }

    /** SUPER_ADMIN operation: terminate every live admin session (§11). */
    @Transactional
    public int revokeAllAdminSessions() {
        return adminSessions.revokeAll(Instant.now());
    }

    /* ---------- helpers ---------- */

    public static String clientIp(HttpServletRequest req) {
        String fwd = req.getHeader("X-Forwarded-For");
        return (fwd != null && !fwd.isBlank()) ? fwd.split(",")[0].trim() : req.getRemoteAddr();
    }

    public static String userAgent(HttpServletRequest req) {
        String ua = req.getHeader("User-Agent");
        return ua == null ? null : ua.substring(0, Math.min(ua.length(), 250));
    }

    public static String cookie(HttpServletRequest req, String name) {
        if (req.getCookies() == null) return null;
        for (Cookie c : req.getCookies()) if (name.equals(c.getName())) return c.getValue();
        return null;
    }

    private void setCookie(HttpServletResponse res, String name, String value, int maxAge) {
        res.addHeader("Set-Cookie", String.format("%s=%s; Path=/; Max-Age=%d; HttpOnly; SameSite=Lax", name, value, maxAge));
    }

    private void clearCookie(HttpServletResponse res, String name) {
        res.addHeader("Set-Cookie", String.format("%s=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax", name));
    }
}
