package com.ivanta.returnrefund;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "return_items")
@Getter @Setter
public class ReturnItem {
    @Id
    @Column(length = 20)
    private String id;

    @Column(name = "return_id", nullable = false, length = 20)
    private String returnId;

    @Column(name = "order_item_id", nullable = false, length = 20)
    private String orderItemId;

    @Column(name = "product_name", nullable = false, length = 160)
    private String productName;

    @Column(name = "variant_name", length = 160)
    private String variantName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "refund_amount", nullable = false)
    private BigDecimal refundAmount = BigDecimal.ZERO;
}
