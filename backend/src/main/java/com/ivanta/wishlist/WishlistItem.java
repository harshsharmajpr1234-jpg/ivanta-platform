package com.ivanta.wishlist;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "wishlist_items")
@Getter @Setter
public class WishlistItem {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "wishlist_id", nullable = false, length = 16)
    private String wishlistId;

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "added_at", nullable = false, insertable = false, updatable = false)
    private Instant addedAt;
}
