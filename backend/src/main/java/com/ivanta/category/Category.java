package com.ivanta.category;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "categories")
@Getter @Setter
public class Category {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "parent_id", length = 16)
    private String parentId;                 // hierarchy (§8)

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 100, unique = true)
    private String slug;

    @Column(length = 300)
    private String description;

    @Column(name = "image_key", length = 255)
    private String imageKey;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;
}
