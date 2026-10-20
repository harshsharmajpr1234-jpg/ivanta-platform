package com.ivanta.replacement;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * Replacement workflow (§21): customer requests a replacement for a delivered
 * item; on admin approval a zero-total replacement order is generated from the
 * original item snapshot and moves through the normal fulfilment pipeline.
 * REQUESTED|APPROVED|REJECTED|PROCESSING|SHIPPED|DELIVERED|CLOSED
 */
@Entity
@Table(name = "replacements")
@Getter @Setter
public class Replacement {
    @Id
    @Column(length = 20)
    private String id;                       // REP-NNNNNN

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(name = "order_item_id", nullable = false, length = 20)
    private String orderItemId;

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Column(nullable = false, length = 28)
    private String status = "REQUESTED";

    @Column(nullable = false, length = 300)
    private String reason;

    @Column(name = "replacement_order_id", length = 20)
    private String replacementOrderId;

    @Column(name = "approved_by", length = 16)
    private String approvedBy;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Version
    private Integer version;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (requestedAt == null) requestedAt = now;
        createdAt = now;
    }
}
