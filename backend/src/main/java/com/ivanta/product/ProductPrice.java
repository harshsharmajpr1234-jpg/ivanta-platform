package com.ivanta.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/** Price history (§44): superseding rows, never modified after close. */
@Entity
@Table(name = "product_prices")
@Getter @Setter
public class ProductPrice {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "variant_id", length = 16)
    private String variantId;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private BigDecimal mrp;

    @Column(name = "effective_from", nullable = false)
    private Instant effectiveFrom;

    @Column(name = "effective_to")
    private Instant effectiveTo;

    @Column(name = "created_by", updatable = false)
    private String createdBy;
}
