package com.ivanta.cart;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "carts")
@Getter @Setter
public class Cart {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "user_id", nullable = false, length = 16, unique = true)
    private String userId;

    @Column(nullable = false, length = 12)
    private String status = "ACTIVE";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
}
