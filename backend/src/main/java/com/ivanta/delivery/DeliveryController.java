package com.ivanta.delivery;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.DeliveryDtos.TrackingView;
import com.ivanta.security.CustomerPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Customer order tracking (§41) — real backend statuses only. */
@RestController
@RequestMapping("/api/v1/delivery")
@RequiredArgsConstructor
public class DeliveryController {

    private final DeliveryService service;

    @GetMapping("/orders/{orderId}/tracking")
    public ApiResponse<TrackingView> tracking(@AuthenticationPrincipal CustomerPrincipal me,
                                              @PathVariable String orderId) {
        return ApiResponse.ok(service.trackingForUser(me.userId(), orderId));
    }

    @GetMapping("/shipping-methods")
    public ApiResponse<java.util.List<ShippingMethod>> methods() {
        return ApiResponse.ok(service.listMethods());
    }
}
