package com.ivanta.admin;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Append-only login attempt ledger (§11). */
@Entity
@Table(name = "login_attempts")
@Getter @Setter
public class LoginAttempt {

    public enum Scope { CUSTOMER, ADMIN }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 190)
    private String identifier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private Scope scope = Scope.ADMIN;

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
