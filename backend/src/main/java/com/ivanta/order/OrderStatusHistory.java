package com.ivanta.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Append-only order status ledger (§23). */
@Entity
@Table(name = "order_status_history")
@Getter @Setter
public class OrderStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(name = "previous_status", length = 24)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 24)
    private String newStatus;

    @Column(name = "changed_by_type", nullable = false, length = 10)
    private String changedByType = "SYSTEM";   // CUSTOMER|ADMIN|SYSTEM

    @Column(name = "changed_by", length = 16)
    private String changedBy;

    @Column(length = 300)
    private String reason;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
