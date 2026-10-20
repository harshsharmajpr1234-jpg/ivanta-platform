package com.ivanta.returnrefund;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "refund_transactions")
@Getter @Setter
public class RefundTransaction {
    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "refund_id", nullable = false, length = 20)
    private String refundId;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_transaction_id", length = 120)
    private String providerTransactionId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
