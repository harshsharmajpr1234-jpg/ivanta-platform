package com.ivanta.delivery;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "courier_webhooks")
@Getter @Setter
public class CourierWebhook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String provider;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "tracking_number", length = 120)
    private String trackingNumber;

    @Column(name = "event_hash", nullable = false, length = 64, unique = true)
    private String eventHash;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(nullable = false)
    private Boolean processed = false;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();
}
