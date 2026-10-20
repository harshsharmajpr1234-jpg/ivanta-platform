package com.ivanta.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public final class PaymentDtos {
    private PaymentDtos() { }

    public record InitiateRequest(@NotBlank String orderId,
                                  @NotBlank String method) { }

    public record VerifyRequest(@NotBlank String reference) { }

    public record PaymentView(String id, String orderId, BigDecimal amount, String currency,
                              String method, String provider, String status,
                              String providerTransactionId, String providerOrderId, String providerPaymentId,
                              String failureReason, String createdAt, String processedAt, String clientSecret,
                              String keyId, String razorpayOrderId) { }

    public record AdminPaymentRow(String id, String orderId, String userId, String customerName,
                                  BigDecimal amount, String currency, String method, String status,
                                  String providerOrderId, String providerPaymentId, String failureReason,
                                  String createdAt) { }

    public record TransactionView(String id, String provider, String providerTransactionId, String txnType,
                                  BigDecimal amount, String status, String createdAt) { }
}
