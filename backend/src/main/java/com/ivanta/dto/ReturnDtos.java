package com.ivanta.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;

public final class ReturnDtos {
    private ReturnDtos() { }

    public record ReturnCreateRequest(@NotBlank String orderId, @NotBlank String reason,
                                      String notes, List<String> itemIds) { }

    public record ReturnItemView(String id, String orderItemId, String productName, String variantName,
                                 int quantity, BigDecimal refundAmount) { }

    public record RefundView(String id, String orderId, BigDecimal amount, String status, String method,
                             String provider, String providerTransactionId, String failureReason,
                             String createdAt, String processedAt) { }

    public record ReturnView(String id, String orderId, String status, String reason, String customerNotes,
                             String inspectionNotes, String requestedAt, String resolvedAt,
                             List<ReturnItemView> items, List<RefundView> refunds) { }

    public record ReturnStatusUpdate(@NotBlank String status, String inspectionNotes) { }
}
