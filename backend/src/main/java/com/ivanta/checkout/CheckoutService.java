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
import com.ivanta.location.dto.LocationDtos.ServiceabilityResponse;
import com.ivanta.dto.OrderDtos.*;
import com.ivanta.dto.UserDtos.AddressView;
import com.ivanta.location.LocationSearchService;
import com.ivanta.product.*;
import com.ivanta.user.Address;
import com.ivanta.user.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

/**
 * Checkout pricing (§22/§45): subtotal, coupon discount, tax, shipping and
 * grand total are computed HERE, from database prices — never from the client.
 * The same context builder powers both the preview and order placement, so a
 * client cannot see one price and pay another.
 */
@Service
@RequiredArgsConstructor
public class CheckoutService {

    public record Line(String productId, String variantId, String productName, String variantName,
                       String sku, String imageKey, String categoryId, int quantity,
                       BigDecimal unitPrice, BigDecimal taxRate, BigDecimal lineTotal, BigDecimal taxAmount) { }

    public record Context(List<Line> lines, Address address, ShippingMethod method,
                          ServiceabilityResponse serviceability,
                          BigDecimal subtotal, BigDecimal taxTotal, BigDecimal zoneFee,
                          BigDecimal shippingFee, String couponCode, BigDecimal couponDiscount,
                          BigDecimal grandTotal, String paymentMethod, ValidationResult couponResult) { }

    private final CartService carts;
    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final ProductImageRepository images;
    private final AddressService addresses;
    private final LocationSearchService location;
    private final ShippingMethodRepository shippingMethods;
    private final CouponService coupons;
    private final IvantaProperties props;

    @Transactional(readOnly = true)
    public CheckoutPreview preview(String userId, String addressId, String shippingMethodId, String couponCode,
                                   String paymentMethod) {
        Context ctx = buildContext(userId, addressId, shippingMethodId, couponCode, paymentMethod, false);
        List<OrderItemPreview> items = ctx.lines().stream()
                .map(l -> new OrderItemPreview(l.productId(), l.productName(), l.variantName(),
                        l.imageKey(), l.quantity(), l.unitPrice(), l.lineTotal()))
                .toList();
        List<String> methods = new ArrayList<>(List.of("UPI", "CARD", "NETBANKING", "WALLET"));
        if (props.getCheckout().isCodEnabled()) methods.add("COD");
        return new CheckoutPreview(items,
                ctx.lines().stream().mapToInt(Line::quantity).sum(),
                ctx.subtotal(), ctx.couponDiscount(), ctx.couponCode(), ctx.taxTotal(),
                ctx.shippingFee(), ctx.grandTotal(),
                ctx.serviceability() == null || ctx.serviceability().serviceable(),
                ctx.serviceability() == null ? null : ctx.serviceability().message(),
                ctx.address() == null ? null : AddressService.toView(ctx.address()),
                ctx.serviceability() == null ? List.of() : ctx.serviceability().shippingMethods(),
                methods, ctx.couponResult());
    }

    /**
     * Single source of truth for order pricing. strict=true throws on any
     * blocking problem (used at order placement); strict=false collects state
     * for the preview UI.
     */
    @Transactional(readOnly = true)
    public Context buildContext(String userId, String addressId, String shippingMethodId,
                                String couponCode, String paymentMethod, boolean strict) {
        List<CartItem> cartItems = carts.rawItems(userId);
        if (cartItems.isEmpty())
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Your cart is empty");

        // --- lines with LIVE database prices ---
        List<Line> lines = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;
        for (CartItem ci : cartItems) {
            Product p = products.findByIdAndDeletedAtIsNull(ci.getProductId())
                    .filter(x -> Boolean.TRUE.equals(x.getIsActive()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.OUT_OF_STOCK,
                            "A product in your cart is no longer available"));
            ProductVariant v = ci.getVariantId() == null ? null
                    : variants.findById(ci.getVariantId())
                        .filter(x -> x.getProductId().equals(p.getId()) && Boolean.TRUE.equals(x.getIsActive()))
                        .orElseThrow(() -> new BusinessException(ErrorCode.OUT_OF_STOCK,
                                "A variant in your cart is no longer available"));
            BigDecimal unit = v != null ? v.getPrice() : p.getPrice();
            BigDecimal taxRate = p.getTaxRate() == null ? BigDecimal.ZERO : p.getTaxRate();
            BigDecimal lineTotal = unit.multiply(BigDecimal.valueOf(ci.getQuantity()));
            BigDecimal lineTax = lineTotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
            String img = images.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(p.getId()).stream()
                    .findFirst().map(ProductImage::getStorageKey).orElse(null);
            lines.add(new Line(p.getId(), v == null ? null : v.getId(), p.getName(),
                    v == null ? null : v.getName(), v == null ? p.getSku() : v.getSku(), img,
                    p.getCategoryId(), ci.getQuantity(), unit, taxRate, lineTotal, lineTax));
            subtotal = subtotal.add(lineTotal);
            taxTotal = taxTotal.add(lineTax);
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        if (subtotal.compareTo(BigDecimal.valueOf(props.getCheckout().getMinOrderValue())) < 0 && strict)
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "Minimum order value is ₹" + props.getCheckout().getMinOrderValue());

        // --- address (ownership enforced) ---
        Address address = null;
        ServiceabilityResponse svc = null;
        if (addressId != null && !addressId.isBlank()) {
            address = addresses.getOwned(addressId, userId);
            svc = location.isPinServiceable(address.getPincode());
            if (!svc.serviceable() && strict)
                throw new BusinessException(ErrorCode.NOT_SERVICEABLE, svc.message());
        } else if (strict) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Delivery address is required");
        }

        // --- shipping method + zone fee ---
        ShippingMethod method = null;
        BigDecimal zoneFee = BigDecimal.ZERO;
        BigDecimal shippingFee = BigDecimal.ZERO;
        if (shippingMethodId != null && !shippingMethodId.isBlank()) {
            method = shippingMethods.findById(shippingMethodId)
                    .filter(m -> Boolean.TRUE.equals(m.getIsActive()))
                    .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR, "Unknown shipping method"));
        } else if (strict) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Shipping method is required");
        }
        if (method != null) {
            BigDecimal fee = method.getBaseFee();
            if (method.getFreeAbove() != null && subtotal.compareTo(method.getFreeAbove()) >= 0)
                fee = BigDecimal.ZERO;
            if (svc != null && svc.deliveryCharge() != null) zoneFee = svc.deliveryCharge();
            shippingFee = fee.add(zoneFee).setScale(2, RoundingMode.HALF_UP);
        }

        // --- coupon (server-side validation, §32) ---
        BigDecimal couponDiscount = BigDecimal.ZERO;
        ValidationResult couponResult = null;
        String appliedCode = null;
        if (couponCode != null && !couponCode.isBlank()) {
            couponResult = coupons.validate(couponCode, userId, subtotal,
                    lines.stream().map(l -> new CouponService.EligibleLine(l.productId(), l.categoryId(), l.lineTotal())).toList());
            if (couponResult.valid()) {
                couponDiscount = couponResult.discount();
                appliedCode = couponResult.code();
            } else if (strict) {
                throw new BusinessException(ErrorCode.INVALID_COUPON, couponResult.reason());
            }
        }

        // --- payment method ---
        String pm = paymentMethod == null ? null : paymentMethod.toUpperCase();
        if (strict) {
            if (pm == null || !List.of("UPI", "CARD", "NETBANKING", "WALLET", "COD").contains(pm))
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Choose a payment method");
            if ("COD".equals(pm) && !props.getCheckout().isCodEnabled())
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Cash on Delivery is not available");
        }

        BigDecimal grandTotal = subtotal.subtract(couponDiscount).add(taxTotal).add(shippingFee)
                .setScale(2, RoundingMode.HALF_UP);
        return new Context(lines, address, method, svc, subtotal, taxTotal, zoneFee, shippingFee,
                appliedCode, couponDiscount, grandTotal, pm, couponResult);
    }
}
