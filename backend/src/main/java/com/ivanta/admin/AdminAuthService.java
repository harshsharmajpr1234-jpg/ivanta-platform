package com.ivanta.admin;

import com.ivanta.admin.dto.AdminDtos.*;
import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.Hashing;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.security.AdminPrincipal;
import com.ivanta.security.PermissionResolver;
import com.ivanta.security.SessionCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Admin authentication (§10/§11): BCrypt verification, login attempt ledger,
 * auto-lockout, sliding 30-minute sessions, 2FA-ready (mock TOTP in dev).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuthService {

    private final AdminUserRepository admins;
    private final AdminSessionRepository adminSessions;
    private final LoginAttemptRepository attempts;
    private final PasswordEncoder encoder;
    private final IvantaProperties props;
    private final SessionCookieService sessions;
    private final PermissionResolver permissions;
    private final IdService ids;
    private final AuditService audit;

    @Transactional
    public LoginResponse login(LoginRequest req, HttpServletRequest http, HttpServletResponse res) {
        String email = req.email().trim().toLowerCase();
        AdminUser admin = admins.findByEmailIgnoreCase(email).orElse(null);

        // Uniform error for unknown email (no user enumeration)
        if (admin == null) {
            recordAttempt(email, false, http);
            audit.record("ADMIN_LOGIN_FAILED", "admin_user", "-", null, "unknown email " + email);
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Invalid credentials");
        }
        if (!Boolean.TRUE.equals(admin.getIsActive())) {
            recordAttempt(email, false, http);
            throw new BusinessException(ErrorCode.FORBIDDEN, "This account has been disabled");
        }
        if (admin.getLockedUntil() != null && admin.getLockedUntil().isAfter(Instant.now())) {
            long mins = Duration.between(Instant.now(), admin.getLockedUntil()).toMinutes() + 1;
            throw new BusinessException(ErrorCode.RATE_LIMITED, "Account locked after repeated failures. Retry in " + mins + " min.");
        }

        if (!encoder.matches(req.password(), admin.getPasswordHash())) {
            int fails = admin.getFailedAttempts() + 1;
            admin.setFailedAttempts(fails);
            if (fails >= props.getSecurity().getMaxLoginFailures()) {
                admin.setLockedUntil(Instant.now().plus(props.getSecurity().getLockoutMinutes(), ChronoUnit.MINUTES));
                admin.setFailedAttempts(0);
                audit.record("ADMIN_LOCKED", "admin_user", admin.getId(), null, "locked until " + admin.getLockedUntil());
            }
            admins.save(admin);
            recordAttempt(email, false, http);
            audit.record("ADMIN_LOGIN_FAILED", "admin_user", admin.getId(), null, null);
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Invalid credentials");
        }

        admin.setFailedAttempts(0);
        admin.setLockedUntil(null);
        admins.save(admin);
        recordAttempt(email, true, http);

        if (Boolean.TRUE.equals(admin.getTwoFactorEnabled())) {
            // 2FA-ready: in dev the mock provider's fixed code applies; production plugs a TOTP service here.
            String hint = "mock".equals(props.getOtp().getProvider()) ? props.getOtp().getMockFixedCode() : null;
            return new LoginResponse(false, true, hint, null);
        }

        completeLogin(admin, http, res);
        return new LoginResponse(true, false, null, toProfile(admin));
    }

    @Transactional
    public LoginResponse verify2fa(Verify2faRequest req, HttpServletRequest http, HttpServletResponse res) {
        AdminUser admin = admins.findByEmailIgnoreCase(req.email().trim().toLowerCase())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Invalid credentials"));
        String expected = "mock".equals(props.getOtp().getProvider())
                ? props.getOtp().getMockFixedCode()
                : null; // production: TOTP verification against admin.twoFactorSecret
        if (expected == null || !expected.equals(req.code())) {
            recordAttempt(admin.getEmail(), false, http);
            audit.record("ADMIN_2FA_FAILED", "admin_user", admin.getId(), null, null);
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Invalid 2FA code");
        }
        completeLogin(admin, http, res);
        return new LoginResponse(true, false, null, toProfile(admin));
    }

    private void completeLogin(AdminUser admin, HttpServletRequest http, HttpServletResponse res) {
        admin.setLastLoginAt(Instant.now());
        admins.save(admin);
        sessions.issueAdminSession(admin, http, res);
        audit.record("ADMIN_LOGIN_SUCCESS", "admin_user", admin.getId(), null, admin.getRole());
    }

    @Transactional(readOnly = true)
    public AdminProfile me(AdminPrincipal principal) {
        AdminUser a = admins.findById(principal.adminId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Session expired"));
        return toProfile(a);
    }

    @Transactional
    public AdminProfile changePassword(AdminPrincipal principal, ChangePasswordRequest req,
                                       HttpServletRequest http, HttpServletResponse res) {
        AdminUser a = admins.findById(principal.adminId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Session expired"));
        if (!encoder.matches(req.currentPassword(), a.getPasswordHash()))
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Current password is incorrect");
        if (encoder.matches(req.newPassword(), a.getPasswordHash()))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "New password must differ from current password");
        a.setPasswordHash(encoder.encode(req.newPassword()));
        a.setMustChangePassword(false);
        admins.save(a);
        // kill other sessions; current one stays valid via fresh cookie
        String keep = SessionCookieService.cookie(http, SessionCookieService.ADMIN_COOKIE);
        adminSessions.revokeOthers(a.getId(), keep == null ? "" : Hashing.sha256(keep), Instant.now());
        audit.record("PASSWORD_CHANGED", "admin_user", a.getId(), null, null);
        return toProfile(a);
    }

    @Transactional
    public void logout(HttpServletRequest req, HttpServletResponse res, AdminPrincipal principal) {
        sessions.revokeAdminSession(req, res);
        if (principal != null) audit.record("ADMIN_LOGOUT", "admin_user", principal.adminId(), null, null);
    }

    private void recordAttempt(String identifier, boolean success, HttpServletRequest http) {
        LoginAttempt la = new LoginAttempt();
        la.setIdentifier(identifier);
        la.setScope(LoginAttempt.Scope.ADMIN);
        la.setSuccess(success);
        la.setIpAddress(SessionCookieService.clientIp(http));
        la.setUserAgent(SessionCookieService.userAgent(http));
        attempts.save(la);
    }

    public AdminProfile toProfile(AdminUser a) {
        List<String> perms = permissions.permissionsFor(a.getRole()).stream().sorted().toList();
        return new AdminProfile(a.getId(), a.getName(), a.getEmail(), a.getRole(), perms,
                Boolean.TRUE.equals(a.getTwoFactorEnabled()), Boolean.TRUE.equals(a.getMustChangePassword()),
                a.getLastLoginAt() == null ? null : a.getLastLoginAt().toString());
    }
}
