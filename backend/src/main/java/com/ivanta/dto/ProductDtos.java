package com.ivanta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

/** Catalog DTOs (§9/§11/§12). */
public final class ProductDtos {
    private ProductDtos() { }

    public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) { }

    public record ProductListItem(String id, String name, String slug, String brand, String category,
                                  BigDecimal price, BigDecimal mrp, int discountPct,
                                  BigDecimal ratingAvg, int ratingCount, String imageKey,
                                  String stockStatus, boolean featured, Short releaseYear,
                                  String shortDescription) { }

    public record VariantView(String id, String sku, String name, String storage, String color,
                              String connectivity, String size, BigDecimal price, BigDecimal mrp,
                              long available, String stockStatus) { }

    public record ColorView(String id, String name, String hex) { }
    public record StorageView(String id, String storage) { }
    public record SpecView(String specKey, String specValue) { }
    public record ImageView(String id, String storageKey, String alt, boolean isMain, boolean isThumbnail) { }

    public record ProductDetail(String id, String sku, String name, String slug, String brand,
                                String category, String model, String shortDescription, String description,
                                BigDecimal price, BigDecimal mrp, int discountPct, BigDecimal taxRate,
                                String stockStatus, Short releaseYear, short warrantyMonths, boolean featured,
                                BigDecimal ratingAvg, int ratingCount,
                                List<VariantView> variants, List<ColorView> colors,
                                List<StorageView> storages, List<SpecView> specs, List<ImageView> images) { }

    public record CategoryNode(String id, String name, String slug, String description,
                               String imageKey, long productCount, List<CategoryNode> children) { }

    public record ProductUpsert(String sku, @NotBlank String name, String slug,
                                @NotBlank String brandId, @NotBlank String categoryId,
                                String model, String shortDescription, String description,
                                @NotNull @PositiveOrZero BigDecimal price,
                                @NotNull @PositiveOrZero BigDecimal mrp,
                                BigDecimal taxRate, Short releaseYear, Short warrantyMonths,
                                Boolean featured, Boolean isActive) { }

    public record VariantUpsert(String sku, String name, String storage, String color,
                                String connectivity, String size, String modelNumber,
                                @NotNull @PositiveOrZero BigDecimal price,
                                @NotNull @PositiveOrZero BigDecimal mrp, Boolean isActive) { }

    public record PriceUpdateRequest(@NotNull @PositiveOrZero BigDecimal price,
                                     @NotNull @PositiveOrZero BigDecimal mrp, String variantId) { }

    public record SpecUpsert(@NotBlank String specKey, @NotBlank String specValue, Integer sortOrder) { }

    public record ColorUpsert(@NotBlank String name, @NotBlank String hex, Integer sortOrder) { }

    public record StorageOptionUpsert(@NotBlank String storage, Integer sortOrder) { }

    public record PricingHistoryRow(String id, String variantId, BigDecimal price, BigDecimal mrp,
                                    String effectiveFrom, String effectiveTo) { }

    public record CategoryUpsert(@NotBlank String name, String parentId, String description, String imageKey, Integer sortOrder) { }
}
