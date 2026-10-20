package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "roads")
@Getter @Setter
public class Road {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "locality_id", nullable = false, length = 16)
    private String localityId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
