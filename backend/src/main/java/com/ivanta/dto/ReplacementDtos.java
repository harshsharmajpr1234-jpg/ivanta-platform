package com.ivanta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Replacement workflow DTOs (§21). */
public final class ReplacementDtos {
    private ReplacementDtos() { }

    public record ReplacementCreateRequest(@NotBlank String orderId,
                                           @NotBlank String orderItemId,
                                           @NotBlank @Size(max = 300) String reason) { }

    public record ReplacementStatusUpdate(@NotBlank String status,
                                          @Size(max = 300) String reason) { }

    public record ReplacementView(String id, String orderId, String orderNumber, String orderItemId,
                                  String productName, String variantName, String sku, String imageKey,
                                  int quantity, BigDecimal refundValue, String status, String reason,
                                  String replacementOrderId, String replacementOrderNumber,
                                  String requestedAt, String resolvedAt) { }
}
