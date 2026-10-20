package com.ivanta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class CouponDtos {
    private CouponDtos() { }

    public record ValidateRequest(@NotBlank String code) { }

    public record ValidationResult(boolean valid, String code, String description,
                                   BigDecimal discount, String reason) { }

    public record CouponView(String id, String code, String description, String discountType,
                             BigDecimal discountValue, BigDecimal minOrderValue, BigDecimal maxDiscount,
                             String applicableCategoryId, String applicableProductId,
                             String startsAt, String expiresAt, Integer usageLimit, int usageCount,
                             int perUserLimit, boolean isActive) { }

    public record CouponUpsert(@NotBlank String code, String description,
                               @NotBlank String discountType,
                               @NotNull BigDecimal discountValue,
                               BigDecimal minOrderValue, BigDecimal maxDiscount,
                               String applicableCategoryId, String applicableProductId,
                               @NotNull Instant startsAt, @NotNull Instant expiresAt,
                               Integer usageLimit, Integer perUserLimit, Boolean isActive) { }

    public record UsageView(String orderId, String userId, BigDecimal discountAmount, String usedAt) { }
}
