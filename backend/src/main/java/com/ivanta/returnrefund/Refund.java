package com.ivanta.returnrefund;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "refunds")
@Getter @Setter
public class Refund {
    @Id
    @Column(length = 20)
    private String id;                    // REF-NNNNN

    @Column(name = "return_id", length = 20)
    private String returnId;

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(name = "payment_id", nullable = false, length = 20)
    private String paymentId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 16)
    private String status = "PENDING";    // PENDING|PROCESSING|SUCCESS|FAILED

    @Column(nullable = false, length = 16)
    private String method;

    @Column(nullable = false, length = 20)
    private String provider = "mock";

    @Column(name = "provider_transaction_id", length = 120)
    private String providerTransactionId;

    @Column(name = "provider_refund_id", length = 120)
    private String providerRefundId;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "processed_at")
    private Instant processedAt;

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
