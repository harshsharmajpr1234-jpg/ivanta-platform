package com.ivanta.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "products")
@Getter @Setter
public class Product {
    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 40, unique = true)
    private String sku;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 180, unique = true)
    private String slug;

    @Column(name = "brand_id", nullable = false, length = 16)
    private String brandId;

    @Column(name = "category_id", nullable = false, length = 16)
    private String categoryId;

    @Column(length = 120)
    private String model;

    @Column(name = "short_description", length = 400)
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private BigDecimal mrp;

    @Column(name = "tax_rate", nullable = false)
    private BigDecimal taxRate = BigDecimal.ZERO;

    /** Cached inventory rollup: IN_STOCK|LOW_STOCK|OUT_OF_STOCK|DISCONTINUED (§9). */
    @Column(name = "stock_status", nullable = false, length = 16)
    private String stockStatus = "OUT_OF_STOCK";

    @Column(name = "release_year")
    private Short releaseYear;

    @Column(name = "warranty_months", nullable = false)
    private Short warrantyMonths = 1;

    @Column(name = "return_window_days")
    private Integer returnWindowDays;        // overrides global returns.window-days when set (§19)

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean featured = false;

    @Column(name = "rating_avg", nullable = false)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    private Integer ratingCount = 0;

    @Column(name = "views_count", nullable = false)
    private Integer viewsCount = 0;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deleted_by", length = 16)
    private String deletedBy;

    @Version
    @Column(nullable = false)
    private Integer version;
}
