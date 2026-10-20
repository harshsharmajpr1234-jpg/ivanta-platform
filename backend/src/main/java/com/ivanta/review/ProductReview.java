package com.ivanta.review;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "product_reviews")
@Getter @Setter
public class ProductReview {
    @Id
    @Column(length = 20)
    private String id;                    // REV-NNNNN

    @Column(name = "product_id", nullable = false, length = 16)
    private String productId;

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Column(name = "order_id", length = 20)
    private String orderId;

    @Column(nullable = false)
    private Short rating;

    @Column(length = 140)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(columnDefinition = "TEXT")
    private String images;                // JSON array of storage keys

    @Column(name = "verified_purchase", nullable = false)
    private Boolean verifiedPurchase = false;   // computed server-side (§33)

    @Column(nullable = false, length = 10)
    private String status = "APPROVED";   // PENDING|APPROVED|REJECTED

    @Column(name = "admin_note", length = 300)
    private String adminNote;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
}
