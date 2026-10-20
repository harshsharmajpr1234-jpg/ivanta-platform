package com.ivanta.cart;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "cart_items")
@Getter @Setter
public class CartItem {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "cart_id", nullable = false, length = 16)
    private String cartId;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "variant_id", length = 16)
    private String variantId;

    @Column(nullable = false)
    private Integer quantity = 1;

    /** Snapshot for display only — totals always recomputed from catalog (§13). */
    @Column(name = "unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal mrp;

    @Column(name = "added_at", nullable = false, insertable = false, updatable = false)
    private Instant addedAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
}
