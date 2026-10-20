package com.ivanta.review;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.ReviewDtos.*;
import com.ivanta.security.CustomerPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Reviews (§33): public read of approved reviews, authenticated write. */
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService service;

    @GetMapping("/product/{productId}")
    public ApiResponse<ReviewListResponse> forProduct(@PathVariable String productId,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(service.forProduct(productId, page, size));
    }

    @PostMapping
    public ApiResponse<ReviewView> create(@AuthenticationPrincipal CustomerPrincipal me,
                                          @Valid @RequestBody ReviewCreateRequest req) {
        return ApiResponse.ok(service.create(me.userId(), req));
    }

    @GetMapping("/me")
    public ApiResponse<List<ReviewView>> mine(@AuthenticationPrincipal CustomerPrincipal me) {
        return ApiResponse.ok(service.forUser(me.userId()));
    }
}
