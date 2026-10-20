package com.ivanta.coupon;

import com.ivanta.cart.CartItem;
import com.ivanta.cart.CartService;
import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.CouponDtos.*;
import com.ivanta.product.Product;
import com.ivanta.product.ProductRepository;
import com.ivanta.product.ProductVariantRepository;
import com.ivanta.security.CustomerPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Customer coupon validation (§32) — recomputed from the live cart, never client totals. */
@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService coupons;
    private final CartService carts;
    private final ProductRepository products;
    private final ProductVariantRepository variants;

    @PostMapping("/validate")
    @Transactional(readOnly = true)
    public ApiResponse<ValidationResult> validate(@AuthenticationPrincipal CustomerPrincipal me,
                                                  @Valid @RequestBody ValidateRequest req) {
        List<CartItem> items = carts.rawItems(me.userId());
        BigDecimal subtotal = BigDecimal.ZERO;
        List<CouponService.EligibleLine> lines = new ArrayList<>();
        for (CartItem i : items) {
            Product p = products.findById(i.getProductId()).orElse(null);
            if (p == null) continue;
            BigDecimal unit = i.getVariantId() == null ? p.getPrice()
                    : variants.findById(i.getVariantId()).map(v -> v.getPrice()).orElse(p.getPrice());
            BigDecimal line = unit.multiply(BigDecimal.valueOf(i.getQuantity()));
            subtotal = subtotal.add(line);
            lines.add(new CouponService.EligibleLine(p.getId(), p.getCategoryId(), line));
        }
        if (items.isEmpty())
            return ApiResponse.ok(new ValidationResult(false, req.code(), null, BigDecimal.ZERO, "Your cart is empty"));
        return ApiResponse.ok(coupons.validate(req.code(), me.userId(), subtotal, lines));
    }
}
