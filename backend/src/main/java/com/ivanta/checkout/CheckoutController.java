package com.ivanta.checkout;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.OrderDtos.CheckoutPreview;
import com.ivanta.security.CustomerPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Checkout preview (§22) — all totals computed server-side from live data. */
@RestController
@RequestMapping("/api/v1/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final CheckoutService service;

    @PostMapping("/preview")
    public ApiResponse<CheckoutPreview> preview(@AuthenticationPrincipal CustomerPrincipal me,
                                                @RequestParam(required = false) String addressId,
                                                @RequestParam(required = false) String shippingMethodId,
                                                @RequestParam(required = false) String couponCode,
                                                @RequestParam(required = false) String paymentMethod) {
        return ApiResponse.ok(service.preview(me.userId(), addressId, shippingMethodId, couponCode, paymentMethod));
    }
}
