package com.ivanta.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter @Setter
public class User {

    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 190)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;              // BCrypt; null for OTP-only accounts

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by", length = 16)
    private String deletedBy;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); updatedAt = createdAt; }

    @PreUpdate
    void preUpdate() { updatedAt = Instant.now(); }
}
