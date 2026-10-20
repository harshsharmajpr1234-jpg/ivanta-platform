package com.ivanta.payment;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payment_transactions")
@Getter @Setter
public class PaymentTransaction {
    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "payment_id", nullable = false, length = 20)
    private String paymentId;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_transaction_id", length = 120)
    private String providerTransactionId;

    @Column(name = "txn_type", nullable = false, length = 16)
    private String txnType;               // INITIATE|VERIFY|CAPTURE|REFUND

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 16)
    private String status;                // SUCCESS|FAILED|PENDING

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
