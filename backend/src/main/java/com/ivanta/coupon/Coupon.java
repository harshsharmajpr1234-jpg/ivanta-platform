package com.ivanta.coupon;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupons")
@Getter @Setter
public class Coupon {
    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 40, unique = true)
    private String code;

    @Column(length = 300)
    private String description;

    @Column(name = "discount_type", nullable = false, length = 12)
    private String discountType;                 // PERCENTAGE | FIXED

    @Column(name = "discount_value", nullable = false)
    private BigDecimal discountValue;

    @Column(name = "min_order_value", nullable = false)
    private BigDecimal minOrderValue = BigDecimal.ZERO;

    @Column(name = "max_discount")
    private BigDecimal maxDiscount;

    @Column(name = "applicable_category_id", length = 16)
    private String applicableCategoryId;

    @Column(name = "applicable_product_id", length = 16)
    private String applicableProductId;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "usage_count", nullable = false)
    private Integer usageCount = 0;

    @Column(name = "per_user_limit", nullable = false)
    private Integer perUserLimit = 1;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_by", updatable = false)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
}
