package com.ivanta.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

/** Admin auth & management DTOs (§10-§12). */
public final class AdminDtos {
    private AdminDtos() { }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) { }

    public record LoginResponse(boolean authenticated, boolean requireOtp, String otpHint,
                                AdminProfile admin) { }

    public record Verify2faRequest(@NotBlank @Email String email,
                                   @NotBlank @Pattern(regexp = "\\d{4,8}") String code) { }

    public record AdminProfile(String id, String name, String email, String role,
                               List<String> permissions, boolean twoFactorEnabled,
                               boolean mustChangePassword, String lastLoginAt) { }

    public record CreateAdminRequest(@NotBlank @Size(max = 120) String name,
                                     @NotBlank @Email String email,
                                     @NotBlank String role,
                                     @NotBlank @Size(min = 8, max = 72) String tempPassword) { }

    public record UpdateAdminRequest(@Size(max = 120) String name, String role, Boolean isActive) { }

    public record ChangePasswordRequest(@NotBlank String currentPassword,
                                        @NotBlank @Size(min = 8, max = 72) String newPassword) { }

    public record LoginAttemptView(Long id, String identifier, String scope, boolean success,
                                   String ipAddress, String createdAt) { }

    /** Dashboard metrics (§14). */
    public record AdminStats(Map<String, Long> counts, Map<String, Double> currency,
                             Map<String, Long> byStatus, Map<String, Long> recentByDay,
                             List<Map<String, Object>> categoryDistribution) { }
}
