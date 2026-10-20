package com.ivanta.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "payment_status_history")
@Getter @Setter
public class PaymentStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_id", nullable = false, length = 20)
    private String paymentId;

    @Column(name = "previous_status", length = 24)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 24)
    private String newStatus;

    @Column(length = 300)
    private String reason;

    @Column(name = "changed_by", length = 16)
    private String changedBy;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
