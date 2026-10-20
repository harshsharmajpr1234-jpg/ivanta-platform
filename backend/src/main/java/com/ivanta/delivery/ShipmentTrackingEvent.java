package com.ivanta.delivery;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "shipment_tracking_events")
@Getter @Setter
public class ShipmentTrackingEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false, length = 20)
    private String shipmentId;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(length = 300)
    private String description;

    @Column(length = 120)
    private String location;

    @Column(name = "event_at", nullable = false)
    private Instant eventAt;

    @PrePersist
    void prePersist() { eventAt = Instant.now(); }
}
