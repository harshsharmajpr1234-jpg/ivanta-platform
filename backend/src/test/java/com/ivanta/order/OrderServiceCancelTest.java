package com.ivanta.order;

import com.ivanta.audit.AuditService;
import com.ivanta.auth.UserRepository;
import com.ivanta.cart.CartService;
import com.ivanta.checkout.CheckoutService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.InvalidStateException;
import com.ivanta.config.IvantaProperties;
import com.ivanta.dto.OrderDtos.OrderDetail;
import com.ivanta.coupon.CouponService;
import com.ivanta.delivery.DeliveryAddressRepository;
import com.ivanta.delivery.ShipmentRepository;
import com.ivanta.delivery.ShipmentTrackingEventRepository;
import com.ivanta.inventory.InventoryService;
import com.ivanta.notification.NotificationService;
import com.ivanta.payment.Payment;
import com.ivanta.payment.PaymentRepository;
import com.ivanta.product.ProductRepository;
import com.ivanta.returnrefund.Refund;
import com.ivanta.returnrefund.RefundService;
import com.ivanta.common.util.IdService;
import com.ivanta.user.AddressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: IDOR guard, customer cancel rules, stock release vs restock, refunds. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrderServiceCancelTest {

    @Mock OrderRepository orders;
    @Mock OrderItemRepository orderItems;
    @Mock OrderStatusHistoryRepository history;
    @Mock com.ivanta.order.OrderNoteRepository notes;
    @Mock OrderStateMachine stateMachine;
    @Mock CheckoutService checkout;
    @Mock CartService carts;
    @Mock InventoryService inventory;
    @Mock CouponService coupons;
    @Mock NotificationService notifications;
    @Mock RefundService refundService;
    @Mock DeliveryAddressRepository deliveryAddresses;
    @Mock ShipmentRepository shipments;
    @Mock ShipmentTrackingEventRepository trackingEvents;
    @Mock PaymentRepository payments;
    @Mock UserRepository users;
    @Mock ProductRepository products;
    @Mock com.ivanta.product.ProductVariantRepository variants;
    @Mock com.ivanta.returnrefund.ReturnRequestRepository returnRequests;
    @Mock com.ivanta.replacement.ReplacementRepository replacements;
    @Mock com.ivanta.invoice.InvoiceRepository invoices;
    @Mock com.ivanta.delivery.ShippingMethodRepository shippingMethods;
    @Mock IdService ids;
    @Mock AuditService audit;
    @Spy IvantaProperties props = new IvantaProperties();

    OrderService service;

    @BeforeEach
    void setUp() {
        service = new OrderService(orders, orderItems, history, notes, stateMachine, checkout, carts,
                inventory, coupons, notifications, refundService, deliveryAddresses, shipments,
                trackingEvents, payments, users, products, variants, returnRequests, replacements,
                invoices, shippingMethods, ids, audit, props);
        when(stateMachine.apply(any(), anyString(), anyString(), any(), any())).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setStatus(i.getArgument(1));
            return o;
        });
        when(orderItems.findByOrderId(anyString())).thenReturn(List.of());
        when(deliveryAddresses.findByOrderId(anyString())).thenReturn(Optional.empty());
        when(shipments.findFirstByOrderIdOrderByIdDesc(anyString())).thenReturn(Optional.empty());
        when(payments.findFirstByOrderIdOrderByIdDesc(anyString())).thenReturn(Optional.empty());
    }

    private Order order(String id, String userId, String status) {
        Order o = new Order();
        o.setId(id);
        o.setUserId(userId);
        o.setStatus(status);
        o.setPlacedAt(Instant.now());
        o.setGrandTotal(new BigDecimal("95000.00"));
        o.setSubtotal(new BigDecimal("95000.00"));
        return o;
    }

    @Test
    void customerCannotReadAnotherCustomersOrder() {
        when(orders.findByIdAndUserId("ORD-1", "U2")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getForUser("U2", "ORD-1"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.NOT_FOUND);
    }

    @Test
    void deliveredOrderCannotBeCancelledByCustomer() {
        when(orders.findByIdAndUserId("ORD-1", "U1"))
                .thenReturn(Optional.of(order("ORD-1", "U1", "DELIVERED")));
        assertThatThrownBy(() -> service.cancelByCustomer("U1", "ORD-1", "changed mind"))
                .isInstanceOf(InvalidStateException.class);
    }

    @Test
    void cancelWithOpenReservationReleasesStock() {
        Order o = order("ORD-1", "U1", "PENDING_PAYMENT");
        when(orders.findByIdAndUserId("ORD-1", "U1")).thenReturn(Optional.of(o));
        when(inventory.hasOpenReservation("ORD-1")).thenReturn(true);

        service.cancelByCustomer("U1", "ORD-1", "changed mind");

        verify(inventory).releaseForOrder("ORD-1", false);
        verify(inventory, never()).receiveReturn(any(), any(), any(), anyInt(), any());
        verify(stateMachine).apply(o, "CANCELLED", "CUSTOMER", "U1", "changed mind");
    }

    @Test
    void cancelAfterPaymentRestocksAndRefunds() {
        Order o = order("ORD-1", "U1", "PLACED");
        when(orders.findByIdAndUserId("ORD-1", "U1")).thenReturn(Optional.of(o));
        when(inventory.hasOpenReservation("ORD-1")).thenReturn(false);   // consumed at payment success
        OrderItem oi = new OrderItem();
        oi.setId("OIT-1");
        oi.setProductId("P1");
        oi.setVariantId("V1");
        oi.setQuantity(1);
        when(orderItems.findByOrderId("ORD-1")).thenReturn(List.of(oi));
        Payment paid = new Payment();
        paid.setId("PAY-1");
        paid.setStatus("SUCCESS");
        when(payments.findFirstByOrderIdOrderByIdDesc("ORD-1")).thenReturn(Optional.of(paid));
        Refund refund = new Refund();
        refund.setId("REF-1");
        refund.setStatus("SUCCESS");
        when(refundService.refundOrder(eq(o), any(), any(), isNull())).thenReturn(refund);

        service.cancelByCustomer("U1", "ORD-1", "defective");

        verify(inventory).receiveReturn(eq("ORD-1"), eq("V1"), eq("P1"), eq(1), contains("Cancellation restock"));
        verify(refundService).refundOrder(eq(o), eq(new BigDecimal("95000.00")), eq("defective"), isNull());
        verify(stateMachine).apply(o, "CANCELLED", "CUSTOMER", "U1", "defective");
        verify(stateMachine).apply(o, "REFUND_INITIATED", "SYSTEM", null, "Refund initiated for cancellation");
        verify(stateMachine).apply(o, "REFUNDED", "SYSTEM", null, "Cancellation refund completed");
    }

    @Test
    void cancelAfterShippingBecomesRequestInsteadOfDirectCancel() {
        Order o = order("ORD-1", "U1", "SHIPPED");
        when(orders.findByIdAndUserId("ORD-1", "U1")).thenReturn(Optional.of(o));

        OrderDetail view = service.cancelByCustomer("U1", "ORD-1", "not needed anymore");

        assertThat(view.status()).isEqualTo("CANCEL_REQUESTED");
        verify(stateMachine).apply(o, "CANCEL_REQUESTED", "CUSTOMER", "U1", "not needed anymore");
        verify(stateMachine, never()).apply(eq(o), eq("CANCELLED"), anyString(), any(), any());
        verify(notifications).notifyUser(eq("U1"), eq("CANCEL_REQUESTED"), any(), any(), any());
        verify(inventory, never()).releaseForOrder(any(), anyBoolean());
    }

    @Test
    void adminCannotFakePaidOrDeliveredStatus() {
        Order o = order("ORD-1", "U1", "PROCESSING");
        when(orders.findById("ORD-1")).thenReturn(Optional.of(o));
        assertThatThrownBy(() -> service.adminUpdateStatus("ORD-1", "PLACED", null, "ADM-1"))
                .isInstanceOf(InvalidStateException.class)
                .hasMessageContaining("payment workflow");
        assertThatThrownBy(() -> service.adminUpdateStatus("ORD-1", "DELIVERED", null, "ADM-1"))
                .isInstanceOf(InvalidStateException.class);
        assertThatThrownBy(() -> service.adminUpdateStatus("ORD-1", "SHIPPED", null, "ADM-1"))
                .isInstanceOf(InvalidStateException.class)
                .hasMessageContaining("ship");
    }

    @Test
    void adminCanAdvanceProcessingToPacked() {
        Order o = order("ORD-1", "U1", "PROCESSING");
        when(orders.findById("ORD-1")).thenReturn(Optional.of(o));
        when(history.findByOrderIdOrderByIdAsc("ORD-1")).thenReturn(List.of());
        service.adminUpdateStatus("ORD-1", "PACKED", "ready", "ADM-1");
        verify(stateMachine).apply(o, "PACKED", "ADMIN", "ADM-1", "ready");
    }

    @Test
    void systemCancelOnlyTouchesUnpaidOrders() {
        Order o = order("ORD-1", "U1", "PENDING_PAYMENT");
        when(orders.findById("ORD-1")).thenReturn(Optional.of(o));
        when(inventory.hasOpenReservation("ORD-1")).thenReturn(true);
        service.cancelSystem("ORD-1", "Stock reservation expired before payment");
        verify(stateMachine).apply(o, "CANCELLED", "SYSTEM", null, "Stock reservation expired before payment");

        Order shipped = order("ORD-2", "U1", "SHIPPED");
        when(orders.findById("ORD-2")).thenReturn(Optional.of(shipped));
        service.cancelSystem("ORD-2", "expired");
        verify(stateMachine, never()).apply(eq(shipped), eq("CANCELLED"), anyString(), any(), any());
    }
}
