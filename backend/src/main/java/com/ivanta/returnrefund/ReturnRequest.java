package com.ivanta.returnrefund;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "return_requests")
@Getter @Setter
public class ReturnRequest {
    @Id
    @Column(length = 20)
    private String id;                    // RET-NNNNN

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Column(nullable = false, length = 24)
    private String status = "REQUESTED";

    @Column(nullable = false, length = 300)
    private String reason;

    @Column(name = "customer_notes", length = 500)
    private String customerNotes;

    @Column(name = "inspection_notes", length = 500)
    private String inspectionNotes;

    @Column(name = "provider_return_id", length = 120)
    private String providerReturnId;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Version
    @Column(nullable = false)
    private Integer version;

    @PrePersist
    void prePersist() { requestedAt = Instant.now(); }
}
