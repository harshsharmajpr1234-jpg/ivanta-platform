package com.ivanta.payment;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.InvalidStateException;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.dto.PaymentDtos.InitiateRequest;
import com.ivanta.dto.PaymentDtos.PaymentView;
import com.ivanta.dto.PaymentDtos.VerifyRequest;
import com.ivanta.inventory.InventoryService;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderRepository;
import com.ivanta.order.OrderStateMachine;
import com.ivanta.payment.provider.MockPaymentProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: customer cannot mark payment successful — verification is server-side. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceTest {

    @Mock com.ivanta.order.OrderItemRepository orderItems;
    @Mock PaymentRepository payments;
    @Mock PaymentTransactionRepository transactions;
    @Mock PaymentStatusHistoryRepository statusHistory;
    @Mock OrderRepository orders;
    @Mock OrderStateMachine stateMachine;
    @Mock InventoryService inventory;
    @Mock NotificationService notifications;
    @Mock IdService ids;
    @Mock AuditService audit;

    IvantaProperties props = new IvantaProperties();
    PaymentService service;

    @BeforeEach
    void setUp() {
        props.getPayment().setMockSecret("test-secret");
        service = new PaymentService(orderItems, payments, transactions, statusHistory,
                new MockPaymentProvider(props), orders, stateMachine, inventory,
                notifications, props, ids, audit);
        when(ids.next(anyString(), anyString(), anyInt())).thenReturn("PTX-1");
        when(stateMachine.apply(any(), anyString(), anyString(), any(), any())).thenAnswer(i -> {
            Order oo = i.getArgument(0);
            oo.setStatus(i.getArgument(1));
            return oo;
        });
    }

    private Order order(String status, String total) {
        Order o = new Order();
        o.setId("ORD-2026-000001");
        o.setUserId("U1");
        o.setStatus(status);
        o.setGrandTotal(new BigDecimal(total));
        return o;
    }

    private Payment payment(String status, String amount, String method) {
        Payment p = new Payment();
        p.setId("PAY-00001");
        p.setOrderId("ORD-2026-000001");
        p.setUserId("U1");
        p.setAmount(new BigDecimal(amount));
        p.setMethod(method);
        p.setProvider("mock");
        p.setStatus(status);
        return p;
    }

    private String reference(String paymentId, String amount, String method) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(
                mac.doFinal((paymentId + ":" + amount + ":" + method).getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void verifyAcceptsServerIssuedReference() throws Exception {
        Payment p = payment("PROCESSING", "95000.00", "UPI");
        Order o = order("PENDING_PAYMENT", "95000.00");
        when(payments.findByIdAndUserId("PAY-00001", "U1")).thenReturn(Optional.of(p));
        when(orders.findById("ORD-2026-000001")).thenReturn(Optional.of(o));

        PaymentView view = service.verify("U1", "PAY-00001",
                new VerifyRequest(reference("PAY-00001", "95000.00", "UPI")));

        assertThat(view.status()).isEqualTo("SUCCESS");
        assertThat(o.getPaymentStatus()).isEqualTo("SUCCESS");
        verify(inventory).consumeForOrder("ORD-2026-000001");
        verify(stateMachine).apply(o, "PLACED", "SYSTEM", null, "Payment verified");
        verify(notifications).notifyUser(eq("U1"), eq("PAYMENT_SUCCESS"), any(), any(), any());
    }

    @Test
    void verifyRejectsForgedReference_marksPaymentFailedAndReleasesStock() {
        Payment p = payment("PROCESSING", "95000.00", "UPI");
        Order o = order("PENDING_PAYMENT", "95000.00");
        when(payments.findByIdAndUserId("PAY-00001", "U1")).thenReturn(Optional.of(p));
        when(orders.findById("ORD-2026-000001")).thenReturn(Optional.of(o));

        assertThatThrownBy(() -> service.verify("U1", "PAY-00001", new VerifyRequest("forged-reference")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.PAYMENT_VERIFICATION_FAILED);

        assertThat(p.getStatus()).isEqualTo("FAILED");
        assertThat(o.getStatus()).isEqualTo("PAYMENT_FAILED");
        assertThat(o.getPaymentStatus()).isEqualTo("FAILED");
        verify(inventory).releaseForOrder("ORD-2026-000001", false);
        verify(stateMachine).apply(o, "PAYMENT_FAILED", "SYSTEM", null, "Payment verification failed");
        verify(inventory, never()).consumeForOrder(any());
    }

    @Test
    void verifyRejectsTamperedAmount() throws Exception {
        // reference computed over a DIFFERENT amount than the order's grand total
        Payment p = payment("PROCESSING", "95000.00", "UPI");
        Order o = order("PENDING_PAYMENT", "100000.00");      // tampered order total mismatch
        when(payments.findByIdAndUserId("PAY-00001", "U1")).thenReturn(Optional.of(p));
        when(orders.findById("ORD-2026-000001")).thenReturn(Optional.of(o));

        assertThatThrownBy(() -> service.verify("U1", "PAY-00001",
                new VerifyRequest(reference("PAY-00001", "95000.00", "UPI"))))
                .isInstanceOf(BusinessException.class);
        verify(inventory, never()).consumeForOrder(any());
    }

    @Test
    void cannotInitiateOnNonPendingOrder() {
        when(orders.findByIdAndUserId("ORD-2026-000001", "U1"))
                .thenReturn(Optional.of(order("DELIVERED", "95000.00")));
        assertThatThrownBy(() -> service.initiate("U1", new InitiateRequest("ORD-2026-000001", "UPI")))
                .isInstanceOf(InvalidStateException.class);
    }

    @Test
    void initiateReturnsMockClientSecret_andKeepsOrderAwaitingPayment() {
        Order o = order("PENDING_PAYMENT", "95000.00");
        when(orders.findByIdAndUserId("ORD-2026-000001", "U1")).thenReturn(Optional.of(o));
        when(payments.findByOrderId("ORD-2026-000001")).thenReturn(List.of());
        when(payments.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));

        PaymentView view = service.initiate("U1", new InitiateRequest("ORD-2026-000001", "UPI"));
        assertThat(view.status()).isEqualTo("PROCESSING");
        assertThat(view.clientSecret()).isNotBlank();
        assertThat(o.getStatus()).isEqualTo("PENDING_PAYMENT");
        verify(stateMachine, never()).apply(any(), anyString(), anyString(), any(), any());
    }

    @Test
    void retryAfterFailureReReservesStockAndReturnsToPendingPayment() {
        Order o = order("PAYMENT_FAILED", "95000.00");
        when(orders.findByIdAndUserId("ORD-2026-000001", "U1")).thenReturn(Optional.of(o));
        when(payments.findByOrderId("ORD-2026-000001")).thenReturn(List.of());
        when(payments.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        com.ivanta.order.OrderItem oi = new com.ivanta.order.OrderItem();
        oi.setProductId("P1");
        oi.setVariantId("V1");
        oi.setQuantity(1);
        oi.setProductName("iPhone 17");
        when(orderItems.findByOrderId("ORD-2026-000001")).thenReturn(List.of(oi));

        PaymentView view = service.initiate("U1", new InitiateRequest("ORD-2026-000001", "UPI"));
        assertThat(view.status()).isEqualTo("PROCESSING");
        verify(inventory).reserveForOrder(eq("ORD-2026-000001"), anyList(), anyInt());
        verify(stateMachine).apply(o, "PENDING_PAYMENT", "SYSTEM", null, "Payment retry initiated");
    }

    @Test
    void codCannotBeCollectedBeforeDelivery() {
        Payment p = payment("PENDING", "95000.00", "COD");
        when(payments.findById("PAY-00001")).thenReturn(Optional.of(p));
        when(orders.findById("ORD-2026-000001")).thenReturn(Optional.of(order("PROCESSING", "95000.00")));
        assertThatThrownBy(() -> service.confirmCodCollected("PAY-00001", "ADM-1"))
                .isInstanceOf(InvalidStateException.class);
    }

    @Test
    void codCollectedAfterDeliverySucceeds() {
        Payment p = payment("PENDING", "95000.00", "COD");
        when(payments.findById("PAY-00001")).thenReturn(Optional.of(p));
        when(orders.findById("ORD-2026-000001")).thenReturn(Optional.of(order("DELIVERED", "95000.00")));
        PaymentView view = service.confirmCodCollected("PAY-00001", "ADM-1");
        assertThat(view.status()).isEqualTo("SUCCESS");
        verify(audit).record(eq("PAYMENT_CONFIRMED"), eq("payment"), eq("PAY-00001"), any(), any());
    }

    @Test
    void otherCustomersPaymentIsNotFound_idorGuard() {
        when(payments.findByIdAndUserId("PAY-00001", "U2")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getForUser("U2", "PAY-00001"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.NOT_FOUND);
    }
}
