package com.ivanta.product;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.ProductDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Catalog administration (§34/§38). Thin controller — rules in AdminProductService. */
@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    private final AdminProductService admin;
    private final ProductService catalog;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<PageResponse<ProductListItem>> list(@RequestParam(defaultValue = "0") int page,
                                                           @RequestParam(defaultValue = "20") int size,
                                                           @RequestParam(required = false) String q,
                                                           @RequestParam(required = false) String categoryId,
                                                           @RequestParam(required = false) String status,
                                                           @RequestParam(required = false) Boolean featured) {
        return ApiResponse.ok(admin.listAdminProducts(page, size, q, categoryId, status, featured));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<ProductDetail> detail(@PathVariable String id) {
        return ApiResponse.ok(catalog.detail(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_CREATE')")
    public ApiResponse<ProductDetail> create(@Valid @RequestBody ProductUpsert req) {
        String id = admin.create(req);
        return ApiResponse.ok(catalog.detail(id));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductDetail> update(@PathVariable String id, @RequestBody ProductUpsert req) {
        admin.update(id, req);
        return ApiResponse.ok(catalog.detail(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ProductDetail> putUpdate(@PathVariable String id, @RequestBody ProductUpsert req) {
        admin.update(id, req);
        return ApiResponse.ok(catalog.detail(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_ARCHIVE')")
    public ApiResponse<Void> archive(@PathVariable String id) {
        admin.archive(id);
        return ApiResponse.ok();
    }

    @DeleteMapping("/{id}/hard")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE')")
    public ApiResponse<Void> hardDelete(@PathVariable String id) {
        admin.hardDelete(id);
        return ApiResponse.ok();
    }

    @PostMapping("/{id}/variants")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<VariantView> addVariant(@PathVariable String id, @Valid @RequestBody VariantUpsert req) {
        return ApiResponse.ok(admin.addVariant(id, req));
    }

    @PatchMapping("/variants/{variantId}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<VariantView> updateVariant(@PathVariable String variantId, @RequestBody VariantUpsert req) {
        return ApiResponse.ok(admin.updateVariant(variantId, req));
    }

    @PutMapping("/variants/{variantId}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<VariantView> putUpdateVariant(@PathVariable String variantId, @RequestBody VariantUpsert req) {
        return ApiResponse.ok(admin.updateVariant(variantId, req));
    }

    @DeleteMapping("/variants/{variantId}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<Void> deleteVariant(@PathVariable String variantId) {
        admin.deactivateVariant(variantId);
        return ApiResponse.ok();
    }

    @PutMapping("/{id}/pricing")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<Void> updatePrice(@PathVariable String id, @Valid @RequestBody PriceUpdateRequest req) {
        admin.updatePrice(id, req);
        return ApiResponse.ok();
    }

    @GetMapping("/{id}/pricing/history")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<List<PricingHistoryRow>> priceHistory(@PathVariable String id) {
        return ApiResponse.ok(admin.priceHistory(id));
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ImageView> uploadImage(@PathVariable String id,
                                              @RequestParam("file") MultipartFile file,
                                              @RequestParam(value = "variantId", required = false) String variantId,
                                              @RequestParam(value = "main", defaultValue = "false") boolean main) {
        return ApiResponse.ok(admin.uploadImage(id, variantId, file, main));
    }

    @DeleteMapping("/images/{imageId}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<Void> deactivateImage(@PathVariable String imageId) {
        admin.deactivateImage(imageId);
        return ApiResponse.ok();
    }

    @PostMapping("/{id}/specs")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<SpecView> addSpec(@PathVariable String id, @Valid @RequestBody SpecUpsert req) {
        return ApiResponse.ok(admin.addSpec(id, req));
    }

    @DeleteMapping("/specs/{specId}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<Void> deleteSpec(@PathVariable String specId) {
        admin.deleteSpec(specId);
        return ApiResponse.ok();
    }

    @PostMapping("/{id}/colors")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<ColorView> addColor(@PathVariable String id, @Valid @RequestBody ColorUpsert req) {
        return ApiResponse.ok(admin.addColor(id, req));
    }

    @PostMapping("/{id}/storage-options")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<StorageView> addStorageOption(@PathVariable String id, @Valid @RequestBody StorageOptionUpsert req) {
        return ApiResponse.ok(admin.addStorageOption(id, req));
    }
}
