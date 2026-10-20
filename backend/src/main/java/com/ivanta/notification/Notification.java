package com.ivanta.notification;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "notifications")
@Getter @Setter
public class Notification {
    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "user_id", length = 16)
    private String userId;

    @Column(name = "template_key", length = 40)
    private String templateKey;

    @Column(nullable = false, length = 10)
    private String channel = "IN_APP";

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 600)
    private String body;

    @Column(name = "entity_type", length = 30)
    private String entityType;

    @Column(name = "entity_id", length = 20)
    private String entityId;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
