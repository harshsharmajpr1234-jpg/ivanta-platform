package com.ivanta.delivery;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Immutable per-order address snapshot (§7 delivery_addresses). */
@Entity
@Table(name = "delivery_addresses")
@Getter @Setter
public class DeliveryAddress {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "order_id", nullable = false, length = 20, unique = true)
    private String orderId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "address_line_1", nullable = false, length = 200)
    private String addressLine1;

    @Column(name = "address_line_2", length = 200)
    private String addressLine2;

    @Column(length = 120)
    private String locality;

    @Column(length = 120)
    private String road;

    @Column(nullable = false, length = 80)
    private String city;

    @Column(length = 80)
    private String district;

    @Column(nullable = false, length = 80)
    private String state;

    @Column(nullable = false, length = 6)
    private String pincode;

    @Column(nullable = false, length = 80)
    private String country = "India";

    @Column(length = 200)
    private String landmark;

    @Column(name = "address_type", nullable = false, length = 10)
    private String addressType = "HOME";

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;
}
