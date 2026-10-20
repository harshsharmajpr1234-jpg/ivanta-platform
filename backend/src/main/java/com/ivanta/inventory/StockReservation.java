package com.ivanta.inventory;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Temporary hold created at checkout; auto-expires (§14). */
@Entity
@Table(name = "stock_reservations")
@Getter @Setter
public class StockReservation {
    public enum Status { RESERVED, CONSUMED, RELEASED, EXPIRED }

    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "order_id", length = 20)
    private String orderId;

    @Column(name = "inventory_id", nullable = false, length = 16)
    private String inventoryId;

    @Column(name = "variant_id", length = 16)
    private String variantId;

    @Column(nullable = false)
    private Integer quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Status status = Status.RESERVED;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
