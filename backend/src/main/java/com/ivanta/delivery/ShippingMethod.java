package com.ivanta.delivery;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "shipping_methods")
@Getter @Setter
public class ShippingMethod {
    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 80)
    private String carrier;

    @Column(name = "base_fee", nullable = false)
    private BigDecimal baseFee = BigDecimal.ZERO;

    @Column(name = "free_above")
    private BigDecimal freeAbove;

    @Column(name = "eta_min_days", nullable = false)
    private Short etaMinDays = 2;

    @Column(name = "eta_max_days", nullable = false)
    private Short etaMaxDays = 5;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
