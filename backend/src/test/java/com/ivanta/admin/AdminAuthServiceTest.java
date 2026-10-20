package com.ivanta.admin;

import com.ivanta.admin.dto.AdminDtos.LoginRequest;
import com.ivanta.admin.dto.AdminDtos.LoginResponse;
import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.security.PermissionResolver;
import com.ivanta.security.SessionCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: brute-force lockout, 2FA gate, disabled accounts, uniform errors. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminAuthServiceTest {

    @Mock AdminUserRepository admins;
    @Mock AdminSessionRepository adminSessions;
    @Mock LoginAttemptRepository attempts;
    @Mock SessionCookieService sessions;
    @Mock PermissionResolver permissions;
    @Mock IdService ids;
    @Mock AuditService audit;
    @Mock HttpServletRequest req;
    @Mock HttpServletResponse res;

    IvantaProperties props = new IvantaProperties();
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(4);
    AdminAuthService service;

    @BeforeEach
    void setUp() {
        service = new AdminAuthService(admins, adminSessions, attempts, encoder, props,
                sessions, permissions, ids, audit);
        when(permissions.permissionsFor(anyString())).thenReturn(Set.of("ORDER_VIEW"));
        when(req.getHeader(anyString())).thenReturn(null);
        when(req.getRemoteAddr()).thenReturn("127.0.0.1");
    }

    private AdminUser admin(String password, boolean active, boolean twoFactor, int failed) {
        AdminUser a = new AdminUser();
        a.setId("ADM-1");
        a.setName("Root");
        a.setEmail("admin@ivanta.in");
        a.setPasswordHash(encoder.encode(password));
        a.setRole("SUPER_ADMIN");
        a.setIsActive(active);
        a.setTwoFactorEnabled(twoFactor);
        a.setFailedAttempts(failed);
        return a;
    }

    @Test
    void wrongPasswordIsRejectedAndCounted() {
        AdminUser a = admin("Right@123", true, false, 0);
        when(admins.findByEmailIgnoreCase("admin@ivanta.in")).thenReturn(Optional.of(a));
        assertThatThrownBy(() -> service.login(new LoginRequest("admin@ivanta.in", "wrong"), req, res))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.UNAUTHORIZED);
        assertThat(a.getFailedAttempts()).isEqualTo(1);
        verify(attempts).save(argThat(la -> !la.getSuccess()));
        verify(sessions, never()).issueAdminSession(any(), any(), any());
    }

    @Test
    void unknownEmailGetsSameError_noUserEnumeration() {
        when(admins.findByEmailIgnoreCase("ghost@ivanta.in")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.login(new LoginRequest("ghost@ivanta.in", "whatever"), req, res))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Invalid credentials");
    }

    @Test
    void locksAccountAfterMaxFailures() {
        AdminUser a = admin("Right@123", true, false, props.getSecurity().getMaxLoginFailures() - 1);
        when(admins.findByEmailIgnoreCase("admin@ivanta.in")).thenReturn(Optional.of(a));
        assertThatThrownBy(() -> service.login(new LoginRequest("admin@ivanta.in", "wrong"), req, res))
                .isInstanceOf(BusinessException.class);
        assertThat(a.getLockedUntil()).isAfter(Instant.now());
        verify(audit).record(eq("ADMIN_LOCKED"), any(), any(), any(), any());

        // while locked, even the RIGHT password is refused
        assertThatThrownBy(() -> service.login(new LoginRequest("admin@ivanta.in", "Right@123"), req, res))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.RATE_LIMITED);
    }

    @Test
    void twoFactorAccountNeedsSecondStep() {
        AdminUser a = admin("Right@123", true, true, 0);
        when(admins.findByEmailIgnoreCase("admin@ivanta.in")).thenReturn(Optional.of(a));
        LoginResponse r = service.login(new LoginRequest("admin@ivanta.in", "Right@123"), req, res);
        assertThat(r.authenticated()).isFalse();
        assertThat(r.requireOtp()).isTrue();
        verify(sessions, never()).issueAdminSession(any(), any(), any());
    }

    @Test
    void disabledAccountIsForbidden() {
        AdminUser a = admin("Right@123", false, false, 0);
        when(admins.findByEmailIgnoreCase("admin@ivanta.in")).thenReturn(Optional.of(a));
        assertThatThrownBy(() -> service.login(new LoginRequest("admin@ivanta.in", "Right@123"), req, res))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void successfulLoginResetsFailuresAndIssuesSession() {
        AdminUser a = admin("Right@123", true, false, 3);
        when(admins.findByEmailIgnoreCase("admin@ivanta.in")).thenReturn(Optional.of(a));
        LoginResponse r = service.login(new LoginRequest("admin@ivanta.in", "Right@123"), req, res);
        assertThat(r.authenticated()).isTrue();
        assertThat(a.getFailedAttempts()).isZero();
        assertThat(a.getLastLoginAt()).isNotNull();
        verify(sessions).issueAdminSession(a, req, res);
        verify(attempts).save(argThat(LoginAttempt::getSuccess));
    }
}
