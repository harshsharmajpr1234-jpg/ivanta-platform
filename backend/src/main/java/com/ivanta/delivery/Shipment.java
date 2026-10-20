package com.ivanta.delivery;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "shipments")
@Getter @Setter
public class Shipment {
    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(name = "shipping_method_id", nullable = false, length = 16)
    private String shippingMethodId;

    @Column(name = "address_id", nullable = false, length = 16)
    private String addressId;

    @Column(length = 80)
    private String carrier;

    @Column(name = "tracking_number", length = 60, unique = true)
    private String trackingNumber;

    @Column(nullable = false, length = 24)
    private String status = "LABEL_CREATED";

    @Column(name = "estimated_delivery")
    private LocalDate estimatedDelivery;

    @Column(name = "shipped_at")
    private Instant shippedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "provider_shipment_id", length = 120)
    private String providerShipmentId;

    @Column(name = "label_url", length = 500)
    private String labelUrl;

    @Column(name = "pickup_token", length = 120)
    private String pickupToken;

    @Column(name = "pickup_scheduled_at")
    private Instant pickupScheduledAt;

    @Column(name = "weight_kg", nullable = false)
    private Double weightKg = 0.500;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
}
