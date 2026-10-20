package com.ivanta.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "product_specifications")
@Getter @Setter
public class ProductSpecification {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "spec_key", nullable = false, length = 80)
    private String specKey;

    @Column(name = "spec_value", nullable = false, length = 400)
    private String specValue;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
