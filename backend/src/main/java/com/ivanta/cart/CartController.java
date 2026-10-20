package com.ivanta.cart;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.CartDtos.*;
import com.ivanta.security.CustomerPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService service;

    @GetMapping
    public ApiResponse<CartView> get(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.view(me.userId()));
    }

    @PostMapping("/items")
    public ApiResponse<CartView> add(@AuthenticationPrincipal CustomerPrincipal me,
                                     @Valid @RequestBody AddItemRequest req) {
        return ApiResponse.ok(service.addItem(me.userId(), req));
    }

    @PatchMapping("/items/{id}")
    public ApiResponse<CartView> update(@AuthenticationPrincipal CustomerPrincipal me,
                                        @PathVariable String id,
                                        @Valid @RequestBody UpdateItemRequest req) {
        return ApiResponse.ok(service.updateItem(me.userId(), id, req));
    }

    @DeleteMapping("/items/{id}")
    public ApiResponse<CartView> remove(@AuthenticationPrincipal CustomerPrincipal me, @PathVariable String id) {
        return ApiResponse.ok(service.removeItem(me.userId(), id));
    }

    @DeleteMapping
    public ApiResponse<CartView> clear(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.clear(me.userId()));
    }
}
