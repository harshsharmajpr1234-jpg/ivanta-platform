package com.ivanta.payment.provider;

import java.math.BigDecimal;

/**
 * Payment gateway abstraction (§25/§55): Razorpay, Stripe, UPI collect etc.
 * implement this interface. Business logic NEVER trusts client-side payment
 * results — success requires provider.verify() to pass server-side.
 */
public interface PaymentProvider {

    record InitResult(String providerTransactionId, String providerOrderId, String reference, String clientSecret, String keyId, String raw) { }

    record VerifyResult(boolean success, String providerOrderId, String providerPaymentId, String reason, String raw) { }

    record RefundResult(boolean success, String providerRefundId, String reason, String raw) { }

    String name();

    /** Creates a payment intent; reference is the server-issued verification token. */
    InitResult initiate(String paymentId, BigDecimal amount, String method);

    /** Server-side verification (mirrors Razorpay signature verification). */
    VerifyResult verify(String paymentId, BigDecimal amount, String reference);

    RefundResult refund(String providerPaymentId, BigDecimal amount, String reason);

    boolean supportsCod();
}

