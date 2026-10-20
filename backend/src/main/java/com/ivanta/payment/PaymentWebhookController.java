package com.ivanta.payment;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ApiResponse;
import com.ivanta.inventory.InventoryService;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderRepository;
import com.ivanta.order.OrderStateMachine;
import com.ivanta.payment.provider.RazorpayPaymentProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Public Razorpay Webhook Endpoint (§25).
 * Receives async webhook notifications from Razorpay over HTTPS, verifies the signature,
 * and performs idempotent state updates (order confirmation, inventory commit, audit logging).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/payments/webhook")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final ObjectProvider<RazorpayPaymentProvider> razorpayProvider;
    private final PaymentRepository payments;
    private final OrderRepository orders;
    private final OrderStateMachine stateMachine;
    private final InventoryService inventory;
    private final NotificationService notifications;
    private final AuditService audit;

    @PostMapping("/razorpay")
    @Transactional
    public ResponseEntity<ApiResponse<String>> handleRazorpayWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signatureHeader,
            @RequestBody String payload) {

        log.info("[RAZORPAY WEBHOOK] Received event payload");

        RazorpayPaymentProvider provider = razorpayProvider.getIfAvailable();
        if (provider != null && signatureHeader != null) {
            boolean valid = provider.verifyWebhookSignature(payload, signatureHeader);
            if (!valid) {
                log.warn("[RAZORPAY WEBHOOK] Invalid webhook signature header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.ok("Invalid webhook signature"));
            }
        }

        try {
            JSONObject json = new JSONObject(payload);
            String event = json.optString("event", "");
            log.info("[RAZORPAY WEBHOOK] Processing event: {}", event);

            JSONObject payloadEntity = json.optJSONObject("payload");
            if (payloadEntity == null) {
                return ResponseEntity.ok(ApiResponse.ok("No payload entity"));
            }

            JSONObject paymentEntity = null;
            if (payloadEntity.has("payment")) {
                paymentEntity = payloadEntity.getJSONObject("payment").optJSONObject("entity");
            }

            if (paymentEntity == null) {
                return ResponseEntity.ok(ApiResponse.ok("Event ignored"));
            }

            String rzpPaymentId = paymentEntity.optString("id", null);
            String rzpOrderId = paymentEntity.optString("order_id", null);
            JSONObject notes = paymentEntity.optJSONObject("notes");
            String ivantaPaymentId = notes != null ? notes.optString("paymentId", null) : null;

            // Resolve iVanta payment record
            Optional<Payment> paymentOpt = Optional.empty();
            if (ivantaPaymentId != null && !ivantaPaymentId.isBlank()) {
                paymentOpt = payments.findById(ivantaPaymentId);
            }
            if (paymentOpt.isEmpty() && rzpOrderId != null) {
                paymentOpt = payments.findByProviderOrderId(rzpOrderId);
            }
            if (paymentOpt.isEmpty() && rzpOrderId != null) {
                paymentOpt = payments.findByProviderTransactionId(rzpOrderId);
            }
            if (paymentOpt.isEmpty() && rzpPaymentId != null) {
                paymentOpt = payments.findByProviderPaymentId(rzpPaymentId);
            }

            if (paymentOpt.isEmpty()) {
                log.warn("[RAZORPAY WEBHOOK] Payment record not found for rzpOrderId={} ivantaPaymentId={}",
                        rzpOrderId, ivantaPaymentId);
                return ResponseEntity.ok(ApiResponse.ok("Payment record not found"));
            }

            Payment payment = paymentOpt.get();
            Order order = orders.findById(payment.getOrderId()).orElse(null);
            if (order == null) {
                log.warn("[RAZORPAY WEBHOOK] Order not found for payment {}", payment.getId());
                return ResponseEntity.ok(ApiResponse.ok("Order not found"));
            }

            // IDEMPOTENCY GUARD: Check if event was already processed
            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                if ("SUCCESS".equals(payment.getStatus())) {
                    log.info("[RAZORPAY WEBHOOK] Idempotency guard: Payment {} already SUCCESS", payment.getId());
                    return ResponseEntity.ok(ApiResponse.ok("Already processed"));
                }

                payment.setStatus("SUCCESS");
                payment.setProcessedAt(Instant.now());
                if (rzpOrderId != null) {
                    payment.setProviderOrderId(rzpOrderId);
                }
                if (rzpPaymentId != null) {
                    payment.setProviderPaymentId(rzpPaymentId);
                    payment.setProviderTransactionId(rzpPaymentId);
                }
                payments.save(payment);

                inventory.consumeForOrder(order.getId());
                stateMachine.apply(order, "PLACED", "SYSTEM", null, "Payment confirmed via Webhook");
                order.setPaymentStatus("SUCCESS");
                orders.save(order);

                audit.record("PAYMENT_CONFIRMED_WEBHOOK", "payment", payment.getId(), "PENDING", "SUCCESS");
                notifications.notifyUser(order.getUserId(), "PAYMENT_SUCCESS",
                        Map.of("orderNumber", order.getOrderNumber() != null ? order.getOrderNumber() : order.getId(),
                                "amount", payment.getAmount().toPlainString()),
                        "payment", payment.getId());

                log.info("[RAZORPAY WEBHOOK] Successfully confirmed order {} via webhook", order.getId());
            } else if ("payment.failed".equals(event)) {
                if ("FAILED".equals(payment.getStatus()) || "SUCCESS".equals(payment.getStatus())) {
                    log.info("[RAZORPAY WEBHOOK] Idempotency guard: Payment {} state is {}", payment.getId(), payment.getStatus());
                    return ResponseEntity.ok(ApiResponse.ok("Already processed"));
                }

                payment.setStatus("FAILED");
                payment.setFailureReason("Failed via webhook notification");
                payment.setProcessedAt(Instant.now());
                payments.save(payment);

                inventory.releaseForOrder(order.getId(), false);
                if (!"PAYMENT_FAILED".equals(order.getStatus())) {
                    stateMachine.apply(order, "PAYMENT_FAILED", "SYSTEM", null, "Payment failed via Webhook");
                }
                order.setPaymentStatus("FAILED");
                orders.save(order);

                audit.record("PAYMENT_FAILED_WEBHOOK", "payment", payment.getId(), "PENDING", "FAILED");
            }

            return ResponseEntity.ok(ApiResponse.ok("Webhook processed successfully"));
        } catch (Exception e) {
            log.error("[RAZORPAY WEBHOOK] Error processing webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.ok("Webhook error: " + e.getMessage()));
        }
    }
}
