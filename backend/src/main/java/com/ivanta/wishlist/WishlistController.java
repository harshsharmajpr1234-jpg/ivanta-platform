package com.ivanta.wishlist;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.ProductDtos.ProductListItem;
import com.ivanta.security.CustomerPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService service;

    @GetMapping
    public ApiResponse<List<ProductListItem>> get(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.view(me.userId()));
    }

    @GetMapping("/ids")
    public ApiResponse<List<String>> ids(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.productIds(me.userId()));
    }

    @PostMapping("/{productId}")
    public ApiResponse<List<ProductListItem>> add(@AuthenticationPrincipal CustomerPrincipal me,
                                                  @PathVariable String productId) {
        service.add(me.userId(), productId);
        return ApiResponse.ok(service.view(me.userId()));
    }

    @DeleteMapping("/{productId}")
    public ApiResponse<List<ProductListItem>> remove(@AuthenticationPrincipal CustomerPrincipal me,
                                                     @PathVariable String productId) {
        service.remove(me.userId(), productId);
        return ApiResponse.ok(service.view(me.userId()));
    }
}
