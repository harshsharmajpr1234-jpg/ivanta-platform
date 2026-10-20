package com.ivanta.category;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.ProductDtos.CategoryNode;
import com.ivanta.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public category tree (§8). */
@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final ProductService products;

    @GetMapping
    public ApiResponse<List<CategoryNode>> tree() {
        return ApiResponse.ok(products.categoryTree());
    }
}
