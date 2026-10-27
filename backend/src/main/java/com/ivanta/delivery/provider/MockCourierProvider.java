package com.ivanta.delivery.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
public class MockCourierProvider implements CourierProvider {

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public String getName() {
        return "mock";
    }

    @Override
    public ServiceabilityResult checkServiceability(String pickupPincode, String deliveryPincode, double weightKg, boolean cod) {
        log.info("[MOCK COURIER] Check serviceability from {} to {}, weight={}kg, COD={}", pickupPincode, deliveryPincode, weightKg, cod);
        boolean serviceable = deliveryPincode != null && deliveryPincode.matches("\\d{6}");
        if (!serviceable) {
            return new ServiceabilityResult(false, null, null, null, null, "Pincode is not serviceable by courier network");
        }
        return new ServiceabilityResult(true, "Flyphones Express (Mock)", BigDecimal.valueOf(99.00), 2, 4, "Serviceable via Flyphones Express");
    }

    @Override
    public List<RateOption> calculateRates(String pickupPincode, String deliveryPincode, double weightKg, BigDecimal declaredValue, boolean cod) {
        log.info("[MOCK COURIER] Calculate rates from {} to {}, weight={}kg", pickupPincode, deliveryPincode, weightKg);
        return List.of(
            new RateOption("MOCK-STD", "Flyphones Standard", BigDecimal.valueOf(49.00), BigDecimal.valueOf(49.00), 3, 5),
            new RateOption("MOCK-EXP", "Flyphones Express", BigDecimal.valueOf(99.00), BigDecimal.valueOf(99.00), 1, 2)
        );
    }

    @Override
    public ShipmentResult createShipment(ShipmentRequest req) {
        long randomSeq = 100_000_000L + RANDOM.nextLong(899_999_999L);
        String awb = "MOCK-AWB-" + randomSeq;
        String providerOrderId = "MOCK-ORD-" + req.orderId();
        String providerShipmentId = "MOCK-SHP-" + req.orderId();
        log.info("[MOCK COURIER] Created mock shipment for order {} -> AWB {}", req.orderNumber(), awb);

        return new ShipmentResult(
            true,
            providerOrderId,
            providerShipmentId,
            awb,
            "Flyphones Express",
            "/api/v1/delivery/shipments/" + req.orderId() + "/label-pdf",
            "MOCK-PKP-" + randomSeq,
            Instant.now().plusSeconds(86400),
            LocalDate.now().plusDays(3),
            "Mock shipment successfully created"
        );
    }

    @Override
    public boolean cancelShipment(String providerOrderId, String awbNumber) {
        log.info("[MOCK COURIER] Cancelled shipment providerOrderId={}, AWB={}", providerOrderId, awbNumber);
        return true;
    }

    @Override
    public TrackingResult fetchTracking(String providerOrderId, String awbNumber) {
        log.info("[MOCK COURIER] Fetch tracking for AWB={}", awbNumber);
        Instant now = Instant.now();
        List<TrackingEventSpec> events = List.of(
            new TrackingEventSpec("LABEL_CREATED", "Shipping label created at fulfillment center", "Jaipur Warehouse", now.minusSeconds(7200)),
            new TrackingEventSpec("PICKED_UP", "Package picked up by courier", "Jaipur Hub", now.minusSeconds(3600)),
            new TrackingEventSpec("IN_TRANSIT", "In transit to destination city", "Delhi Gateway", now)
        );
        return new TrackingResult(
            true,
            "IN_TRANSIT",
            "Delhi Gateway",
            LocalDate.now().plusDays(2),
            events,
            "{\"status\":\"IN_TRANSIT\",\"mock\":true}"
        );
    }

    @Override
    public ReversePickupResult createReversePickup(ReversePickupRequest req) {
        long randomSeq = 100_000_000L + RANDOM.nextLong(899_999_999L);
        String reverseAwb = "MOCK-REV-AWB-" + randomSeq;
        log.info("[MOCK COURIER] Created reverse pickup for return {} -> AWB {}", req.returnId(), reverseAwb);

        return new ReversePickupResult(
            true,
            "MOCK-REV-ORD-" + req.returnId(),
            reverseAwb,
            "Flyphones Reverse Express",
            LocalDate.now().plusDays(1).toString(),
            "Mock reverse pickup scheduled"
        );
    }
}
