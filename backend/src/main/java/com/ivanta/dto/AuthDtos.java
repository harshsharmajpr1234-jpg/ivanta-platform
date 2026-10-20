package com.ivanta.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Auth request/response records (§9). */
public final class AuthDtos {
    private AuthDtos() { }

    public record RequestOtpRequest(
            @NotBlank @Size(max = 190) String identifier,   // email or phone
            @Size(max = 120) String name) { }

    public record RequestOtpResponse(int expiresInSeconds, String channel, String devOtp) { }

    public record VerifyOtpRequest(
            @NotBlank String identifier,
            @NotBlank @Pattern(regexp = "\\d{4,8}", message = "OTP must be 4-8 digits") String code,
            @Size(max = 120) String name) { }

    public record RegisterRequest(
            @NotBlank @Size(max = 120) String name,
            @Email @Size(max = 190) String email,
            @Pattern(regexp = "^$|^[6-9]\\d{9}$", message = "Enter a valid 10-digit mobile number") String phone,
            @NotBlank @Size(min = 8, max = 72) String password) { }

    public record LoginRequest(
            @NotBlank String identifier,              // email or phone
            @NotBlank String password) { }

    public record UserResponse(String id, String name, String email, String phone, String createdAt) { }
}
