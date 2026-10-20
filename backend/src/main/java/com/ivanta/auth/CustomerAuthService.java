package com.ivanta.auth;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.Hashing;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.dto.AuthDtos.*;
import com.ivanta.admin.LoginAttempt;
import com.ivanta.admin.LoginAttemptRepository;
import com.ivanta.security.CustomerPrincipal;
import com.ivanta.security.SessionCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Customer (seller) authentication (§9): OTP over email/phone through a pluggable
 * provider, hashed at rest, attempt-limited; sessions in HTTP-only cookies.
 */
@Service
@RequiredArgsConstructor
public class CustomerAuthService {

    private static final int MAX_VERIFY_ATTEMPTS = 5;
    private static final int MAX_OTP_PER_10MIN = 3;

    private final UserRepository users;
    private final OtpCodeRepository otpCodes;
    private final OtpProvider otpProvider;
    private final IvantaProperties props;
    private final SessionCookieService sessions;
    private final IdService ids;
    private final AuditService audit;
    private final LoginAttemptRepository loginAttempts;
    private final CustomerProfileRepository profiles;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Transactional
    public RequestOtpResponse requestOtp(RequestOtpRequest req) {
        String identifier = req.identifier().trim().toLowerCase();
        OtpCode.Channel channel = identifier.contains("@") ? OtpCode.Channel.EMAIL : OtpCode.Channel.PHONE;
        if (channel == OtpCode.Channel.EMAIL && !identifier.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$"))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Enter a valid email address");
        if (channel == OtpCode.Channel.PHONE && !identifier.matches("^[6-9]\\d{9}$"))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Enter a valid 10-digit mobile number");

        // simple rate limit: max 3 codes per 10 minutes per identifier
        if (otpCodes.countByIdentifierAndCreatedAtAfter(identifier, Instant.now().minus(10, ChronoUnit.MINUTES)) >= MAX_OTP_PER_10MIN)
            throw new BusinessException(ErrorCode.RATE_LIMITED, "Too many OTP requests. Try again in a few minutes.");

        String code = otpProvider.generateCode(identifier);
        OtpCode otp = new OtpCode();
        otp.setIdentifier(identifier);
        otp.setChannel(channel);
        otp.setOtpHash(Hashing.sha256(code));
        otp.setExpiresAt(Instant.now().plusSeconds(props.getOtp().getTtlSeconds()));
        otpCodes.save(otp);
        otpProvider.send(identifier, channel, code);

        // devOtp surfaced ONLY for the mock provider (never for real providers)
        String devOtp = "mock".equals(otpProvider.providerName()) ? code : null;
        return new RequestOtpResponse(props.getOtp().getTtlSeconds(), channel.name(), devOtp);
    }

    @Transactional
    public UserResponse verifyOtp(VerifyOtpRequest req, HttpServletRequest http, HttpServletResponse res) {
        String identifier = req.identifier().trim().toLowerCase();
        OtpCode otp = otpCodes.findTopByIdentifierAndUsedAtIsNullAndExpiresAtAfterOrderByIdDesc(identifier, Instant.now())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "OTP expired or not requested"));

        if (otp.getAttempts() >= MAX_VERIFY_ATTEMPTS)
            throw new BusinessException(ErrorCode.RATE_LIMITED, "Too many attempts. Request a new OTP.");

        byte[] a = Hashing.sha256(req.code()).getBytes(StandardCharsets.UTF_8);
        byte[] b = otp.getOtpHash().getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(a, b)) {
            otp.setAttempts(otp.getAttempts() + 1);
            otpCodes.save(otp);
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Incorrect OTP");
        }

        otp.setUsedAt(Instant.now());
        otpCodes.save(otp);

        User user = findOrCreate(identifier, req.name());
        sessions.issueUserSession(user.getId(), http, res);
        audit.record("CUSTOMER_LOGIN", "user", user.getId(), null, identifier);
        return toDto(user);
    }

    @Transactional
    public User findOrCreate(String identifier, String name) {
        boolean isEmail = identifier.contains("@");
        return (isEmail ? users.findByEmailIgnoreCaseAndDeletedAtIsNull(identifier)
                        : users.findByPhoneAndDeletedAtIsNull(identifier))
                .orElseGet(() -> {
                    User u = new User();
                    u.setId(ids.next("users", "USR", 4));
                    u.setName(name != null && !name.isBlank() ? name.trim()
                            : isEmail ? identifier.split("@")[0] : "Seller " + identifier.substring(identifier.length() - 4));
                    if (isEmail) u.setEmail(identifier); else u.setPhone(identifier);
                    return users.save(u);
                });
    }

    /* ---------- password auth (§16) ---------- */

    @Transactional
    public UserResponse register(RegisterRequest req, HttpServletRequest http, HttpServletResponse res) {
        boolean hasEmail = req.email() != null && !req.email().isBlank();
        boolean hasPhone = req.phone() != null && !req.phone().isBlank();
        if (!hasEmail && !hasPhone)
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Email or phone is required");
        if (hasEmail && users.existsByEmailIgnoreCase(req.email().trim().toLowerCase()))
            throw new BusinessException(ErrorCode.CONFLICT, "An account with this email already exists");
        User u = new User();
        u.setId(ids.next("users", "USR", 4));
        u.setName(req.name().trim());
        if (hasEmail) u.setEmail(req.email().trim().toLowerCase());
        if (hasPhone) u.setPhone(req.phone().trim());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        users.save(u);
        CustomerProfile p = new CustomerProfile();
        p.setUserId(u.getId());
        profiles.save(p);
        sessions.issueUserSession(u.getId(), http, res);
        audit.record("CUSTOMER_REGISTERED", "user", u.getId(), null, u.getEmail());
        return toDto(u);
    }

    @Transactional
    public UserResponse login(LoginRequest req, HttpServletRequest http, HttpServletResponse res) {
        String identifier = req.identifier().trim().toLowerCase();
        boolean isEmail = identifier.contains("@");
        User u = (isEmail ? users.findByEmailIgnoreCaseAndDeletedAtIsNull(identifier)
                          : users.findByPhoneAndDeletedAtIsNull(identifier)).orElse(null);
        recordAttempt(identifier, false);
        if (u == null || u.getPasswordHash() == null || !passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            audit.record("CUSTOMER_LOGIN_FAILED", "user", u == null ? "-" : u.getId(), null, identifier);
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Invalid credentials");
        }
        if (!Boolean.TRUE.equals(u.getIsActive()))
            throw new BusinessException(ErrorCode.FORBIDDEN, "This account has been disabled");
        recordAttempt(identifier, true);
        sessions.issueUserSession(u.getId(), http, res);
        audit.record("CUSTOMER_LOGIN", "user", u.getId(), null, identifier);
        return toDto(u);
    }

    private void recordAttempt(String identifier, boolean success) {
        LoginAttempt la = new LoginAttempt();
        la.setIdentifier(identifier);
        la.setScope(LoginAttempt.Scope.CUSTOMER);
        la.setSuccess(success);
        loginAttempts.save(la);
    }

    @Transactional
    public void logout(HttpServletRequest req, HttpServletResponse res, CustomerPrincipal principal) {
        sessions.revokeUserSession(req, res);
        if (principal != null) audit.record("CUSTOMER_LOGOUT", "user", principal.userId(), null, null);
    }

    @Transactional(readOnly = true)
    public UserResponse me(CustomerPrincipal principal) {
        User u = users.findById(principal.userId())
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED, "Session expired"));
        return toDto(u);
    }

    public static UserResponse toDto(User u) {
        return new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getPhone(),
                u.getCreatedAt() == null ? null : u.getCreatedAt().toString());
    }
}
