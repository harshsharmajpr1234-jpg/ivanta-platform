package com.ivanta.returnrefund;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderRepository;
import com.ivanta.payment.Payment;
import com.ivanta.payment.PaymentRepository;
import com.ivanta.payment.PaymentStatusHistory;
import com.ivanta.payment.PaymentStatusHistoryRepository;
import com.ivanta.payment.provider.PaymentProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;

/**
 * Refunds (§31): a refund is only SUCCESS after the provider confirms it —
 * the mock provider confirms immediately, a real gateway would webhook/poll.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefundService {

    private final OrderRepository orders;
    private final RefundRepository refunds;
    private final RefundTransactionRepository transactions;
    private final PaymentRepository payments;
    private final PaymentStatusHistoryRepository paymentHistory;
    private final PaymentProvider provider;
    private final NotificationService notifications;
    private final IdService ids;
    private final AuditService audit;

    @Transactional
    public Refund refundOrder(Order order, BigDecimal amount, String reason, String returnId) {
        Payment payment = payments.findFirstByOrderIdOrderByIdDesc(order.getId())
                .filter(p -> "SUCCESS".equals(p.getStatus()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_STATE,
                        "No successful payment to refund for order " + order.getId()));
        if (amount.compareTo(payment.getAmount()) > 0)
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Refund exceeds captured amount");

        Refund r = new Refund();
        r.setId(ids.next("refunds", "REF", 5));
        r.setReturnId(returnId);
        r.setOrderId(order.getId());
        r.setPaymentId(payment.getId());
        r.setAmount(amount);
        r.setMethod(payment.getMethod());
        r.setProvider(provider.name());
        r.setStatus("PROCESSING");
        refunds.save(r);

        PaymentProvider.RefundResult result;
        try {
            String targetPaymentId = payment.getProviderPaymentId() != null ? payment.getProviderPaymentId()
                    : (payment.getProviderTransactionId() != null ? payment.getProviderTransactionId() : payment.getId());
            result = provider.refund(targetPaymentId, amount, reason);
        } catch (Exception e) {
            log.error("Refund provider error for {}", r.getId(), e);
            result = new PaymentProvider.RefundResult(false, null, e.getMessage(), null);
        }

        RefundTransaction t = new RefundTransaction();
        t.setId(ids.next("refund_transactions", "RFT", 6));
        t.setRefundId(r.getId());
        t.setProvider(provider.name());
        t.setProviderTransactionId(result.providerRefundId());
        t.setAmount(amount);
        t.setStatus(result.success() ? "SUCCESS" : "FAILED");
        t.setRawResponse(result.raw());
        transactions.save(t);

        if (result.success()) {
            r.setStatus("SUCCESS");
            r.setProcessedAt(Instant.now());
            r.setProviderRefundId(result.providerRefundId());
            r.setProviderTransactionId(result.providerRefundId());
            updatePaymentRefunded(payment, amount);
            audit.record("REFUND_PROCESSED", "refund", r.getId(), null,
                    "order=" + order.getId() + " amount=" + amount);
        } else {
            r.setStatus("FAILED");
            r.setFailureReason(result.reason());
            audit.record("REFUND_FAILED", "refund", r.getId(), null, String.valueOf(result.reason()));
        }
        refunds.save(r);

        notifications.notifyUser(order.getUserId(), "REFUND_UPDATE",
                Map.of("refundNumber", r.getId(), "amount", amount.toPlainString(),
                        "status", r.getStatus().equals("SUCCESS") ? "processed successfully" : "failed"),
                "refund", r.getId());
        return r;
    }

    private void updatePaymentRefunded(Payment payment, BigDecimal amount) {
        String prev = payment.getStatus();
        boolean full = amount.compareTo(payment.getAmount()) >= 0;
        payment.setStatus(full ? "REFUNDED" : "PARTIALLY_REFUNDED");
        payments.save(payment);
        // denormalised mirror on the order (§16)
        orders.findById(payment.getOrderId()).ifPresent(o -> {
            o.setPaymentStatus(payment.getStatus());
            orders.save(o);
        });
        PaymentStatusHistory h = new PaymentStatusHistory();
        h.setPaymentId(payment.getId());
        h.setPreviousStatus(prev);
        h.setNewStatus(payment.getStatus());
        h.setReason("Refund " + amount.toPlainString());
        paymentHistory.save(h);
    }
}
