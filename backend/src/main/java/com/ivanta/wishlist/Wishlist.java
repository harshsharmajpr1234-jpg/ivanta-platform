package com.ivanta.wishlist;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "wishlists")
@Getter @Setter
public class Wishlist {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "user_id", nullable = false, length = 16, unique = true)
    private String userId;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();
}
