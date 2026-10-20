package com.ivanta.order;

import com.ivanta.audit.AuditService;
import com.ivanta.common.exception.InvalidStateException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** §59: order status transitions — invalid ones must be rejected. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderStateMachineTest {

    @Mock OrderRepository orders;
    @Mock OrderStatusHistoryRepository history;
    @Mock AuditService audit;

    OrderStateMachine sm;

    @BeforeEach
    void setUp() { sm = new OrderStateMachine(orders, history, audit); }

    private Order orderWith(String status) {
        Order o = new Order();
        o.setId("ORD-2026-000001");
        o.setOrderNumber("IVN-20260926-000001");
        o.setStatus(status);
        o.setPlacedAt(java.time.Instant.now());
        return o;
    }

    @ParameterizedTest
    @CsvSource({
        // payment
        "PENDING_PAYMENT,PLACED", "PENDING_PAYMENT,PAYMENT_FAILED", "PAYMENT_FAILED,PENDING_PAYMENT",
        "PAYMENT_FAILED,CANCELLED",
        // fulfilment
        "PLACED,CONFIRMED", "CONFIRMED,PROCESSING", "PROCESSING,PACKED", "PACKED,SHIPPED",
        "SHIPPED,IN_TRANSIT", "IN_TRANSIT,OUT_FOR_DELIVERY", "OUT_FOR_DELIVERY,DELIVERED",
        "SHIPPED,OUT_FOR_DELIVERY", "SHIPPED,DELIVERED", "IN_TRANSIT,DELIVERED",
        // cancellation
        "PLACED,CANCELLED", "CONFIRMED,CANCELLED", "PROCESSING,CANCELLED", "PACKED,CANCELLED",
        "SHIPPED,CANCEL_REQUESTED", "IN_TRANSIT,CANCEL_REQUESTED", "OUT_FOR_DELIVERY,CANCEL_REQUESTED",
        "CANCEL_REQUESTED,CANCELLED", "CANCEL_REQUESTED,IN_TRANSIT", "CANCEL_REQUESTED,OUT_FOR_DELIVERY",
        // returns & refunds
        "DELIVERED,RETURN_REQUESTED", "RETURN_REQUESTED,RETURN_APPROVED", "RETURN_REQUESTED,DELIVERED",
        "RETURN_APPROVED,RETURN_PICKUP_SCHEDULED", "RETURN_PICKUP_SCHEDULED,RETURN_PICKED_UP",
        "RETURN_PICKED_UP,RETURN_RECEIVED", "RETURN_PICKUP_SCHEDULED,RETURN_RECEIVED",
        "RETURN_RECEIVED,RETURN_INSPECTION", "RETURN_INSPECTION,REFUND_INITIATED",
        "RETURN_INSPECTION,DELIVERED", "REFUND_INITIATED,REFUNDED", "REFUND_INITIATED,DELIVERED",
        "CANCELLED,REFUND_INITIATED", "CANCELLED,REFUNDED",
        // replacements
        "DELIVERED,REPLACEMENT_REQUESTED", "REPLACEMENT_REQUESTED,REPLACEMENT_PROCESSING",
        "REPLACEMENT_REQUESTED,DELIVERED", "REPLACEMENT_PROCESSING,REPLACEMENT_SHIPPED",
        "REPLACEMENT_SHIPPED,REPLACEMENT_DELIVERED"
    })
    void allowsLegalTransitions(String from, String to) {
        Order o = sm.apply(orderWith(from), to, "ADMIN", "ADM-1", null);
        assertThat(o.getStatus()).isEqualTo(to);
        verify(history).save(any(OrderStatusHistory.class));
        verify(audit).record(eq("ORDER_STATUS_CHANGED"), eq("order"), any(), eq(from), any());
    }

    @ParameterizedTest
    @CsvSource({
        "PLACED,DELIVERED", "PLACED,SHIPPED", "DELIVERED,PLACED",
        "CANCELLED,PROCESSING", "SHIPPED,CANCELLED", "PENDING_PAYMENT,DELIVERED",
        "PROCESSING,DELIVERED", "REFUNDED,PLACED", "CONFIRMED,SHIPPED",
        "DELIVERED,CANCELLED", "PACKED,DELIVERED", "OUT_FOR_DELIVERY,CANCELLED",
        "REPLACEMENT_DELIVERED,DELIVERED", "RETURN_RECEIVED,DELIVERED",
        "PENDING_PAYMENT,CONFIRMED", "REFUND_INITIATED,RETURN_RECEIVED"
    })
    void rejectsIllegalTransitions(String from, String to) {
        Order o = orderWith(from);
        assertThatThrownBy(() -> sm.apply(o, to, "ADMIN", "ADM-1", null))
                .isInstanceOf(InvalidStateException.class);
        verify(orders, never()).save(any());
        verify(history, never()).save(any());
    }

    @Test
    void cancellationRecordsReasonTimestampAndActor() {
        Order o = sm.apply(orderWith("PLACED"), "CANCELLED", "CUSTOMER", "USR-1", "changed mind");
        assertThat(o.getCancelledAt()).isNotNull();
        assertThat(o.getCancellationReason()).isEqualTo("changed mind");
        assertThat(o.getCancelledByType()).isEqualTo("CUSTOMER");
        assertThat(o.getCancelledBy()).isEqualTo("USR-1");
    }

    @Test
    void lifecycleTimestampsAreStamped() {
        Order o = orderWith("PLACED");
        o = sm.apply(o, "CONFIRMED", "ADMIN", "ADM-1", null);
        assertThat(o.getConfirmedAt()).isNotNull();
        o = sm.apply(o, "PROCESSING", "ADMIN", "ADM-1", null);
        o = sm.apply(o, "PACKED", "ADMIN", "ADM-1", null);
        o = sm.apply(o, "SHIPPED", "ADMIN", "ADM-1", null);
        assertThat(o.getShippedAt()).isNotNull();
        assertThat(o.getShippingStatus()).isEqualTo("SHIPPED");
        o = sm.apply(o, "IN_TRANSIT", "SYSTEM", null, null);
        assertThat(o.getShippingStatus()).isEqualTo("IN_TRANSIT");
        o = sm.apply(o, "OUT_FOR_DELIVERY", "SYSTEM", null, null);
        assertThat(o.getShippingStatus()).isEqualTo("OUT_FOR_DELIVERY");
        o = sm.apply(o, "DELIVERED", "SYSTEM", null, null);
        assertThat(o.getDeliveredAt()).isNotNull();
        assertThat(o.getShippingStatus()).isEqualTo("DELIVERED");
    }
}
