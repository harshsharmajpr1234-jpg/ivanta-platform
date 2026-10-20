package com.ivanta.inventory;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "warehouses")
@Getter @Setter
public class Warehouse {
    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 16, unique = true)
    private String code;

    @Column(length = 80)
    private String city;

    @Column(length = 80)
    private String state;

    @Column(length = 300)
    private String address;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();
}
