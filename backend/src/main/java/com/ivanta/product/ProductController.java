package com.ivanta.product;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.InventoryDtos.ProductAvailability;
import com.ivanta.dto.ProductDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/** Public catalog endpoints (§6/§11/§12). */
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @GetMapping
    public ApiResponse<PageResponse<ProductListItem>> search(
            @RequestParam(value = "q", required = false) String q,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "brand", required = false) String brand,
            @RequestParam(value = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(value = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(value = "storage", required = false) String storage,
            @RequestParam(value = "color", required = false) String color,
            @RequestParam(value = "inStock", required = false) Boolean inStock,
            @RequestParam(value = "minRating", required = false) BigDecimal minRating,
            @RequestParam(value = "sort", required = false, defaultValue = "popular") String sort,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "12") int size) {
        return ApiResponse.ok(service.search(new ProductService.SearchParams(
                q, category, brand, minPrice, maxPrice, storage, color, inStock, minRating, sort, page, size)));
    }

    @GetMapping("/featured")
    public ApiResponse<List<ProductListItem>> featured() {
        return ApiResponse.ok(service.featured());
    }

    @GetMapping("/{idOrSlug}")
    public ApiResponse<ProductDetail> detail(@PathVariable String idOrSlug) {
        return ApiResponse.ok(service.detail(idOrSlug));
    }

    @GetMapping("/slug/{slug}")
    public ApiResponse<ProductDetail> bySlug(@PathVariable String slug) {
        return ApiResponse.ok(service.detail(slug));
    }

    @GetMapping("/{id}/related")
    public ApiResponse<List<ProductListItem>> related(@PathVariable String id) {
        return ApiResponse.ok(service.related(id));
    }

    @GetMapping("/{id}/availability")
    public ApiResponse<ProductAvailability> availability(@PathVariable String id) {
        return ApiResponse.ok(service.availability(id));
    }
}
