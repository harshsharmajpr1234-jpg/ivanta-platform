package com.ivanta.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "districts")
@Getter @Setter
public class District {
    @Id
    @Column(length = 16)
    private String id;

    @Column(name = "state_id", nullable = false, length = 16)
    private String stateId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
