package com.ivanta.payment;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.InvalidStateException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.dto.PaymentDtos.*;
import com.ivanta.inventory.InventoryService;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderRepository;
import com.ivanta.order.OrderStateMachine;
import com.ivanta.payment.provider.PaymentProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Payments (§25/§26/§45). Success is NEVER taken from the client: verify()
 * re-checks the server-issued provider reference and re-reads the amount from
 * the DB. Failure releases stock and cancels the order in one transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final com.ivanta.order.OrderItemRepository orderItemsRepo;
    private final PaymentRepository payments;
    private final PaymentTransactionRepository transactions;
    private final PaymentStatusHistoryRepository statusHistory;
    private final PaymentProvider provider;
    private final OrderRepository orders;
    private final OrderStateMachine stateMachine;
    private final InventoryService inventory;
    private final NotificationService notifications;
    private final IvantaProperties props;
    private final IdService ids;
    private final AuditService audit;

    @Transactional
    public PaymentView initiate(String userId, InitiateRequest req) {
        Order order = orders.findByIdAndUserId(req.orderId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + req.orderId()));
        if (!Set.of("PENDING_PAYMENT", "PAYMENT_FAILED").contains(order.getStatus()))
            throw new InvalidStateException("Order " + order.getId() + " is not awaiting payment (status: "
                    + order.getStatus() + ")");
        String method = req.method().toUpperCase();
        if ("COD".equals(method))
            throw new InvalidStateException("Cash on Delivery is chosen at checkout, not initiated here");
        if (!Set.of("UPI", "CARD", "NETBANKING", "WALLET").contains(method))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unsupported payment method");

        BigDecimal amount = order.getGrandTotal();     // server-side amount, always

        // reuse an open attempt for the same method, else create a new one
        Payment payment = payments.findByOrderId(order.getId()).stream()
                .filter(p -> Set.of("PENDING", "PROCESSING").contains(p.getStatus()) && p.getMethod().equals(method))
                .findFirst()
                .orElseGet(() -> {
                    Payment p = new Payment();
                    p.setId(ids.next("payments", "PAY", 5));
                    p.setOrderId(order.getId());
                    p.setUserId(userId);
                    p.setAmount(amount);
                    p.setMethod(method);
                    p.setProvider(provider.name());
                    p.setStatus("PENDING");
                    return payments.save(p);
                });

        if ("PAYMENT_FAILED".equals(order.getStatus())) {
            // previous attempt failed and released the reservation — re-reserve before retrying;
            // the inventory service re-checks availability under lock (no overselling).
            inventory.reserveForOrder(order.getId(), orderItemsForRetry(order.getId()),
                    props.getCheckout().getReservationTtlMinutes());
            stateMachine.apply(order, "PENDING_PAYMENT", "SYSTEM", null, "Payment retry initiated");
            order.setPaymentStatus("PENDING");
            orders.save(order);
        }

        PaymentProvider.InitResult init = provider.initiate(payment.getId(), amount, method);
        String prev = payment.getStatus();
        payment.setStatus("PROCESSING");
        payment.setProviderTransactionId(init.providerTransactionId());
        payment.setProviderOrderId(init.providerOrderId());
        payment.setProviderReference(init.reference());
        payments.save(payment);
        recordTxn(payment, "INITIATE", init.providerTransactionId(), "SUCCESS", init.raw());
        recordHistory(payment, prev, "PROCESSING", "Initiated via " + provider.name(), null);

        order.setPaymentStatus("PROCESSING");
        orders.save(order);

        audit.record("PAYMENT_STATUS_CHANGED", "payment", payment.getId(), prev,
                "PROCESSING order=" + order.getId() + " amount=" + amount);
        return toView(payment, init.clientSecret());
    }

    // noRollbackFor: a failed verification must PERSIST its outcome (payment FAILED,
    // stock released, order CANCELLED) before the error propagates to the client (§18).
    @Transactional(noRollbackFor = BusinessException.class)
    public PaymentView verify(String userId, String paymentId, VerifyRequest req) {
        Payment payment = payments.findByIdAndUserId(paymentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment " + paymentId));
        Order order = orders.findById(payment.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order " + payment.getOrderId()));

        if ("SUCCESS".equals(payment.getStatus())) return toView(payment, null);   // idempotent

        boolean amountMatches = payment.getAmount().compareTo(order.getGrandTotal()) == 0;
        PaymentProvider.VerifyResult result = amountMatches
                ? provider.verify(payment.getId(), payment.getAmount(), req.reference())
                : new PaymentProvider.VerifyResult(false, null, null, "amount mismatch", null);

        String txnId = result.providerPaymentId() != null ? result.providerPaymentId() : result.providerOrderId();
        recordTxn(payment, "VERIFY", txnId, result.success() ? "SUCCESS" : "FAILED", result.raw());

        if (!result.success()) {
            String prev = payment.getStatus();
            payment.setStatus("FAILED");
            if (result.providerOrderId() != null) payment.setProviderOrderId(result.providerOrderId());
            if (result.providerPaymentId() != null) payment.setProviderPaymentId(result.providerPaymentId());
            payment.setFailureReason(result.reason());
            payment.setProcessedAt(Instant.now());
            payments.save(payment);
            recordHistory(payment, prev, "FAILED", result.reason(), null);
            inventory.releaseForOrder(order.getId(), false);
            if (!"PAYMENT_FAILED".equals(order.getStatus()))
                stateMachine.apply(order, "PAYMENT_FAILED", "SYSTEM", null, "Payment verification failed");
            order.setPaymentStatus("FAILED");
            orders.save(order);
            audit.record("PAYMENT_STATUS_CHANGED", "payment", payment.getId(), prev, "FAILED");
            notifications.notifyUser(userId, "PAYMENT_FAILED",
                    Map.of("orderNumber", displayNumber(order)), "payment", payment.getId());
            throw new BusinessException(ErrorCode.PAYMENT_VERIFICATION_FAILED,
                    "Payment could not be verified. No amount has been captured. You can retry the payment.");
        }

        String prev = payment.getStatus();
        payment.setStatus("SUCCESS");
        payment.setProcessedAt(Instant.now());
        if (result.providerOrderId() != null) payment.setProviderOrderId(result.providerOrderId());
        if (result.providerPaymentId() != null) payment.setProviderPaymentId(result.providerPaymentId());
        if (result.providerPaymentId() != null) payment.setProviderTransactionId(result.providerPaymentId());
        payments.save(payment);
        recordHistory(payment, prev, "SUCCESS", "Verified via " + provider.name(), null);

        inventory.consumeForOrder(order.getId());
        stateMachine.apply(order, "PLACED", "SYSTEM", null, "Payment verified");
        order.setPaymentStatus("SUCCESS");
        orders.save(order);

        audit.record("PAYMENT_CONFIRMED", "payment", payment.getId(), prev,
                "SUCCESS order=" + order.getId());
        notifications.notifyUser(userId, "PAYMENT_SUCCESS",
                Map.of("orderNumber", displayNumber(order), "amount", payment.getAmount().toPlainString()),
                "payment", payment.getId());
        return toView(payment, null);
    }

    /** COD collection at delivery (§26) — admin with PAYMENT_PROCESS. */
    @Transactional
    public PaymentView confirmCodCollected(String paymentId, String adminId) {
        Payment payment = payments.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment " + paymentId));
        if (!"COD".equals(payment.getMethod()))
            throw new InvalidStateException("Payment " + paymentId + " is not a COD payment");
        if (!"PENDING".equals(payment.getStatus()))
            throw new InvalidStateException("COD payment already " + payment.getStatus());
        Order order = orders.findById(payment.getOrderId()).orElseThrow();
        if (!Set.of("OUT_FOR_DELIVERY", "DELIVERED",
                "RETURN_REQUESTED", "RETURN_APPROVED", "RETURN_PICKUP_SCHEDULED", "RETURN_PICKED_UP",
                "RETURN_RECEIVED", "RETURN_INSPECTION").contains(order.getStatus()))
            throw new InvalidStateException("COD can only be collected after delivery (order status: "
                    + order.getStatus() + ")");

        String prev = payment.getStatus();
        payment.setStatus("SUCCESS");
        payment.setProcessedAt(Instant.now());
        payment.setProviderTransactionId("COD-" + payment.getId());
        payments.save(payment);
        recordTxn(payment, "CAPTURE", payment.getProviderTransactionId(), "SUCCESS", "{\"cod\":true}");
        recordHistory(payment, prev, "SUCCESS", "Cash collected at delivery", adminId);
        order.setPaymentStatus("SUCCESS");
        orders.save(order);
        audit.record("PAYMENT_CONFIRMED", "payment", payment.getId(), prev, "SUCCESS (COD collected)");
        notifications.notifyUser(order.getUserId(), "PAYMENT_SUCCESS",
                Map.of("orderNumber", displayNumber(order), "amount", payment.getAmount().toPlainString()),
                "payment", payment.getId());
        return toView(payment, null);
    }

    /* ---------- queries ---------- */

    @Transactional(readOnly = true)
    public List<PaymentView> listForUser(String userId) {
        return payments.findByUserIdOrderByIdDesc(userId).stream().map(p -> toView(p, null)).toList();
    }

    @Transactional(readOnly = true)
    public PaymentView getForUser(String userId, String paymentId) {
        return payments.findByIdAndUserId(paymentId, userId)
                .map(p -> toView(p, null))
                .orElseThrow(() -> new ResourceNotFoundException("Payment " + paymentId));
    }

    @Transactional(readOnly = true)
    public List<TransactionView> transactionsFor(String paymentId) {
        return transactions.findByPaymentIdOrderByIdDesc(paymentId).stream()
                .map(t -> new TransactionView(t.getId(), t.getProvider(), t.getProviderTransactionId(),
                        t.getTxnType(), t.getAmount(), t.getStatus(), t.getCreatedAt().toString()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<Payment> adminPage(String status, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        return (status == null || status.isBlank())
                ? payments.findAllByOrderByIdDesc(pr)
                : payments.findByStatusOrderByIdDesc(status, pr);
    }

    /* ---------- helpers ---------- */

    private void recordTxn(Payment p, String type, String providerTxn, String status, String raw) {
        PaymentTransaction t = new PaymentTransaction();
        t.setId(ids.next("payment_transactions", "PTX", 6));
        t.setPaymentId(p.getId());
        t.setProvider(p.getProvider());
        t.setProviderTransactionId(providerTxn);
        t.setTxnType(type);
        t.setAmount(p.getAmount());
        t.setStatus(status);
        t.setRawResponse(raw);
        transactions.save(t);
    }

    private void recordHistory(Payment p, String prev, String next, String reason, String by) {
        PaymentStatusHistory h = new PaymentStatusHistory();
        h.setPaymentId(p.getId());
        h.setPreviousStatus(prev);
        h.setNewStatus(next);
        h.setReason(reason);
        h.setChangedBy(by);
        statusHistory.save(h);
    }

    public PaymentView toView(Payment p, String clientSecret) {
        boolean devMock = "mock".equalsIgnoreCase(provider.name());
        boolean isRazorpay = "razorpay".equalsIgnoreCase(provider.name());
        String keyId = isRazorpay ? props.getPayment().getRazorpay().getKeyId() : null;
        String rzpOrderId = p.getProviderOrderId() != null ? p.getProviderOrderId() : (isRazorpay ? p.getProviderTransactionId() : null);
        return new PaymentView(p.getId(), p.getOrderId(), p.getAmount(), p.getCurrency(), p.getMethod(),
                p.getProvider(), p.getStatus(), p.getProviderTransactionId(), p.getProviderOrderId(), p.getProviderPaymentId(),
                p.getFailureReason(),
                p.getCreatedAt() == null ? null : p.getCreatedAt().toString(),
                p.getProcessedAt() == null ? null : p.getProcessedAt().toString(),
                devMock ? clientSecret : null,
                keyId, rzpOrderId);
    }

    private static String displayNumber(com.ivanta.order.Order o) {
        return o.getOrderNumber() != null ? o.getOrderNumber() : o.getId();
    }

    private List<com.ivanta.inventory.InventoryService.ReserveLine> orderItemsForRetry(String orderId) {
        return orderItemsRepo.findByOrderId(orderId).stream()
                .map(oi -> new com.ivanta.inventory.InventoryService.ReserveLine(
                        oi.getProductId(), oi.getVariantId(), oi.getQuantity(), oi.getProductName()))
                .toList();
    }
}
