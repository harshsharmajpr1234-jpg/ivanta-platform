package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "states")
@Getter @Setter
public class StateEntity {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "country_id", nullable = false, length = 16)
    private String countryId = "CTY-IN";

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 2)
    private String code;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
