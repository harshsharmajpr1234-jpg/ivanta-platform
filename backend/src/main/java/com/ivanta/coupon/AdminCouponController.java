package com.ivanta.coupon;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.CouponDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/coupons")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('COUPON_MANAGE')")
public class AdminCouponController {

    private final CouponService service;

    @GetMapping
    public ApiResponse<List<CouponView>> list() {
        return ApiResponse.ok(service.list());
    }

    @PostMapping
    public ApiResponse<CouponView> create(@Valid @RequestBody CouponUpsert req) {
        return ApiResponse.ok(service.create(req));
    }

    @PatchMapping("/{id}")
    public ApiResponse<CouponView> update(@PathVariable String id, @RequestBody CouponUpsert req) {
        return ApiResponse.ok(service.update(id, req));
    }

    @GetMapping("/{id}/usage")
    public ApiResponse<List<UsageView>> usage(@PathVariable String id) {
        return ApiResponse.ok(service.usages(id));
    }
}
