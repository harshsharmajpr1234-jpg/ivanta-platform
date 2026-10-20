package com.ivanta.admin;

import com.ivanta.admin.dto.AdminDtos.*;
import com.ivanta.common.api.ApiResponse;
import com.ivanta.security.AdminPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Admin auth endpoints (§10). */
@RestController
@RequestMapping("/api/v1/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminAuthService service;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req,
                                            HttpServletRequest http, HttpServletResponse res) {
        return ApiResponse.ok(service.login(req, http, res));
    }

    @PostMapping("/login/2fa")
    public ApiResponse<LoginResponse> verify2fa(@Valid @RequestBody Verify2faRequest req,
                                                HttpServletRequest http, HttpServletResponse res) {
        return ApiResponse.ok(service.verify2fa(req, http, res));
    }

    @GetMapping("/me")
    public ApiResponse<AdminProfile> me(@AuthenticationPrincipal AdminPrincipal principal) {
        return ApiResponse.ok(service.me(principal));
    }

    @PostMapping("/refresh")
    public ApiResponse<AdminProfile> refresh(@AuthenticationPrincipal AdminPrincipal principal) {
        // sliding expiry already refreshed by the filter; return fresh profile
        return ApiResponse.ok(service.me(principal));
    }

    @PostMapping("/change-password")
    public ApiResponse<AdminProfile> changePassword(@AuthenticationPrincipal AdminPrincipal principal,
                                                    @Valid @RequestBody ChangePasswordRequest req,
                                                    HttpServletRequest http, HttpServletResponse res) {
        return ApiResponse.ok(service.changePassword(principal, req, http, res));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest req, HttpServletResponse res,
                                    @AuthenticationPrincipal AdminPrincipal principal) {
        service.logout(req, res, principal);
        return ApiResponse.ok();
    }
}
