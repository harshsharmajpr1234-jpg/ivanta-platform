package com.ivanta.coupon;

import com.ivanta.audit.AuditService;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.CouponDtos.ValidationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: coupon manipulation must be impossible — all checks server-side. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CouponServiceTest {

    @Mock CouponRepository coupons;
    @Mock CouponUsageRepository usage;
    @Mock IdService ids;
    @Mock AuditService audit;

    CouponService service;

    @BeforeEach
    void setUp() {
        service = new CouponService(coupons, usage, ids, audit);
        when(ids.next(anyString(), anyString(), anyInt())).thenReturn("X-1");
    }

    private Coupon coupon(String type, String value, String minOrder, String maxDiscount,
                          Instant start, Instant end, Integer usageLimit, int usageCount, int perUser) {
        Coupon c = new Coupon();
        c.setId("CPN-1");
        c.setCode("TEST10");
        c.setDiscountType(type);
        c.setDiscountValue(new BigDecimal(value));
        c.setMinOrderValue(new BigDecimal(minOrder));
        c.setMaxDiscount(maxDiscount == null ? null : new BigDecimal(maxDiscount));
        c.setStartsAt(start);
        c.setExpiresAt(end);
        c.setUsageLimit(usageLimit);
        c.setUsageCount(usageCount);
        c.setPerUserLimit(perUser);
        c.setIsActive(true);
        return c;
    }

    private List<CouponService.EligibleLine> lines(String total) {
        return List.of(new CouponService.EligibleLine("P1", "C1", new BigDecimal(total)));
    }

    @Test
    void rejectsUnknownCode() {
        when(coupons.findByCodeIgnoreCase("NOPE")).thenReturn(Optional.empty());
        ValidationResult r = service.validate("NOPE", "U1", BigDecimal.TEN, lines("10"));
        assertThat(r.valid()).isFalse();
        assertThat(r.reason()).contains("not found");
    }

    @Test
    void rejectsExpiredCoupon() {
        when(coupons.findByCodeIgnoreCase("TEST10")).thenReturn(Optional.of(
                coupon("PERCENTAGE", "10", "0", null,
                        Instant.now().minus(30, ChronoUnit.DAYS), Instant.now().minus(1, ChronoUnit.DAYS),
                        null, 0, 1)));
        ValidationResult r = service.validate("TEST10", "U1", new BigDecimal("1000"), lines("1000"));
        assertThat(r.valid()).isFalse();
        assertThat(r.reason()).contains("expired");
    }

    @Test
    void rejectsBelowMinOrderValue() {
        when(coupons.findByCodeIgnoreCase("TEST10")).thenReturn(Optional.of(
                coupon("FIXED", "500", "5000", null,
                        Instant.now().minus(1, ChronoUnit.DAYS), Instant.now().plus(30, ChronoUnit.DAYS),
                        null, 0, 1)));
        ValidationResult r = service.validate("TEST10", "U1", new BigDecimal("4999"), lines("4999"));
        assertThat(r.valid()).isFalse();
        assertThat(r.reason()).contains("Minimum order");
    }

    @Test
    void rejectsWhenUsageLimitReached() {
        when(coupons.findByCodeIgnoreCase("TEST10")).thenReturn(Optional.of(
                coupon("FIXED", "500", "0", null,
                        Instant.now().minus(1, ChronoUnit.DAYS), Instant.now().plus(30, ChronoUnit.DAYS),
                        100, 100, 5)));
        ValidationResult r = service.validate("TEST10", "U1", new BigDecimal("1000"), lines("1000"));
        assertThat(r.valid()).isFalse();
        assertThat(r.reason()).contains("usage limit");
    }

    @Test
    void rejectsWhenPerUserLimitReached() {
        when(coupons.findByCodeIgnoreCase("TEST10")).thenReturn(Optional.of(
                coupon("FIXED", "500", "0", null,
                        Instant.now().minus(1, ChronoUnit.DAYS), Instant.now().plus(30, ChronoUnit.DAYS),
                        null, 3, 1)));
        when(usage.countByCouponIdAndUserId("CPN-1", "U1")).thenReturn(1L);
        ValidationResult r = service.validate("TEST10", "U1", new BigDecimal("1000"), lines("1000"));
        assertThat(r.valid()).isFalse();
        assertThat(r.reason()).contains("already used");
    }

    @Test
    void appliesPercentageWithCap() {
        when(coupons.findByCodeIgnoreCase("TEST10")).thenReturn(Optional.of(
                coupon("PERCENTAGE", "10", "1000", "500",
                        Instant.now().minus(1, ChronoUnit.DAYS), Instant.now().plus(30, ChronoUnit.DAYS),
                        null, 0, 3)));
        ValidationResult r = service.validate("TEST10", "U1", new BigDecimal("100000"), lines("100000"));
        assertThat(r.valid()).isTrue();
        assertThat(r.discount()).isEqualByComparingTo("500");   // 10% would be 10000, cap is 500
    }

    @Test
    void appliesFixedDiscount() {
        when(coupons.findByCodeIgnoreCase("TEST10")).thenReturn(Optional.of(
                coupon("FIXED", "500", "5000", null,
                        Instant.now().minus(1, ChronoUnit.DAYS), Instant.now().plus(30, ChronoUnit.DAYS),
                        null, 0, 1)));
        ValidationResult r = service.validate("TEST10", "U1", new BigDecimal("9000"), lines("9000"));
        assertThat(r.valid()).isTrue();
        assertThat(r.discount()).isEqualByComparingTo("500");
    }

    @Test
    void recordUsageIncrementsCounterAndPersists() {
        Coupon c = coupon("FIXED", "500", "0", null, Instant.now(), Instant.now().plus(1, ChronoUnit.DAYS), null, 2, 1);
        when(coupons.findByCodeIgnoreCase("TEST10")).thenReturn(Optional.of(c));
        service.recordUsage("TEST10", "ORD-1", "U1", new BigDecimal("500"));
        assertThat(c.getUsageCount()).isEqualTo(3);
        verify(coupons).save(c);
        verify(usage).save(any(CouponUsage.class));
    }
}
