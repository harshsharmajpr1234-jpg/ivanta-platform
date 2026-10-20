package com.ivanta.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "product_storage_options")
@Getter @Setter
public class ProductStorageOption {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(nullable = false, length = 20)
    private String storage;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
