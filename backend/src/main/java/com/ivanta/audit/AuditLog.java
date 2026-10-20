package com.ivanta.audit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Immutable audit record (§30). The application layer only ever INSERTs here —
 * no update or delete paths exist for this entity.
 */
@Entity
@Table(name = "audit_logs")
@Getter @Setter
public class AuditLog {

    public enum ActorType { CUSTOMER, ADMIN, SYSTEM }

    @Id
    @Column(length = 16)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false, length = 10)
    private ActorType actorType;

    @Column(name = "actor_user_id", length = 16)
    private String actorUserId;

    @Column(name = "actor_name", nullable = false, length = 120)
    private String actorName;

    @Column(name = "actor_role", length = 32)
    private String actorRole;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 20)
    private String entityId;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { if (createdAt == null) createdAt = Instant.now(); }
}
