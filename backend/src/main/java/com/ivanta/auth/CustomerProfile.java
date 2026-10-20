package com.ivanta.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "customer_profiles")
@Getter @Setter
public class CustomerProfile {
    @Id
    @Column(name = "user_id", length = 16)
    private String userId;

    @Column(name = "marketing_emails", nullable = false)
    private Boolean marketingEmails = true;

    @Column(name = "marketing_sms", nullable = false)
    private Boolean marketingSms = false;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
}
