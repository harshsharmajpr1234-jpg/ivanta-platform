package com.ivanta.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;

public final class DeliveryDtos {
    private DeliveryDtos() { }

    public record TrackingEventView(String status, String description, String location, String at) { }

    public record ShipmentView(String id, String orderId, String trackingNumber, String carrier,
                               String status, String estimatedDelivery, String shippedAt,
                               String deliveredAt, String providerShipmentId, String labelUrl,
                               String pickupToken, Double weightKg, List<TrackingEventView> events) { }

    public record TrackingView(String orderId, String orderStatus, ShipmentView shipment) { }

    public record ShipRequest(String carrier, String trackingNumber, Double weightKg) { }

    public record EventRequest(@NotBlank String status, String description, String location) { }

    public record ShippingMethodUpsert(@NotBlank String name, String carrier,
                                       BigDecimal baseFee, BigDecimal freeAbove,
                                       Integer etaMinDays, Integer etaMaxDays, Boolean isActive) { }

    public record WarehouseSettingsView(
        String name,
        String contactName,
        String phone,
        String email,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String pincode,
        String operatingHours,
        String sellerGstin
    ) { }

    public record WarehouseSettingsUpsert(
        @NotBlank String name,
        @NotBlank String contactName,
        @NotBlank String phone,
        @NotBlank String email,
        @NotBlank String addressLine1,
        String addressLine2,
        @NotBlank String city,
        @NotBlank String state,
        @NotBlank String pincode,
        String operatingHours,
        @NotBlank String sellerGstin
    ) { }

    public record CourierProviderStatusView(
        String activeProvider,
        boolean autoShipOnPacked,
        boolean shiprocketConfigured,
        boolean delhiveryConfigured
    ) { }
}
