package com.ivanta.payment.provider;

import com.ivanta.config.IvantaProperties;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Refund;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Production Razorpay payment provider (§25).
 * Encapsulates Razorpay Order creation, HMAC-SHA256 signature verification,
 * Webhook validation, and Refund processing.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ivanta.payment.provider", havingValue = "razorpay")
public class RazorpayPaymentProvider implements PaymentProvider {

    private final IvantaProperties props;

    @Override
    public String name() {
        return "razorpay";
    }

    @Override
    public InitResult initiate(String paymentId, BigDecimal amount, String method) {
        String keyId = props.getPayment().getRazorpay().getKeyId();
        String keySecret = props.getPayment().getRazorpay().getKeySecret();

        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            log.error("[RAZORPAY] Razorpay credentials missing (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
            throw new IllegalStateException("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) not configured");
        }

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            long amountInPaise = amount.setScale(2, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).longValue();

            JSONObject orderReq = new JSONObject();
            orderReq.put("amount", amountInPaise);
            orderReq.put("currency", "INR");
            orderReq.put("receipt", paymentId);
            orderReq.put("payment_capture", 1);

            JSONObject notes = new JSONObject();
            notes.put("paymentId", paymentId);
            orderReq.put("notes", notes);

            Order rzpOrder = client.orders.create(orderReq);
            String orderId = rzpOrder.get("id");
            log.info("[RAZORPAY] Created order {} for paymentId={} amount={}", orderId, paymentId, amount);

            return new InitResult(orderId, orderId, orderId, null, keyId, rzpOrder.toString());
        } catch (Exception e) {
            log.error("[RAZORPAY] Failed to create order for paymentId={}: {}", paymentId, e.getMessage(), e);
            throw new RuntimeException("Could not initiate Razorpay payment: " + e.getMessage(), e);
        }
    }

    @Override
    public VerifyResult verify(String paymentId, BigDecimal amount, String reference) {
        String keySecret = props.getPayment().getRazorpay().getKeySecret();
        if (reference == null || reference.isBlank()) {
            return new VerifyResult(false, null, null, "Missing verification payload", null);
        }

        try {
            String razorpayPaymentId = null;
            String razorpayOrderId = null;
            String razorpaySignature = null;

            if (reference.trim().startsWith("{")) {
                JSONObject json = new JSONObject(reference);
                razorpayPaymentId = json.optString("razorpay_payment_id", null);
                razorpayOrderId = json.optString("razorpay_order_id", null);
                razorpaySignature = json.optString("razorpay_signature", null);
            }

            if (razorpayPaymentId == null || razorpayOrderId == null || razorpaySignature == null) {
                log.warn("[RAZORPAY] Incomplete payment verification response for paymentId={}", paymentId);
                return new VerifyResult(false, null, null, "Incomplete Razorpay response parameters", reference);
            }

            // Verify signature using HMAC-SHA256: razorpay_order_id + "|" + razorpay_payment_id
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            boolean isValid = verifyHmacSha256(payload, razorpaySignature, keySecret);

            if (isValid) {
                log.info("[RAZORPAY] Signature verified successfully for paymentId={} rzpPaymentId={}",
                        paymentId, razorpayPaymentId);
                return new VerifyResult(true, razorpayOrderId, razorpayPaymentId, null, reference);
            } else {
                log.warn("[RAZORPAY] Signature mismatch for paymentId={} rzpPaymentId={}", paymentId, razorpayPaymentId);
                return new VerifyResult(false, razorpayOrderId, razorpayPaymentId, "Razorpay signature verification failed", reference);
            }
        } catch (Exception e) {
            log.error("[RAZORPAY] Verification exception for paymentId={}: {}", paymentId, e.getMessage(), e);
            return new VerifyResult(false, null, null, "Verification error: " + e.getMessage(), null);
        }
    }

    @Override
    public RefundResult refund(String providerPaymentId, BigDecimal amount, String reason) {
        String keyId = props.getPayment().getRazorpay().getKeyId();
        String keySecret = props.getPayment().getRazorpay().getKeySecret();

        if (keyId.isBlank() || keySecret.isBlank()) {
            log.warn("[RAZORPAY] Missing credentials during refund request for providerPaymentId={}", providerPaymentId);
            return new RefundResult(false, null, "Razorpay credentials not configured", null);
        }

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            long amountInPaise = amount.setScale(2, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).longValue();

            JSONObject refundReq = new JSONObject();
            refundReq.put("amount", amountInPaise);
            if (reason != null && !reason.isBlank()) {
                JSONObject notes = new JSONObject();
                notes.put("reason", reason);
                refundReq.put("notes", notes);
            }

            Refund refund = client.payments.refund(providerPaymentId, refundReq);
            String refundId = refund.get("id");
            log.info("[RAZORPAY] Refund initiated for providerPaymentId={} refundId={} amount={}", providerPaymentId, refundId, amount);
            return new RefundResult(true, refundId, null, refund.toString());
        } catch (Exception e) {
            log.error("[RAZORPAY] Refund failed for providerPaymentId={}: {}", providerPaymentId, e.getMessage(), e);
            return new RefundResult(false, null, "Razorpay refund error: " + e.getMessage(), null);
        }
    }

    @Override
    public boolean supportsCod() {
        return false;
    }

    public boolean verifyWebhookSignature(String requestBody, String signatureHeader) {
        String webhookSecret = props.getPayment().getRazorpay().getWebhookSecret();
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("[RAZORPAY] Webhook secret not configured — rejecting webhook signature validation");
            return false;
        }
        try {
            return Utils.verifyWebhookSignature(requestBody, signatureHeader, webhookSecret);
        } catch (Exception e) {
            log.error("[RAZORPAY] Webhook signature validation error: {}", e.getMessage());
            return false;
        }
    }

    private boolean verifyHmacSha256(String data, String expectedHex, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String computedHex = HexFormat.of().formatHex(hash);
            return MessageDigest.isEqual(computedHex.getBytes(StandardCharsets.UTF_8),
                    expectedHex.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("HMAC calculation error: {}", e.getMessage());
            return false;
        }
    }
}
