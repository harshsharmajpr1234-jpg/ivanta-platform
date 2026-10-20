package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "localities")
@Getter @Setter
public class Locality {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "city_id", nullable = false, length = 16)
    private String cityId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false)
    private Boolean popular = false;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
