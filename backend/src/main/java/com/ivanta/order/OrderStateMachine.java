package com.ivanta.order;

import com.ivanta.audit.AuditService;
import com.ivanta.common.exception.InvalidStateException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Set;

/**
 * Order lifecycle (Amazon/Flipkart-grade): every transition is validated
 * against this map, written to the append-only order_status_history and
 * audited. Invalid transitions are rejected with INVALID_STATE.
 *
 * Canonical statuses:
 *   PENDING_PAYMENT, PAYMENT_FAILED, PLACED, CONFIRMED, PROCESSING, PACKED,
 *   SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED,
 *   CANCEL_REQUESTED, CANCELLED,
 *   RETURN_REQUESTED, RETURN_APPROVED, RETURN_PICKUP_SCHEDULED, RETURN_PICKED_UP,
 *   RETURN_RECEIVED, RETURN_INSPECTION, REFUND_INITIATED, REFUNDED,
 *   REPLACEMENT_REQUESTED, REPLACEMENT_PROCESSING, REPLACEMENT_SHIPPED,
 *   REPLACEMENT_DELIVERED
 */
@Component
@RequiredArgsConstructor
public class OrderStateMachine {

    public static final Map<String, Set<String>> TRANSITIONS = Map.ofEntries(
            // payment leg
            Map.entry("PENDING_PAYMENT", Set.of("PLACED", "PAYMENT_FAILED", "CANCELLED")),
            Map.entry("PAYMENT_FAILED", Set.of("PENDING_PAYMENT", "CANCELLED")),
            // fulfilment leg
            Map.entry("PLACED", Set.of("CONFIRMED", "CANCELLED")),
            Map.entry("CONFIRMED", Set.of("PROCESSING", "CANCELLED")),
            Map.entry("PROCESSING", Set.of("PACKED", "CANCELLED")),
            Map.entry("PACKED", Set.of("SHIPPED", "CANCELLED")),
            Map.entry("SHIPPED", Set.of("IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCEL_REQUESTED")),
            Map.entry("IN_TRANSIT", Set.of("OUT_FOR_DELIVERY", "DELIVERED", "CANCEL_REQUESTED")),
            Map.entry("OUT_FOR_DELIVERY", Set.of("DELIVERED", "CANCEL_REQUESTED")),
            // cancellation request (post-shipment): admin approves (CANCELLED) or
            // rejects (resumes at the shipping status the request was raised from)
            Map.entry("CANCEL_REQUESTED", Set.of("CANCELLED", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY")),
            // return leg (mirrors the return_requests workflow)
            Map.entry("DELIVERED", Set.of("RETURN_REQUESTED", "REPLACEMENT_REQUESTED")),
            Map.entry("RETURN_REQUESTED", Set.of("RETURN_APPROVED", "DELIVERED")),
            Map.entry("RETURN_APPROVED", Set.of("RETURN_PICKUP_SCHEDULED", "DELIVERED")),
            Map.entry("RETURN_PICKUP_SCHEDULED", Set.of("RETURN_PICKED_UP", "RETURN_RECEIVED", "DELIVERED")),
            Map.entry("RETURN_PICKED_UP", Set.of("RETURN_RECEIVED")),
            Map.entry("RETURN_RECEIVED", Set.of("RETURN_INSPECTION")),
            Map.entry("RETURN_INSPECTION", Set.of("REFUND_INITIATED", "DELIVERED")),
            Map.entry("REFUND_INITIATED", Set.of("REFUNDED", "DELIVERED")),
            // replacement leg
            Map.entry("REPLACEMENT_REQUESTED", Set.of("REPLACEMENT_PROCESSING", "DELIVERED")),
            Map.entry("REPLACEMENT_PROCESSING", Set.of("REPLACEMENT_SHIPPED", "DELIVERED")),
            Map.entry("REPLACEMENT_SHIPPED", Set.of("REPLACEMENT_DELIVERED")),
            // terminal-ish
            Map.entry("CANCELLED", Set.of("REFUND_INITIATED", "REFUNDED")),
            Map.entry("REFUNDED", Set.of()),
            Map.entry("REPLACEMENT_DELIVERED", Set.of()));

    /** Statuses a customer may cancel from directly (before packing/shipping). */
    public static final Set<String> CUSTOMER_CANCELLABLE =
            Set.of("PENDING_PAYMENT", "PAYMENT_FAILED", "PLACED", "CONFIRMED", "PROCESSING");

    /** Statuses where a customer may REQUEST cancellation (admin approves/rejects). */
    public static final Set<String> CUSTOMER_CANCEL_REQUESTABLE =
            Set.of("SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY");

    /** Statuses that count as "active" (badge-worthy) on the customer side. */
    public static final Set<String> ACTIVE_STATUSES =
            Set.of("PENDING_PAYMENT", "PAYMENT_FAILED", "PLACED", "CONFIRMED", "PROCESSING", "PACKED",
                    "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "CANCEL_REQUESTED",
                    "RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_PICKUP_SCHEDULED", "RETURN_PICKED_UP",
                    "RETURN_RECEIVED", "RETURN_INSPECTION", "REFUND_INITIATED",
                    "REPLACEMENT_REQUESTED", "REPLACEMENT_PROCESSING", "REPLACEMENT_SHIPPED");

    private final OrderRepository orders;
    private final OrderStatusHistoryRepository history;
    private final AuditService audit;

    public static boolean can(String from, String to) {
        return TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
    }

    @Transactional
    public Order apply(Order order, String newStatus, String byType, String byId, String reason) {
        String prev = order.getStatus();
        if (!can(prev, newStatus))
            throw new InvalidStateException("Cannot move order " + order.getId() + " from " + prev + " to " + newStatus);
        order.setStatus(newStatus);
        Instant now = Instant.now();
        switch (newStatus) {
            case "CONFIRMED" -> { if (order.getConfirmedAt() == null) order.setConfirmedAt(now); }
            case "SHIPPED" -> { order.setShippedAt(now); order.setShippingStatus("SHIPPED"); }
            case "IN_TRANSIT" -> order.setShippingStatus("IN_TRANSIT");
            case "OUT_FOR_DELIVERY" -> order.setShippingStatus("OUT_FOR_DELIVERY");
            case "DELIVERED" -> { order.setDeliveredAt(now); order.setShippingStatus("DELIVERED"); }
            case "CANCELLED" -> {
                order.setCancelledAt(now);
                order.setCancellationReason(reason);
                order.setCancelledByType(byType);
                order.setCancelledBy(byId);
                order.setShippingStatus("CANCELLED");
            }
            case "PACKED" -> order.setShippingStatus("PACKED");
            default -> { }
        }
        orders.save(order);

        OrderStatusHistory h = new OrderStatusHistory();
        h.setOrderId(order.getId());
        h.setPreviousStatus(prev);
        h.setNewStatus(newStatus);
        h.setChangedByType(byType);
        h.setChangedBy(byId);
        h.setReason(reason);
        history.save(h);

        audit.record("ORDER_STATUS_CHANGED", "order", order.getId(), prev, newStatus
                + (reason == null ? "" : " (" + reason + ")"));
        return order;
    }

    /** Initial placement: writes the opening history row without transition validation. */
    @Transactional
    public void recordInitial(Order order, String byType, String byId) {
        OrderStatusHistory h = new OrderStatusHistory();
        h.setOrderId(order.getId());
        h.setPreviousStatus(null);
        h.setNewStatus(order.getStatus());
        h.setChangedByType(byType);
        h.setChangedBy(byId);
        h.setReason("Order placed");
        history.save(h);
    }
}
