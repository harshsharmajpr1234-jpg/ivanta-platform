package com.ivanta.category;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "brands")
@Getter @Setter
public class Brand {
    @Id
    @Column(length = 16)
    private String id;

    @Column(nullable = false, length = 80, unique = true)
    private String name;

    @Column(nullable = false, length = 100, unique = true)
    private String slug;

    @Column(name = "logo_key", length = 255)
    private String logoKey;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
