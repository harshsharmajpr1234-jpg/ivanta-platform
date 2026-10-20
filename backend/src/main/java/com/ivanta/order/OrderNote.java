package com.ivanta.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Append-only notes on an order (admin internal or public/customer-visible). */
@Entity
@Table(name = "order_notes")
@Getter @Setter
public class OrderNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(nullable = false, length = 1000)
    private String note;

    @Column(name = "added_by_type", nullable = false, length = 10)
    private String addedByType = "ADMIN";    // ADMIN|CUSTOMER|SYSTEM

    @Column(name = "added_by", length = 16)
    private String addedBy;

    @Column(nullable = false, length = 10)
    private String visibility = "INTERNAL";  // INTERNAL|PUBLIC

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
