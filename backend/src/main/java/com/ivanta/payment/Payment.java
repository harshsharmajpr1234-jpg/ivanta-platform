package com.ivanta.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
@Getter @Setter
public class Payment {
    @Id
    @Column(length = 20)
    private String id;                    // PAY-NNNNN

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(nullable = false, length = 16)
    private String method;                // UPI|CARD|NETBANKING|WALLET|COD

    @Column(nullable = false, length = 20)
    private String provider = "mock";

    @Column(nullable = false, length = 24)
    private String status = "PENDING";    // PENDING|PROCESSING|SUCCESS|FAILED|REFUNDED|PARTIALLY_REFUNDED

    @Column(name = "provider_transaction_id", length = 120)
    private String providerTransactionId;

    @Column(name = "provider_order_id", length = 120)
    private String providerOrderId;

    @Column(name = "provider_payment_id", length = 120)
    private String providerPaymentId;

    @Column(name = "provider_reference", length = 128)
    private String providerReference;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "processed_at")
    private Instant processedAt;

    @Version
    @Column(nullable = false)
    private Integer version;
}
