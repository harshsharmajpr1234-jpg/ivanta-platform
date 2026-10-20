package com.ivanta.auth;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.AuthDtos.*;
import com.ivanta.security.CustomerPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Customer auth endpoints (§9). */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final CustomerAuthService service;

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest req,
                                              HttpServletRequest http, HttpServletResponse res) {
        return ApiResponse.ok(service.register(req, http, res));
    }

    @PostMapping("/login")
    public ApiResponse<UserResponse> login(@Valid @RequestBody LoginRequest req,
                                           HttpServletRequest http, HttpServletResponse res) {
        return ApiResponse.ok(service.login(req, http, res));
    }

    @PostMapping("/request-otp")
    public ApiResponse<RequestOtpResponse> requestOtp(@Valid @RequestBody RequestOtpRequest req) {
        return ApiResponse.ok(service.requestOtp(req));
    }

    @PostMapping("/verify-otp")
    public ApiResponse<UserResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest req,
                                               HttpServletRequest http, HttpServletResponse res) {
        return ApiResponse.ok(service.verifyOtp(req, http, res));
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal CustomerPrincipal principal) {
        return ApiResponse.ok(service.me(principal));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest req, HttpServletResponse res,
                                    @AuthenticationPrincipal CustomerPrincipal principal) {
        service.logout(req, res, principal);
        return ApiResponse.ok();
    }
}
