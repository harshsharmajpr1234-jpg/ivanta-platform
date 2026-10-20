package com.ivanta.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class ReviewDtos {
    private ReviewDtos() { }

    public record ReviewCreateRequest(@NotBlank String productId,
                                      @NotNull @Min(1) @Max(5) Short rating,
                                      String title, String body) { }

    public record ReviewView(String id, String productId, String userName, short rating, String title,
                             String body, boolean verifiedPurchase, String status, String createdAt) { }

    public record ReviewListResponse(java.util.List<ReviewView> content, int page, int size,
                                     long totalElements, int totalPages, double ratingAvg, long ratingCount) { }

    public record ModerateRequest(@NotBlank String status, String adminNote) { }
}
