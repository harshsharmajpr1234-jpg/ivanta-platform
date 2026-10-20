package com.ivanta.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "product_images")
@Getter @Setter
public class ProductImage {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "variant_id", length = 16)
    private String variantId;

    @Column(name = "storage_key", nullable = false, length = 255)
    private String storageKey;

    @Column(length = 200)
    private String alt;

    @Column(name = "is_main", nullable = false)
    private Boolean isMain = false;

    @Column(name = "is_thumbnail", nullable = false)
    private Boolean isThumbnail = false;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
