package com.ivanta.delivery.provider;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public interface CourierProvider {

    /** Provider identifier: mock | shiprocket | delhivery. */
    String getName();

    /** Check pincode serviceability for shipping between origin and destination pincodes. */
    ServiceabilityResult checkServiceability(String pickupPincode, String deliveryPincode, double weightKg, boolean cod);

    /** Calculate shipping rates and estimated delivery times. */
    List<RateOption> calculateRates(String pickupPincode, String deliveryPincode, double weightKg, BigDecimal declaredValue, boolean cod);

    /** Create shipment with courier provider, generating AWB and shipping label. */
    ShipmentResult createShipment(ShipmentRequest req);

    /** Cancel an existing shipment with the courier provider. */
    boolean cancelShipment(String providerOrderId, String awbNumber);

    /** Fetch live tracking status and timeline events from the courier provider. */
    TrackingResult fetchTracking(String providerOrderId, String awbNumber);

    /** Create a reverse pickup request for customer returns. */
    ReversePickupResult createReversePickup(ReversePickupRequest req);

    // --- Data Records ---

    record ServiceabilityResult(
        boolean serviceable,
        String courierName,
        BigDecimal estimatedFee,
        Integer minDays,
        Integer maxDays,
        String message
    ) {}

    record RateOption(
        String providerCourierId,
        String courierName,
        BigDecimal baseRate,
        BigDecimal totalRate,
        int minDays,
        int maxDays
    ) {}

    record OrderItemSpec(
        String sku,
        String name,
        int quantity,
        BigDecimal price,
        BigDecimal taxRate
    ) {}

    record AddressSpec(
        String name,
        String phone,
        String email,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String pincode
    ) {}

    record ShipmentRequest(
        String orderId,
        String orderNumber,
        AddressSpec deliveryAddress,
        AddressSpec warehouseAddress,
        List<OrderItemSpec> items,
        BigDecimal orderTotal,
        double weightKg,
        boolean isCod,
        BigDecimal codAmount
    ) {}

    record ShipmentResult(
        boolean success,
        String providerOrderId,
        String providerShipmentId,
        String awbNumber,
        String carrierName,
        String labelUrl,
        String pickupToken,
        Instant pickupScheduledAt,
        LocalDate estimatedDelivery,
        String message
    ) {}

    record TrackingEventSpec(
        String status,
        String description,
        String location,
        Instant eventAt
    ) {}

    record TrackingResult(
        boolean success,
        String status,
        String currentLocation,
        LocalDate estimatedDelivery,
        List<TrackingEventSpec> events,
        String rawResponse
    ) {}

    record ReversePickupRequest(
        String returnId,
        String originalOrderId,
        String originalAwb,
        AddressSpec customerAddress,
        AddressSpec warehouseAddress,
        List<OrderItemSpec> items,
        String reason
    ) {}

    record ReversePickupResult(
        boolean success,
        String providerReturnId,
        String reverseAwbNumber,
        String carrierName,
        String pickupScheduledDate,
        String message
    ) {}
}
