package com.ivanta.coupon;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "coupon_usage")
@Getter @Setter
public class CouponUsage {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "coupon_id", nullable = false, length = 16)
    private String couponId;

    @Column(name = "order_id", nullable = false, length = 20, unique = true)
    private String orderId;

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Column(name = "discount_amount", nullable = false)
    private BigDecimal discountAmount;

    @Column(name = "used_at", nullable = false, insertable = false, updatable = false)
    private Instant usedAt;
}
