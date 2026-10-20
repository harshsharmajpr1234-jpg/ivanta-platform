package com.ivanta.category;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.ProductDtos.CategoryUpsert;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final CategoryAdminService service;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ApiResponse<List<Category>> list() {
        return ApiResponse.ok(service.list());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PRODUCT_CREATE')")
    public ApiResponse<Category> create(@Valid @RequestBody CategoryUpsert req) {
        return ApiResponse.ok(service.create(req));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<Category> update(@PathVariable String id, @RequestBody CategoryUpsert req) {
        return ApiResponse.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE')")
    public ApiResponse<Void> deactivate(@PathVariable String id) {
        service.deactivate(id);
        return ApiResponse.ok();
    }
}
