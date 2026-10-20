package com.ivanta.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Line item with full price snapshot (§24) — historical orders stay correct. */
@Entity
@Table(name = "order_items")
@Getter @Setter
public class OrderItem {
    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "variant_id", length = 16)
    private String variantId;

    @Column(name = "product_name", nullable = false, length = 160)
    private String productName;

    @Column(name = "variant_name", length = 160)
    private String variantName;

    @Column(length = 60)
    private String color;                    // snapshot (§: never changes with catalog edits)

    @Column(length = 40)
    private String storage;

    @Column(nullable = false, length = 40)
    private String sku;

    @Column(name = "image_key", length = 255)
    private String imageKey;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "tax_rate", nullable = false)
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "final_price", nullable = false)
    private BigDecimal finalPrice;
}
