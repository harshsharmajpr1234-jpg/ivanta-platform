package com.ivanta.admin;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "admin_sessions")
@Getter @Setter
public class AdminSession {

    @Id
    @Column(name = "token_hash", length = 64)
    private String tokenHash;

    @Column(name = "admin_id", nullable = false, length = 16)
    private String adminId;

    @Column(nullable = false, length = 32)
    private String role;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "last_active", nullable = false)
    private Instant lastActive;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "revoked_at")
    private Instant revokedAt;
}
