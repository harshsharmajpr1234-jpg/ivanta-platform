package com.ivanta.coupon;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.CouponDtos.*;
import com.ivanta.security.AdminPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Coupons (§32/§45): ALL validation happens server-side. The client sends only
 * the code — eligibility, minimums, caps and limits are recomputed here.
 */
@Service
@RequiredArgsConstructor
public class CouponService {

    public record EligibleLine(String productId, String categoryId, BigDecimal lineSubtotal) { }

    private final CouponRepository coupons;
    private final CouponUsageRepository usage;
    private final IdService ids;
    private final AuditService audit;

    @Transactional(readOnly = true)
    public ValidationResult validate(String code, String userId, BigDecimal cartSubtotal,
                                     List<EligibleLine> lines) {
        Optional<Coupon> found = coupons.findByCodeIgnoreCase(code == null ? "" : code.trim());
        if (found.isEmpty()) return invalid(code, "Coupon not found");
        Coupon c = found.get();
        Instant now = Instant.now();
        if (!Boolean.TRUE.equals(c.getIsActive())) return invalid(c.getCode(), "This coupon is no longer active");
        if (now.isBefore(c.getStartsAt())) return invalid(c.getCode(), "This coupon is not active yet");
        if (now.isAfter(c.getExpiresAt())) return invalid(c.getCode(), "This coupon has expired");
        if (c.getUsageLimit() != null && c.getUsageCount() >= c.getUsageLimit())
            return invalid(c.getCode(), "This coupon has reached its usage limit");
        if (userId != null && usage.countByCouponIdAndUserId(c.getId(), userId) >= c.getPerUserLimit())
            return invalid(c.getCode(), "You have already used this coupon");

        BigDecimal eligible = cartSubtotal;
        if (c.getApplicableProductId() != null) {
            eligible = lines.stream().filter(l -> c.getApplicableProductId().equals(l.productId()))
                    .map(EligibleLine::lineSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        } else if (c.getApplicableCategoryId() != null) {
            eligible = lines.stream().filter(l -> c.getApplicableCategoryId().equals(l.categoryId()))
                    .map(EligibleLine::lineSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        if (eligible.compareTo(BigDecimal.ZERO) <= 0)
            return invalid(c.getCode(), "Your cart has no products eligible for this coupon");
        if (cartSubtotal.compareTo(c.getMinOrderValue()) < 0)
            return invalid(c.getCode(), "Minimum order value ₹" + c.getMinOrderValue().stripTrailingZeros().toPlainString() + " not met");

        BigDecimal discount = "PERCENTAGE".equals(c.getDiscountType())
                ? eligible.multiply(c.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                : c.getDiscountValue();
        if (c.getMaxDiscount() != null && discount.compareTo(c.getMaxDiscount()) > 0) discount = c.getMaxDiscount();
        if (discount.compareTo(eligible) > 0) discount = eligible;
        discount = discount.setScale(2, RoundingMode.HALF_UP);
        return new ValidationResult(true, c.getCode(), c.getDescription(), discount, null);
    }

    private ValidationResult invalid(String code, String reason) {
        return new ValidationResult(false, code, null, BigDecimal.ZERO, reason);
    }

    /** Called inside order creation (transactional) — records usage and increments counter. */
    @Transactional
    public void recordUsage(String code, String orderId, String userId, BigDecimal discount) {
        coupons.findByCodeIgnoreCase(code).ifPresent(c -> {
            c.setUsageCount(c.getUsageCount() + 1);
            coupons.save(c);
            CouponUsage u = new CouponUsage();
            u.setId(ids.next("coupon_usage", "CPX", 5));
            u.setCouponId(c.getId());
            u.setOrderId(orderId);
            u.setUserId(userId);
            u.setDiscountAmount(discount);
            usage.save(u);
        });
    }

    /* ---------- admin (§34) ---------- */

    @Transactional(readOnly = true)
    public List<CouponView> list() {
        return coupons.findAllByOrderByCreatedAtDesc().stream().map(CouponService::toView).toList();
    }

    @Transactional
    public CouponView create(CouponUpsert req) {
        String code = req.code().trim().toUpperCase();
        if (coupons.findByCodeIgnoreCase(code).isPresent())
            throw new BusinessException(ErrorCode.CONFLICT, "Coupon code already exists");
        if (!"PERCENTAGE".equals(req.discountType()) && !"FIXED".equals(req.discountType()))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "discountType must be PERCENTAGE or FIXED");
        if (!req.expiresAt().isAfter(req.startsAt()))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "expiresAt must be after startsAt");
        Coupon c = new Coupon();
        c.setId(ids.next("coupons", "CPN", 4));
        apply(c, req);
        c.setCode(code);
        c.setCreatedBy(currentAdminId());
        coupons.save(c);
        audit.record("COUPON_CREATED", "coupon", c.getId(), null, code);
        return toView(c);
    }

    @Transactional
    public CouponView update(String id, CouponUpsert req) {
        Coupon c = coupons.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Coupon not found"));
        String before = "value=" + c.getDiscountValue() + " active=" + c.getIsActive();
        apply(c, req);
        coupons.save(c);
        audit.record("COUPON_UPDATED", "coupon", id, before,
                "value=" + c.getDiscountValue() + " active=" + c.getIsActive());
        return toView(c);
    }

    @Transactional(readOnly = true)
    public List<UsageView> usages(String couponId) {
        return usage.findByCouponIdOrderByUsedAtDesc(couponId).stream()
                .map(u -> new UsageView(u.getOrderId(), u.getUserId(), u.getDiscountAmount(),
                        u.getUsedAt().toString())).toList();
    }

    private void apply(Coupon c, CouponUpsert req) {
        if (req.description() != null) c.setDescription(req.description());
        if (req.discountType() != null) c.setDiscountType(req.discountType());
        if (req.discountValue() != null) c.setDiscountValue(req.discountValue());
        if (req.minOrderValue() != null) c.setMinOrderValue(req.minOrderValue());
        c.setMaxDiscount(req.maxDiscount());
        c.setApplicableCategoryId(req.applicableCategoryId());
        c.setApplicableProductId(req.applicableProductId());
        if (req.startsAt() != null) c.setStartsAt(req.startsAt());
        if (req.expiresAt() != null) c.setExpiresAt(req.expiresAt());
        if (req.usageLimit() != null) c.setUsageLimit(req.usageLimit());
        if (req.perUserLimit() != null) c.setPerUserLimit(req.perUserLimit());
        if (req.isActive() != null) c.setIsActive(req.isActive());
    }

    public static CouponView toView(Coupon c) {
        return new CouponView(c.getId(), c.getCode(), c.getDescription(), c.getDiscountType(),
                c.getDiscountValue(), c.getMinOrderValue(), c.getMaxDiscount(),
                c.getApplicableCategoryId(), c.getApplicableProductId(),
                c.getStartsAt().toString(), c.getExpiresAt().toString(), c.getUsageLimit(),
                c.getUsageCount(), c.getPerUserLimit(), Boolean.TRUE.equals(c.getIsActive()));
    }

    private String currentAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object p = auth == null ? null : auth.getPrincipal();
        return p instanceof AdminPrincipal a ? a.adminId() : null;
    }
}
