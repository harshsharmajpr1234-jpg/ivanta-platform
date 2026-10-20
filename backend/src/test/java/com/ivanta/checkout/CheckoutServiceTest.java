package com.ivanta.checkout;

import com.ivanta.cart.CartItem;
import com.ivanta.cart.CartService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.config.IvantaProperties;
import com.ivanta.coupon.CouponService;
import com.ivanta.delivery.ShippingMethod;
import com.ivanta.delivery.ShippingMethodRepository;
import com.ivanta.dto.CouponDtos.ValidationResult;
import com.ivanta.location.LocationSearchService;
import com.ivanta.location.dto.LocationDtos.ServiceabilityResponse;
import com.ivanta.product.*;
import com.ivanta.user.Address;
import com.ivanta.user.AddressService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: customer cannot change order price — totals come from the database. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CheckoutServiceTest {

    @Mock CartService carts;
    @Mock ProductRepository products;
    @Mock ProductVariantRepository variants;
    @Mock ProductImageRepository images;
    @Mock AddressService addresses;
    @Mock LocationSearchService location;
    @Mock ShippingMethodRepository shippingMethods;
    @Mock CouponService coupons;

    IvantaProperties props = new IvantaProperties();
    CheckoutService service;

    @BeforeEach
    void setUp() {
        service = new CheckoutService(carts, products, variants, images, addresses,
                location, shippingMethods, coupons, props);

        CartItem ci = new CartItem();
        ci.setId("CIT-1");
        ci.setProductId("P1");
        ci.setVariantId(null);
        ci.setQuantity(2);
        ci.setUnitPrice(new BigDecimal("1"));       // stale client-era snapshot — must be ignored
        when(carts.rawItems("U1")).thenReturn(List.of(ci));

        Product p = new Product();
        p.setId("P1");
        p.setName("iPhone 17");
        p.setSku("IVN-IP17");
        p.setCategoryId("C1");
        p.setPrice(new BigDecimal("50000"));        // DB price is the truth
        p.setMrp(new BigDecimal("55000"));
        p.setTaxRate(BigDecimal.ZERO);
        p.setIsActive(true);
        when(products.findByIdAndDeletedAtIsNull("P1")).thenReturn(Optional.of(p));
        when(images.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(any())).thenReturn(List.of());

        Address a = new Address();
        a.setId("A1");
        a.setUserId("U1");
        a.setPincode("302021");
        a.setCity("Jaipur");
        a.setState("Rajasthan");
        a.setName("Test");
        a.setPhone("9876543210");
        a.setAddressLine1("Line 1");
        when(addresses.getOwned("A1", "U1")).thenReturn(a);

        when(location.isPinServiceable("302021")).thenReturn(new ServiceabilityResponse(
                true, "Jaipur Metro", BigDecimal.ZERO, 1, 2, null, "ok", List.of()));

        ShippingMethod sm = new ShippingMethod();
        sm.setId("SM-0001");
        sm.setName("Standard");
        sm.setBaseFee(new BigDecimal("49"));
        sm.setFreeAbove(new BigDecimal("999"));
        sm.setEtaMinDays((short) 3);
        sm.setEtaMaxDays((short) 5);
        sm.setIsActive(true);
        when(shippingMethods.findById("SM-0001")).thenReturn(Optional.of(sm));
    }

    @Test
    void computesTotalsFromDatabasePrices() {
        when(coupons.validate(eq("IVANTA10"), eq("U1"), any(), anyList()))
                .thenReturn(new ValidationResult(true, "IVANTA10", "10% off", new BigDecimal("5000.00"), null));

        CheckoutService.Context ctx = service.buildContext("U1", "A1", "SM-0001", "IVANTA10", "UPI", true);

        assertThat(ctx.subtotal()).isEqualByComparingTo("100000.00");     // 2 × 50000 (DB price)
        assertThat(ctx.couponDiscount()).isEqualByComparingTo("5000.00");
        assertThat(ctx.shippingFee()).isEqualByComparingTo("0.00");       // free above 999 + zone fee 0
        assertThat(ctx.grandTotal()).isEqualByComparingTo("95000.00");
    }

    @Test
    void addsShippingFeeBelowFreeThreshold() {
        // single unit of a 500-rupee product would breach min order too, so drop coupon & use qty 2 of 50000 → free.
        // instead: expensive shipping method with no free_above
        ShippingMethod express = new ShippingMethod();
        express.setId("SM-0002");
        express.setName("Express");
        express.setBaseFee(new BigDecimal("199"));
        express.setEtaMinDays((short) 1);
        express.setEtaMaxDays((short) 2);
        express.setIsActive(true);
        when(shippingMethods.findById("SM-0002")).thenReturn(Optional.of(express));

        CheckoutService.Context ctx = service.buildContext("U1", "A1", "SM-0002", null, "UPI", true);
        assertThat(ctx.shippingFee()).isEqualByComparingTo("199.00");
        assertThat(ctx.grandTotal()).isEqualByComparingTo("100199.00");
    }

    @Test
    void rejectsNonServiceablePinAtPlacement() {
        when(location.isPinServiceable("302021")).thenReturn(new ServiceabilityResponse(
                false, null, null, null, null, null, "not serviceable", List.of()));
        assertThatThrownBy(() -> service.buildContext("U1", "A1", "SM-0001", null, "UPI", true))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.NOT_SERVICEABLE);
    }

    @Test
    void rejectsEmptyCart() {
        when(carts.rawItems("U1")).thenReturn(List.of());
        assertThatThrownBy(() -> service.buildContext("U1", "A1", "SM-0001", null, "UPI", true))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("empty");
    }

    @Test
    void rejectsInvalidCouponAtPlacement() {
        when(coupons.validate(eq("BAD"), eq("U1"), any(), anyList()))
                .thenReturn(new ValidationResult(false, "BAD", null, BigDecimal.ZERO, "expired"));
        assertThatThrownBy(() -> service.buildContext("U1", "A1", "SM-0001", "BAD", "UPI", true))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.INVALID_COUPON);
    }

    @Test
    void rejectsCodWhenDisabled() {
        props.getCheckout().setCodEnabled(false);
        assertThatThrownBy(() -> service.buildContext("U1", "A1", "SM-0001", null, "COD", true))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cash on Delivery");
    }
}
