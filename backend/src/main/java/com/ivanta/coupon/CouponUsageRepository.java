package com.ivanta.coupon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CouponUsageRepository extends JpaRepository<CouponUsage, String> {
    long countByCouponIdAndUserId(String couponId, String userId);
    List<CouponUsage> findByCouponIdOrderByUsedAtDesc(String couponId);
}
